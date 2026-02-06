require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { pool } = require('./config/db');

const authRoutes = require('./routes/auth');
const therapistRoutes = require('./routes/therapists');
const pricingRoutes = require('./routes/pricing');
const contactRoutes = require('./routes/contact');
const workshopRoutes = require('./routes/workshops');
const contactMessagesRoutes = require('./routes/contactMessages');
const seoRoutes = require('./routes/seo');
const postRoutes = require('./routes/posts');
const contactController = require('./controllers/contactController');
const { getSitemap } = require('./controllers/sitemapController');
const adminRoutes = require('./routes/admin');
const reminderRoutes = require('./routes/reminders');
const syncRoutes = require('./routes/sync');
const { startReminderJob } = require('./services/reminderService');
const { startWeeklyReminderJob } = require('./services/weeklyReminderService');

// Start Cron Jobs
startReminderJob();
startWeeklyReminderJob();

// Auto-migration for calendar_alias
(async () => {
  try {
    const { query } = require('./config/db');
    await query("ALTER TABLE therapists ADD COLUMN IF NOT EXISTS calendar_alias VARCHAR(50);");
    console.log('✅ Auto-migration: calendar_alias column checked/created');
  } catch (err) {
    console.error('⚠️ Auto-migration failed:', err.message);
  }
})();

// Auto-migration for invoice_submissions FK
(async () => {
  try {
    const { query } = require('./config/db');
    // Drop potentially incorrect constraint
    await query("ALTER TABLE invoice_submissions DROP CONSTRAINT IF EXISTS invoice_submissions_therapist_id_fkey;");
    // Add correct constraint pointing to therapists
    await query("ALTER TABLE invoice_submissions ADD CONSTRAINT invoice_submissions_therapist_id_fkey FOREIGN KEY (therapist_id) REFERENCES therapists(id) ON DELETE CASCADE;");
    console.log('✅ Auto-migration: invoice_submissions FK fixed');
  } catch (err) {
    // Ignore if constraint already exists or other non-critical errors (or log them)
    // If duplicates exist, it might fail. We assume mostly clean state.
    console.error('⚠️ Auto-migration invoice FK failed:', err.message);
  }
})();

// Auto-recalculation for incorrect totals (fix for excluded sessions bug)
(async () => {
  try {
    const { pool } = require('./config/db');
    const { getSessions } = require('./services/calendarService');

    console.log('🔄 Auto-migration: Recalculating invoice totals...');
    const res = await pool.query('SELECT * FROM invoice_submissions');
    const invoices = res.rows;

    for (const invoice of invoices) {
      const year = parseInt(invoice.year);
      const month = parseInt(invoice.month);
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      const CALENDAR_ID = 'esencialmentepsicologia@gmail.com';

      try {
        // 1. Fetch sessions
        const sessions = await getSessions(CALENDAR_ID, startDate, endDate);
        const therapistSessions = sessions.filter(s => s.therapistId === invoice.therapist_id);

        // 2. Fetch payment statuses to handle cancellations and price overrides
        const sessionIds = therapistSessions.map(s => s.id);
        let payments = [];
        if (sessionIds.length > 0) {
          const paymentResult = await pool.query(
            `SELECT event_id, payment_type, marked_at, original_price, modified_price 
                         FROM session_payments 
                         WHERE event_id = ANY($1) AND therapist_id = $2`,
            [sessionIds, invoice.therapist_id]
          );
          payments = paymentResult.rows;
        }
        const paymentMap = {};
        payments.forEach(p => paymentMap[p.event_id] = p);

        // 3. Filter billable sessions (Active count)
        const billableSessions = [];
        therapistSessions.forEach(session => {
          const payment = paymentMap[session.id];
          if (payment) {
            if (payment.original_price) session.price = parseFloat(payment.original_price);
            if (payment.modified_price) session.price = parseFloat(payment.modified_price);
            session.paymentStatus = payment.payment_type;
          } else {
            session.paymentStatus = 'pending';
          }

          // Strict filtering: count only if valid price, not cancelled, and not libre
          if (session.price > 0 && session.paymentStatus !== 'cancelled' && !session.isLibre) {
            billableSessions.push(session);
          }
        });

        // 4. Apply exclusions
        let excludedIds = new Set();
        if (invoice.excluded_session_ids) {
          const ids = typeof invoice.excluded_session_ids === 'string'
            ? JSON.parse(invoice.excluded_session_ids)
            : invoice.excluded_session_ids;
          ids.forEach(id => excludedIds.add(id));
        }

        const activeSessions = billableSessions.filter(s => !excludedIds.has(s.id));
        const subtotal = activeSessions.reduce((sum, s) => sum + (s.price || 0), 0);

        const centerPercentage = parseFloat(invoice.center_percentage);
        const centerAmount = subtotal * (centerPercentage / 100);
        const baseDisponible = subtotal - centerAmount;
        const irpfPercentage = parseFloat(invoice.irpf_percentage);
        const irpfAmount = baseDisponible * (irpfPercentage / 100);
        const ivaPercentage = parseFloat(invoice.iva_percentage) || 0;
        const ivaAmount = baseDisponible * (ivaPercentage / 100);
        const totalFactura = baseDisponible + ivaAmount - irpfAmount;

        await pool.query(
          `UPDATE invoice_submissions 
                     SET subtotal = $1, center_amount = $2, irpf_amount = $3, iva_amount = $4, total_amount = $5
                     WHERE id = $6`,
          [subtotal, centerAmount, irpfAmount, ivaAmount, totalFactura, invoice.id]
        );
      } catch (innerErr) {
        console.error(`⚠️ Failed to recalculate invoice ${invoice.id}:`, innerErr.message);
      }
    }
    console.log('✅ Auto-migration: Invoices recalculated successfully');
  } catch (err) {
    console.error('⚠️ Auto-migration invoice recalc failed:', err.message);
  }
})();

const app = express();

// --- CORS: permite tu front en Vercel (y local) ---
const defaultOrigins = [
  'https://esencialmentepsicologia-gpdf.vercel.app',
  'https://www.esencialmentepsicologia.com',
  'https://esencialmentepsicologia.com',
  'http://localhost:3000',
  'http://localhost:3001'
];
const allowed = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .concat(defaultOrigins);

app.use(cors({
  origin: true, // Refleja el origen de la petición (permite cualquiera, útil para evitar errores en deploy)
  /*
  origin(origin, cb) {
    // Debug: Loguear origen si falla
    if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    console.error('❌ Blocked by CORS:', origin);
    cb(new Error(`Not allowed by CORS: ${origin}`));
  }, 
  */
  credentials: true
}));

// Preflight
app.options('*', cors());

app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Static files for uploaded therapist photos
const photosDir = path.join(__dirname, '../client/public/assets/terapeutas');
app.use('/uploads/terapeutas', express.static(photosDir));

// Static files for workshop images
const workshopsDir = path.join(__dirname, '../client/public/assets/talleres');
app.use('/uploads/talleres', express.static(workshopsDir));

// --- Verificar conexión a PostgreSQL ---
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('PostgreSQL connection error:', err.message);
    console.error('Make sure DATABASE_URL is set correctly in .env');
  } else {
    console.log('✅ Connected to PostgreSQL (Neon)');
    console.log('Server time:', res.rows[0].now);
  }
});

// --- Rutas ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes); // New Admin Routes (Billing, Users)
app.use('/api/admin/reminders', reminderRoutes); // Reminder queue admin routes
app.use('/api/therapists', therapistRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/admin/contact-messages', contactMessagesRoutes);
app.get('/sitemap.xml', getSitemap);
app.use('/api', seoRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin/sync', syncRoutes);

// Health & raíz
app.get('/health', (req, res) => res.json({ ok: true, database: 'postgresql' }));
app.get('/', (req, res) => res.send('Psychology Clinic API is running with PostgreSQL (Neon)'));

// Errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// --- Arranque ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Database: PostgreSQL (Neon)`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('PostgreSQL pool has ended');
  });
});

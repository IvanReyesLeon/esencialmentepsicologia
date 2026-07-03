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

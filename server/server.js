require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const therapistRoutes = require('./routes/therapists');
const pricingRoutes = require('./routes/pricing');
const contactRoutes = require('./routes/contact');

const app = express();

// --- CORS: permite tu front en Vercel (y local) ---
const defaultOrigins = ['https://esencialmentepsicologia-gpdf-j5u1bdgzv.vercel.app', 'http://localhost:3000', 'http://localhost:3001'];
const allowed = (process.env.CLIENT_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .concat(defaultOrigins);

app.use(cors({
  origin(origin, cb) {
    // Permite peticiones sin origin (curl/healthchecks) o si está en la lista
    if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Preflight
app.options('*', cors());

app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Static files for uploaded therapist photos (served at /uploads/terapeutas)
const photosDir = path.join(__dirname, '../client/public/assets/terapeutas');
app.use('/uploads/terapeutas', express.static(photosDir));

// --- Conexión a MongoDB Atlas ---
mongoose
  .connect(process.env.MONGODB_URI, {
    // Estos flags ya son default en Mongoose >= 6, los dejo por claridad
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // keepAlive ayuda en PaaS
    serverSelectionTimeoutMS: 15000
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// --- Rutas ---
app.use('/api/auth', authRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/contact', contactRoutes);

// Health & raíz
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/', (req, res) => res.send('Psychology Clinic API is running'));

// Errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// --- Arranque ---
const PORT = process.env.PORT || 5000; // Render asigna PORT
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

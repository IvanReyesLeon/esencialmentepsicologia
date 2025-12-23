/**
 * Sync Routes
 * Rutas para sincronización de sesiones y gestión de datos
 */

const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const syncController = require('../controllers/syncController');

// Todas las rutas requieren autenticación y rol admin
router.use(auth);
router.use(admin);

// Sincronización
router.post('/year', syncController.syncYear);
router.post('/month', syncController.syncMonth);
router.post('/recent', syncController.syncRecent);
router.post('/range', syncController.syncRange);

// Estadísticas
router.get('/stats', syncController.getSyncStats);
router.get('/monthly-billing', syncController.getMonthlyBilling);

// Pacientes
router.get('/patients', syncController.getPatients);

module.exports = router;

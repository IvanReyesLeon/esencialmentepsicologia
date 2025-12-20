const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const billingController = require('../controllers/billingController');

// === Billing Routes ===

// Get months overview (for navigation)
router.get('/billing/months', auth, billingController.getMonthsOverview);

// Get weeks of a month
router.get('/billing/weeks', auth, billingController.getWeeks);
router.get('/billing/global', auth, billingController.getGlobalSessions);

// Admin: Get weekly summary with all therapists
router.get('/billing/weekly', auth, admin, billingController.getWeeklySummaryAdmin);

// Therapist: Get their own sessions for a week
router.get('/billing/my-sessions', auth, billingController.getTherapistSessions);

// Therapist: Mark a session as paid
router.post('/billing/sessions/:eventId/payment', auth, billingController.markSessionPaid);

module.exports = router;

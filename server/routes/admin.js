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

// Therapist: Get monthly sessions for invoice generation
router.get('/billing/monthly-sessions', auth, billingController.getMonthlyTherapistSessions);

// Therapist: Mark a session as paid
router.post('/billing/sessions/:eventId/payment', auth, billingController.markSessionPaid);

// Billing: Therapist billing data
router.get('/billing/my-data', auth, billingController.getMyBillingData);
router.put('/billing/my-data', auth, billingController.updateMyBillingData);

// Billing: Center billing data
router.get('/billing/center-data', auth, billingController.getCenterBillingData);
router.put('/billing/center-data', auth, billingController.updateCenterBillingData);

module.exports = router;

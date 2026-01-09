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

// Therapist/Admin: Update session price (before marking payment)
router.post('/billing/sessions/:eventId/price', auth, billingController.updateSessionPrice);

// Admin: Revoke price change and reset to pending
router.post('/billing/sessions/:eventId/revoke-price', auth, billingController.revokePriceChange);

// Billing: Therapist billing data
router.get('/billing/my-data', auth, billingController.getMyBillingData);
router.put('/billing/my-data', auth, billingController.updateMyBillingData);

// Billing: Center billing data
router.get('/billing/center-data', auth, billingController.getCenterBillingData);
router.put('/billing/center-data', auth, billingController.updateCenterBillingData);

// Billing: Invoice Submission
router.post('/billing/submit-invoice', auth, billingController.submitInvoice);
router.get('/billing/invoice-status', auth, billingController.checkInvoiceStatus);
router.get('/billing/invoice-submissions', auth, admin, billingController.getInvoiceSubmissions);
router.post('/billing/validate-invoice', auth, admin, billingController.validateInvoiceSubmission);
router.post('/billing/revoke-invoice', auth, admin, billingController.revokeInvoiceSubmission);

// Admin: Payment Review routes
router.get('/billing/review-summary', auth, admin, billingController.getReviewSummary);
router.post('/billing/review-payments', auth, admin, billingController.reviewPayments);

// === Quarterly Reports Routes (Admin Only) ===
const quarterlyController = require('../controllers/quarterlyController');

router.get('/billing/quarterly', auth, admin, quarterlyController.getQuarterlyReport);
router.post('/billing/quarterly', auth, admin, quarterlyController.saveQuarterlyReport);

// === Expenses Routes (Admin Only) ===
const expensesController = require('../controllers/expensesController');

router.get('/expenses', auth, admin, expensesController.getExpenses);
router.post('/expenses', auth, admin, expensesController.createExpense);
router.delete('/expenses/:id', auth, admin, expensesController.deleteExpense);

router.get('/expenses/recurring', auth, admin, expensesController.getRecurringExpenses);
router.post('/expenses/recurring', auth, admin, expensesController.createRecurringExpense);
router.put('/expenses/recurring/:id', auth, admin, expensesController.updateRecurringExpense);
router.delete('/expenses/recurring/:id', auth, admin, expensesController.deleteRecurringExpense);

router.post('/expenses/generate-monthly', auth, admin, expensesController.generateMonthlyExpenses);

// === Notification Routes ===
const notificationController = require('../controllers/notificationController');

router.get('/notifications', auth, notificationController.getNotifications);
router.put('/notifications/:id/read', auth, notificationController.markAsRead);
router.put('/notifications/read-all', auth, notificationController.markAllAsRead);

module.exports = router;

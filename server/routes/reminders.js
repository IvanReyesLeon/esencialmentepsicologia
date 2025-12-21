const express = require('express');
const router = express.Router();
const { getReminderStats, getReminders } = require('../services/reminderService');

// Note: These routes are under /api/admin/reminders which is accessible from the Admin panel
// The Admin panel has its own password protection (admin2024)
// For a production app, you'd want proper JWT auth here

/**
 * GET /api/admin/reminders/stats
 * Get reminder statistics (pending, sent, failed counts)
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await getReminderStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting reminder stats:', error);
        res.status(500).json({ error: 'Error fetching reminder stats' });
    }
});

/**
 * GET /api/admin/reminders
 * Get list of reminders with optional status filter
 * Query params: status (pending|sent|failed), limit (default 50)
 */
router.get('/', async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        const reminders = await getReminders(status || null, parseInt(limit));
        res.json(reminders);
    } catch (error) {
        console.error('Error getting reminders:', error);
        res.status(500).json({ error: 'Error fetching reminders' });
    }
});

module.exports = router;


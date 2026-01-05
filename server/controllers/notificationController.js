const pool = require('../config/db');

/**
 * Get all notifications for the authenticated user
 */
exports.getNotifications = async (req, res) => {
    try {
        // Support both therapist_id (from correct auth) or just use user ID if we had a unified user table
        // For now, assuming permissions middleware sets req.user.id
        const userId = req.user.id;

        const result = await pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ message: 'Error getting notifications' });
    }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await pool.query(
            `UPDATE notifications 
             SET is_read = TRUE 
             WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error updating notification' });
    }
};

/**
 * Mark all as read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await pool.query(
            `UPDATE notifications 
             SET is_read = TRUE 
             WHERE user_id = $1`,
            [userId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'Error updating notifications' });
    }
};

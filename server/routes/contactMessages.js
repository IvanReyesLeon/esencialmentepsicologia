const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllMessages, getUnreadMessages, markAsRead, markAsUnread, deleteMessage, getMessageStats } = require('../models/contactQueries');

// @desc    Get all contact messages
// @route   GET /api/admin/contact-messages
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        const messages = await getAllMessages(limit, offset);
        const stats = await getMessageStats();

        res.json({ messages, stats });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get unread messages
// @route   GET /api/admin/contact-messages/unread
// @access  Private/Admin
router.get('/unread', auth, async (req, res) => {
    try {
        const messages = await getUnreadMessages();
        res.json(messages);
    } catch (error) {
        console.error('Get unread messages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Mark message as read
// @route   PUT /api/admin/contact-messages/:id/read
// @access  Private/Admin
router.put('/:id/read', auth, async (req, res) => {
    try {
        const message = await markAsRead(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json(message);
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Mark message as unread
// @route   PUT /api/admin/contact-messages/:id/unread
// @access  Private/Admin
router.put('/:id/unread', auth, async (req, res) => {
    try {
        const message = await markAsUnread(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json(message);
    } catch (error) {
        console.error('Mark as unread error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Delete message
// @route   DELETE /api/admin/contact-messages/:id
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
    try {
        const message = await deleteMessage(req.params.id);
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        res.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

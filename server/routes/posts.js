const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
// Import auth middleware if needed later for writes
// const { verifyToken, isAdmin } = require('../middleware/auth');

const upload = require('../middleware/upload');

// Public routes
router.get('/', postController.getAllPosts);
router.get('/:slug', postController.getPostBySlug);

// Admin routes
router.post('/', upload.single('image'), postController.createPost);
router.put('/:id', upload.single('image'), postController.updatePost);
router.delete('/:id', postController.deletePost);

module.exports = router;

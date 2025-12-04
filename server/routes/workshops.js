const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    getAllWorkshops,
    getWorkshop,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    addWorkshopImage,
    deleteWorkshopImage
} = require('../controllers/workshopController');

// Public routes
router.get('/', getAllWorkshops);
router.get('/:id', getWorkshop);

// Admin routes
router.post('/', auth, upload.array('images', 5), createWorkshop);
router.put('/:id', auth, upload.array('images', 5), updateWorkshop);
router.delete('/:id', auth, deleteWorkshop);
router.post('/:id/images', auth, upload.single('image'), addWorkshopImage);
router.delete('/images/:imageId', auth, deleteWorkshopImage);

module.exports = router;

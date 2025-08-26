const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getTherapists,
  getTherapist,
  createTherapist,
  updateTherapist,
  updateTherapistPhoto,
  deleteTherapist
} = require('../controllers/therapistController');

// Public routes
router.get('/', getTherapists);
router.get('/:id', getTherapist);

// Protected routes (admin only)
router.post('/', upload.single('photo'), createTherapist);
router.put('/:id/photo', updateTherapistPhoto);
router.put('/:id', auth, admin, updateTherapist);
router.delete('/:id', auth, admin, deleteTherapist);

module.exports = router;

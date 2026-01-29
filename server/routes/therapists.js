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
  deleteTherapist,
  createTherapistAccount,
  getUsedColors,
  getTherapistsWithoutAccount,
  createAccountForTherapist,
  getHiddenTherapists,
  activateTherapistHandler,
  checkTherapistHasAccount,
  hideTherapistHandler,
  deleteTherapistAccountHandler,
  getTherapistsWithAccountHandler,
  deleteTherapistCompletelyHandler
} = require('../controllers/therapistController');

// Public routes
router.get('/', getTherapists);

// Protected routes (admin only) - ALL specific paths BEFORE dynamic :id
router.get('/colors/used', auth, admin, getUsedColors);
router.get('/without-account', auth, admin, getTherapistsWithoutAccount);
router.get('/with-account', auth, admin, getTherapistsWithAccountHandler);
router.get('/hidden', auth, admin, getHiddenTherapists);
router.post('/account', auth, admin, createTherapistAccount);
router.post('/', upload.single('photo'), createTherapist);

// Dynamic :id routes (must come AFTER specific paths)
router.get('/:id', getTherapist);
router.get('/:id/has-account', auth, admin, checkTherapistHasAccount);
router.post('/:id/account', auth, admin, createAccountForTherapist);
router.put('/:id/activate', auth, admin, activateTherapistHandler);
router.put('/:id/hide', auth, admin, hideTherapistHandler);
router.put('/:id/photo', updateTherapistPhoto);
router.put('/:id', auth, admin, upload.single('photo'), updateTherapist);
router.delete('/:id/account', auth, admin, deleteTherapistAccountHandler);
router.delete('/:id/complete', auth, admin, deleteTherapistCompletelyHandler);
router.delete('/:id', auth, admin, deleteTherapist);

module.exports = router;

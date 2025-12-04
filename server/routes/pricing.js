const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const {
  getAllPricing,
  getPricing,
  upsertPricing,
  updatePricing,
  deletePricing
} = require('../controllers/pricingController');

// Public routes
router.get('/', getAllPricing);
router.get('/:id', getPricing);

// Protected routes (admin only)
router.post('/', auth, admin, upsertPricing);
router.put('/:id', auth, admin, updatePricing);
router.delete('/:id', auth, admin, deletePricing);

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const {
  getPricing,
  getPrice,
  updatePricing,
  deletePricing
} = require('../controllers/pricingController');

// Public routes
router.get('/', getPricing);
router.get('/:id', getPrice);

// Protected routes (admin only)
router.post('/', auth, admin, updatePricing);
router.delete('/:id', auth, admin, deletePricing);

module.exports = router;

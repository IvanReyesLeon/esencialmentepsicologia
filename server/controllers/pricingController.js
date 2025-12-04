const {
  getAllPricing,
  getPricingById,
  upsertPricing,
  updatePricing,
  deletePricing
} = require('../models/pricingQueries');

// @desc    Get all pricing
// @route   GET /api/pricing
// @access  Public
exports.getAllPricing = async (req, res) => {
  try {
    const pricing = await getAllPricing();
    res.json(pricing);
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single pricing
// @route   GET /api/pricing/:id
// @access  Public
exports.getPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const pricing = await getPricingById(id);

    if (!pricing) {
      return res.status(404).json({ message: 'Pricing not found' });
    }

    res.json(pricing);
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create or update pricing
// @route   POST /api/pricing
// @access  Private/Admin
exports.upsertPricing = async (req, res) => {
  try {
    const { session_type, price, duration, description } = req.body;

    if (!session_type || !price || !duration || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const pricing = await upsertPricing(session_type, price, duration, description);
    res.json(pricing);
  } catch (error) {
    console.error('Upsert pricing error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update pricing
// @route   PUT /api/pricing/:id
// @access  Private/Admin
exports.updatePricing = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const pricing = await updatePricing(id, updates);

    if (!pricing) {
      return res.status(404).json({ message: 'Pricing not found' });
    }

    res.json(pricing);
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete pricing
// @route   DELETE /api/pricing/:id
// @access  Private/Admin
exports.deletePricing = async (req, res) => {
  try {
    const { id } = req.params;

    const pricing = await deletePricing(id);

    if (!pricing) {
      return res.status(404).json({ message: 'Pricing not found' });
    }

    res.json({ message: 'Pricing removed' });
  } catch (error) {
    console.error('Delete pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const Pricing = require('../models/Pricing');

// @desc    Get all pricing
// @route   GET /api/pricing
// @access  Public
exports.getPricing = async (req, res) => {
  try {
    const pricing = await Pricing.find({ isActive: true });
    res.json(pricing);
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single price
// @route   GET /api/pricing/:id
// @access  Public
exports.getPrice = async (req, res) => {
  try {
    const price = await Pricing.findById(req.params.id);
    
    if (!price || !price.isActive) {
      return res.status(404).json({ message: 'Pricing not found' });
    }
    
    res.json(price);
  } catch (error) {
    console.error('Get price error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create or update pricing
// @route   POST /api/pricing
// @access  Private/Admin
exports.updatePricing = async (req, res) => {
  try {
    const { sessionType, ...updateData } = req.body;
    
    // Check if pricing for this session type already exists
    let pricing = await Pricing.findOne({ sessionType });
    
    if (pricing) {
      // Update existing pricing
      pricing = await Pricing.findOneAndUpdate(
        { sessionType },
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } else {
      // Create new pricing
      pricing = new Pricing({
        sessionType,
        ...updateData
      });
      await pricing.save();
    }
    
    res.json(pricing);
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete pricing
// @route   DELETE /api/pricing/:id
// @access  Private/Admin
exports.deletePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id);
    
    if (!pricing) {
      return res.status(404).json({ message: 'Pricing not found' });
    }
    
    // Soft delete: mark as inactive instead of removing
    pricing.isActive = false;
    await pricing.save();
    
    res.json({ message: 'Pricing removed' });
  } catch (error) {
    console.error('Delete pricing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

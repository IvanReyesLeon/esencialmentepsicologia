const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema({
  sessionType: {
    type: String,
    enum: ['individual', 'couple', 'family', 'group'],
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 30
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pricing', pricingSchema);

const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: [String],
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  education: [{
    degree: String,
    university: String,
    year: Number
  }],
  experience: {
    type: Number, // years of experience
    required: true
  },
  languages: [String],
  photo: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sessionTypes: [{
    type: String,
    enum: ['individual', 'couple', 'family', 'group'],
    required: true
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Therapist', therapistSchema);

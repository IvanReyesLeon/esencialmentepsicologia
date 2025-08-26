const Therapist = require('../models/Therapist');
const User = require('../models/User');

// @desc    Get all therapists
// @route   GET /api/therapists
// @access  Public
exports.getTherapists = async (req, res) => {
  try {
    // Return mock data if database is not available
    const mockTherapists = [
      {
        _id: '1',
        fullName: 'Anna Becerra',
        specialization: ['Directora', 'Psicóloga sanitaria', 'Psicoterapeuta integradora'],
        bio: 'Anna es la directora del centro y cuenta con amplia experiencia en psicología clínica y terapia integradora. Su enfoque se centra en el bienestar integral de sus pacientes.',
        experience: 15,
        languages: ['Español', 'Catalán'],
        photo: 'anna_becerra.jpg',
        sessionTypes: ['Individual', 'Pareja', 'Online']
      },
      {
        _id: '2',
        fullName: 'Lucía Gómez',
        specialization: ['Psicoterapeuta Integradora', 'EMDR'],
        bio: 'Lucía es especialista en terapia EMDR (Eye Movement Desensitization and Reprocessing) y terapia integradora. Trabaja principalmente con trauma y ansiedad.',
        experience: 8,
        languages: ['Español', 'Inglés'],
        photo: 'lucia_gomez.jpeg',
        sessionTypes: ['Individual', 'Online']
      }
    ];

    // Try to get from database first
    try {
      const therapists = await Therapist.find({}).timeout(2000);
      if (therapists && therapists.length > 0) {
        return res.json(therapists);
      }
    } catch (dbError) {
      console.log('Database not available, using mock data');
    }
    
    // Return mock data if database fails
    res.json(mockTherapists);
  } catch (error) {
    console.error('Get therapists error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single therapist
// @route   GET /api/therapists/:id
// @access  Public
exports.getTherapist = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.params.id);
    
    if (!therapist || !therapist.isActive) {
      return res.status(404).json({ message: 'Therapist not found' });
    }
    
    res.json(therapist);
  } catch (error) {
    console.error('Get therapist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create therapist
// @route   POST /api/therapists
// @access  Private/Admin
exports.createTherapist = async (req, res) => {
  try {
    const therapistData = {
      ...req.body,
      // If file was uploaded, use the filename
      photo: req.file ? req.file.filename : req.body.photo || ''
    };
    
    const therapist = new Therapist(therapistData);
    await therapist.save();
    res.status(201).json(therapist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update therapist photo
// @route   PUT /api/therapists/:id/photo
// @access  Private/Admin
exports.updateTherapistPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { photo } = req.body;
    
    const therapist = await Therapist.findByIdAndUpdate(
      id,
      { photo },
      { new: true, runValidators: true }
    );

    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    res.json(therapist);
  } catch (error) {
    console.error('Update therapist photo error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update therapist
// @route   PUT /api/therapists/:id
// @access  Private/Admin
exports.updateTherapist = async (req, res) => {
  try {
    const { username, email, password, ...updateData } = req.body;
    
    let therapist = await Therapist.findById(req.params.id);
    
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }
    
    // Update therapist data
    therapist = await Therapist.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    // Update user data if provided
    if (username || email) {
      const userUpdate = {};
      if (username) userUpdate.username = username;
      if (email) userUpdate.email = email;
      
      await User.findByIdAndUpdate(
        therapist.user,
        { $set: userUpdate },
        { new: true, runValidators: true }
      );
    }
    
    res.json(therapist);
  } catch (error) {
    console.error('Update therapist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete therapist
// @route   DELETE /api/therapists/:id
// @access  Private/Admin
exports.deleteTherapist = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.params.id);
    
    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }
    
    // Soft delete: mark as inactive instead of removing
    therapist.isActive = false;
    await therapist.save();
    
    // Also deactivate the user account
    await User.findByIdAndUpdate(
      therapist.user,
      { isActive: false },
      { new: true }
    );
    
    res.json({ message: 'Therapist removed' });
  } catch (error) {
    console.error('Delete therapist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const Therapist = require('../models/Therapist');
const User = require('../models/User');

// Helpers to normalize inputs coming from multipart/form-data
const normalizeToArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];
    // Try JSON first if it looks like an array string
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch (e) {
        // fall through to CSV split
      }
    }
    return s.split(',').map((x) => x.trim()).filter(Boolean);
  }
  if (value == null) return [];
  return [String(value)];
};

const normalizeSessionTypes = (value) => {
  const allowed = new Set(['individual', 'couple', 'family', 'group']);
  return normalizeToArray(value)
    .map((v) => String(v).toLowerCase().trim())
    .filter((v) => allowed.has(v));
};

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
    // Normalize incoming body (multipart/form-data makes everything strings)
    const therapistData = { ...req.body };

    therapistData.fullName = (therapistData.fullName || '').trim();
    therapistData.bio = (therapistData.bio || '').trim();
    therapistData.experience = Number(therapistData.experience ?? 0);
    therapistData.specialization = normalizeToArray(therapistData.specialization);
    therapistData.languages = normalizeToArray(therapistData.languages);
    therapistData.sessionTypes = normalizeSessionTypes(therapistData.sessionTypes);

    // If file was uploaded, use the filename; otherwise keep provided name or empty
    therapistData.photo = req.file ? req.file.filename : (therapistData.photo || '');
    
    const therapist = new Therapist(therapistData);
    await therapist.save();
    res.status(201).json(therapist);
  } catch (error) {
    console.error('Create therapist validation error:', error);
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

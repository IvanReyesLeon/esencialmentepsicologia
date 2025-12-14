const {
  getAllTherapists,
  getTherapistById,
  getTherapistBySlug,
  createTherapist,
  updateTherapist,
  deleteTherapist
} = require('../models/therapistQueries');

// @desc    Get all therapists
// @route   GET /api/therapists
// @access  Public
exports.getTherapists = async (req, res) => {
  try {
    const therapists = await getAllTherapists();
    res.json(therapists);
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
    const { id } = req.params;

    //  Intentar buscar por ID o por slug
    let therapist;
    if (isNaN(id)) {
      // Si no es un número, buscar por slug
      therapist = await getTherapistBySlug(id);
    } else {
      therapist = await getTherapistById(id);
    }

    if (!therapist || !therapist.is_active) {
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
    // Normalizar datos entrantes (multipart/form-data puede enviar arrays como strings)
    const therapistData = { ...req.body };

    // Asegurar que los arrays sean arrays
    if (typeof therapistData.specializations === 'string') {
      try {
        therapistData.specializations = JSON.parse(therapistData.specializations);
      } catch {
        therapistData.specializations = therapistData.specializations.split(',').map(s => s.trim());
      }
    }

    if (typeof therapistData.languages === 'string') {
      try {
        therapistData.languages = JSON.parse(therapistData.languages);
      } catch {
        therapistData.languages = therapistData.languages.split(',').map(s => s.trim());
      }
    }

    if (typeof therapistData.session_types === 'string') {
      try {
        therapistData.session_types = JSON.parse(therapistData.session_types);
      } catch {
        therapistData.session_types = therapistData.session_types.split(',').map(s => s.trim());
      }
    }

    if (typeof therapistData.education === 'string') {
      try {
        therapistData.education = JSON.parse(therapistData.education);
      } catch {
        therapistData.education = [];
      }
    }

    // If file was uploaded, use the Cloudinary URL
    if (req.file) {
      therapistData.photo = req.file.path;
    }

    const therapist = await createTherapist(therapistData);
    res.status(201).json(therapist);
  } catch (error) {
    console.error('Create therapist error:', error);
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

    const therapist = await updateTherapist(id, { photo });

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
    const { id } = req.params;
    const updateData = { ...req.body };

    // Normalizar arrays si vienen como strings
    ['specializations', 'languages', 'session_types'].forEach(field => {
      if (typeof updateData[field] === 'string') {
        try {
          updateData[field] = JSON.parse(updateData[field]);
        } catch {
          updateData[field] = updateData[field].split(',').map(s => s.trim());
        }
      }
    });

    if (typeof updateData.education === 'string') {
      try {
        updateData.education = JSON.parse(updateData.education);
      } catch {
        updateData.education = [];
      }
    }

    // If file was uploaded, use the Cloudinary URL
    if (req.file) {
      updateData.photo = req.file.path;
    }

    const therapist = await updateTherapist(id, updateData);

    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
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
    const { id } = req.params;

    const therapist = await deleteTherapist(id);

    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    res.json({ message: 'Therapist removed' });
  } catch (error) {
    console.error('Delete therapist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

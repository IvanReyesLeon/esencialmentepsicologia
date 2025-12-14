const {
    getAllWorkshops,
    getWorkshopById,
    getWorkshopBySlug,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    deleteWorkshopPermanently,
    addWorkshopImage,
    deleteWorkshopImage,
    getWorkshopRegistrations,
    registerToWorkshop,
    addManualRegistration,
    updateRegistrationStatus,
    deleteRegistration,
    getWorkshopStats
} = require('../models/workshopQueries');

// @desc    Get all workshops
// @route   GET /api/workshops
// @access  Public
exports.getAllWorkshops = async (req, res) => {
    try {
        const includeInactive = req.query.all === 'true';
        const workshops = await getAllWorkshops(includeInactive);
        res.json(workshops);
    } catch (error) {
        console.error('Get workshops error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single workshop
// @route   GET /api/workshops/:id
// @access  Public
exports.getWorkshop = async (req, res) => {
    try {
        const { id } = req.params;

        // Intentar buscar por ID o por slug
        let workshop;
        if (isNaN(id)) {
            // Si no es un número, buscar por slug
            workshop = await getWorkshopBySlug(id);
        } else {
            workshop = await getWorkshopById(id);
        }

        if (!workshop) {
            return res.status(404).json({ message: 'Workshop not found' });
        }

        res.json(workshop);
    } catch (error) {
        console.error('Get workshop error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create workshop
// @route   POST /api/workshops
// @access  Private/Admin
exports.createWorkshop = async (req, res) => {
    try {
        const workshopData = { ...req.body };

        // Normalizar images si viene como string
        if (typeof workshopData.images === 'string') {
            try {
                workshopData.images = JSON.parse(workshopData.images);
            } catch {
                workshopData.images = workshopData.images.split(',').map(s => s.trim());
            }
        }

        // If files were uploaded (multiple)
        if (req.files && req.files.length > 0) {
            // Cloudinary returns the full URL in file.path
            workshopData.images = req.files.map(file => file.path);
        }

        // Parsear booleanos
        if (workshopData.allow_registration !== undefined) {
            workshopData.allow_registration = workshopData.allow_registration === 'true' || workshopData.allow_registration === true;
        }
        if (workshopData.show_attendees_count !== undefined) {
            workshopData.show_attendees_count = workshopData.show_attendees_count === 'true' || workshopData.show_attendees_count === true;
        }
        if (workshopData.is_clickable !== undefined) {
            workshopData.is_clickable = workshopData.is_clickable === 'true' || workshopData.is_clickable === true;
        }
        if (workshopData.manual_attendees !== undefined) {
            workshopData.manual_attendees = parseInt(workshopData.manual_attendees) || 0;
        }

        const workshop = await createWorkshop(workshopData);
        res.status(201).json(workshop);
    } catch (error) {
        console.error('Create workshop error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update workshop
// @route   PUT /api/workshops/:id
// @access  Private/Admin
exports.updateWorkshop = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Normalizar images si viene como string
        if (typeof updateData.images === 'string') {
            try {
                updateData.images = JSON.parse(updateData.images);
            } catch {
                updateData.images = updateData.images.split(',').map(s => s.trim());
            }
        }

        // If new files were uploaded
        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => file.path);
        }

        // Parsear booleanos
        if (updateData.allow_registration !== undefined) {
            updateData.allow_registration = updateData.allow_registration === 'true' || updateData.allow_registration === true;
        }
        if (updateData.show_attendees_count !== undefined) {
            updateData.show_attendees_count = updateData.show_attendees_count === 'true' || updateData.show_attendees_count === true;
        }
        if (updateData.is_clickable !== undefined) {
            updateData.is_clickable = updateData.is_clickable === 'true' || updateData.is_clickable === true;
        }
        if (updateData.is_active !== undefined) {
            updateData.is_active = updateData.is_active === 'true' || updateData.is_active === true;
        }
        if (updateData.manual_attendees !== undefined) {
            updateData.manual_attendees = parseInt(updateData.manual_attendees) || 0;
        }

        const workshop = await updateWorkshop(id, updateData);

        if (!workshop) {
            return res.status(404).json({ message: 'Workshop not found' });
        }

        res.json(workshop);
    } catch (error) {
        console.error('Update workshop error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete workshop (soft delete)
// @route   DELETE /api/workshops/:id
// @access  Private/Admin
exports.deleteWorkshop = async (req, res) => {
    try {
        const { id } = req.params;

        const workshop = await deleteWorkshop(id);

        if (!workshop) {
            return res.status(404).json({ message: 'Workshop not found' });
        }

        res.json({ message: 'Workshop deactivated' });
    } catch (error) {
        console.error('Delete workshop error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete workshop permanently
// @route   DELETE /api/workshops/:id/permanent
// @access  Private/Admin
exports.deleteWorkshopPermanently = async (req, res) => {
    try {
        const { id } = req.params;

        const workshop = await deleteWorkshopPermanently(id);

        if (!workshop) {
            return res.status(404).json({ message: 'Workshop not found' });
        }

        res.json({ message: 'Workshop permanently deleted' });
    } catch (error) {
        console.error('Delete workshop permanently error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add image to workshop
// @route   POST /api/workshops/:id/images
// @access  Private/Admin
exports.addWorkshopImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { image_url, is_primary } = req.body;

        let imageUrl = image_url;

        // If file was uploaded
        if (req.file) {
            imageUrl = req.file.path;
        }

        if (!imageUrl) {
            return res.status(400).json({ message: 'Image URL is required' });
        }

        const image = await addWorkshopImage(id, imageUrl, is_primary || false);
        res.status(201).json(image);
    } catch (error) {
        console.error('Add workshop image error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete workshop image
// @route   DELETE /api/workshops/images/:imageId
// @access  Private/Admin
exports.deleteWorkshopImage = async (req, res) => {
    try {
        const { imageId } = req.params;

        const image = await deleteWorkshopImage(imageId);

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        res.json({ message: 'Image removed' });
    } catch (error) {
        console.error('Delete workshop image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== INSCRIPCIONES ====================

// @desc    Get workshop registrations
// @route   GET /api/workshops/:id/registrations
// @access  Private/Admin
exports.getRegistrations = async (req, res) => {
    try {
        const { id } = req.params;
        const registrations = await getWorkshopRegistrations(id);
        res.json(registrations);
    } catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Register to workshop (public)
// @route   POST /api/workshops/:id/register
// @access  Public
exports.registerToWorkshop = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, notes } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Nombre y email son obligatorios' });
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Email no válido' });
        }

        const registration = await registerToWorkshop(id, { name, email, phone, notes });
        res.status(201).json({
            message: '¡Inscripción realizada con éxito!',
            registration
        });
    } catch (error) {
        console.error('Register to workshop error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Add manual registration (admin)
// @route   POST /api/workshops/:id/registrations/manual
// @access  Private/Admin
exports.addManualRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, notes } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'El nombre es obligatorio' });
        }

        const registration = await addManualRegistration(id, { name, email, phone, notes });
        res.status(201).json(registration);
    } catch (error) {
        console.error('Add manual registration error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update registration status
// @route   PUT /api/workshops/registrations/:registrationId
// @access  Private/Admin
exports.updateRegistrationStatus = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { status } = req.body;

        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Estado no válido' });
        }

        const registration = await updateRegistrationStatus(registrationId, status);

        if (!registration) {
            return res.status(404).json({ message: 'Inscripción no encontrada' });
        }

        res.json(registration);
    } catch (error) {
        console.error('Update registration status error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete registration
// @route   DELETE /api/workshops/registrations/:registrationId
// @access  Private/Admin
exports.deleteRegistration = async (req, res) => {
    try {
        const { registrationId } = req.params;

        const registration = await deleteRegistration(registrationId);

        if (!registration) {
            return res.status(404).json({ message: 'Inscripción no encontrada' });
        }

        res.json({ message: 'Inscripción eliminada' });
    } catch (error) {
        console.error('Delete registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get workshop stats
// @route   GET /api/workshops/:id/stats
// @access  Private/Admin
exports.getWorkshopStats = async (req, res) => {
    try {
        const { id } = req.params;
        const stats = await getWorkshopStats(id);
        res.json(stats);
    } catch (error) {
        console.error('Get workshop stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

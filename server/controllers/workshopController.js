const {
    getAllWorkshops,
    getWorkshopById,
    getWorkshopBySlug,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    addWorkshopImage,
    deleteWorkshopImage
} = require('../models/workshopQueries');

// @desc    Get all workshops
// @route   GET /api/workshops
// @access  Public
exports.getAllWorkshops = async (req, res) => {
    try {
        const workshops = await getAllWorkshops();
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
            workshopData.images = req.files.map(file => file.filename);
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
            updateData.images = req.files.map(file => file.filename);
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

// @desc    Delete workshop
// @route   DELETE /api/workshops/:id
// @access  Private/Admin
exports.deleteWorkshop = async (req, res) => {
    try {
        const { id } = req.params;

        const workshop = await deleteWorkshop(id);

        if (!workshop) {
            return res.status(404).json({ message: 'Workshop not found' });
        }

        res.json({ message: 'Workshop removed' });
    } catch (error) {
        console.error('Delete workshop error:', error);
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
            imageUrl = req.file.filename;
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

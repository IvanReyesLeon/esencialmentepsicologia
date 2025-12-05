const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    getAllWorkshops,
    getWorkshop,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    deleteWorkshopPermanently,
    addWorkshopImage,
    deleteWorkshopImage,
    getRegistrations,
    registerToWorkshop,
    addManualRegistration,
    updateRegistrationStatus,
    deleteRegistration,
    getWorkshopStats
} = require('../controllers/workshopController');

// Public routes
router.get('/', getAllWorkshops);
router.get('/:id', getWorkshop);
router.post('/:id/register', registerToWorkshop);  // Inscripción pública

// Admin routes - Workshops
router.post('/', auth, upload.array('images', 5), createWorkshop);
router.put('/:id', auth, upload.array('images', 5), updateWorkshop);
router.delete('/:id', auth, deleteWorkshop);
router.delete('/:id/permanent', auth, deleteWorkshopPermanently);
router.post('/:id/images', auth, upload.single('image'), addWorkshopImage);
router.delete('/images/:imageId', auth, deleteWorkshopImage);

// Admin routes - Registrations
router.get('/:id/registrations', auth, getRegistrations);
router.get('/:id/stats', auth, getWorkshopStats);
router.post('/:id/registrations/manual', auth, addManualRegistration);
router.put('/registrations/:registrationId', auth, updateRegistrationStatus);
router.delete('/registrations/:registrationId', auth, deleteRegistration);

module.exports = router;

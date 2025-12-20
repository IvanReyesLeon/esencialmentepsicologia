const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const { getAdminBilling, getTherapistBilling } = require('../controllers/billingController');
// const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController'); // To be implemented

// Billing Routes
router.get('/billing/global', auth, admin, getAdminBilling);
router.get('/billing/me', auth, getTherapistBilling);

// User Management Routes (Placeholder for now, or I'll implement controller inline/later)
// router.get('/users', auth, admin, getUsers);
// ...

module.exports = router;

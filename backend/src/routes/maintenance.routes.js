const express = require('express');
const router = express.Router();
const {
    getMaintenanceStatus,
    getCountdown,
    activateMaintenance,
    deactivateMaintenance
} = require('../controllers/maintenance.controller');

// Middleware
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Public Routes (accessible to everyone)
router.get('/status', getMaintenanceStatus);
router.get('/countdown', getCountdown);

// Protected Routes (Super Admin only)
router.post('/activate', protect, authorize('SUPER_ADMIN'), activateMaintenance);
router.post('/deactivate', protect, authorize('SUPER_ADMIN'), deactivateMaintenance);

module.exports = router;

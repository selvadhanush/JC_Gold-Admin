const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    resetAdminPassword,
    getSettings,
    updateSettings,
    getFilteredAuditLogs,
    getReport
} = require('../controllers/super_admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// All routes are protected and restricted to SUPER_ADMIN
router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/dashboard-stats', getDashboardStats);
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.patch('/admins/:id/reset-password', resetAdminPassword);
router.get('/audit', getFilteredAuditLogs);
router.get('/reports/:type', getReport);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getAdminNotifications, markAsRead, markAllAsRead } = require('../controllers/admin/notification.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// All routes are protected and for Admins only
router.use(protect);
router.use(authorize('SUPER_ADMIN', 'ORDER_ADMIN', 'PRODUCT_ADMIN'));

router.get('/', getAdminNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;

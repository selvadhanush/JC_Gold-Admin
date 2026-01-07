const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../../controllers/buyer/notification.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');

// All routes are protected
router.get('/', protectBuyer, getNotifications);
router.patch('/:id/read', protectBuyer, markAsRead);

module.exports = router;

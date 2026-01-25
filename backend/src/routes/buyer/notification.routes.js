const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../../controllers/buyer/notification.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { requireMpinVerified } = require('../../middlewares/requireMpinVerified.middleware');

// All routes require buyer authentication and MPIN verification
router.use(protectBuyer);
router.use(requireMpinVerified);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;

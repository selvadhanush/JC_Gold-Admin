const express = require('express');
const router = express.Router();
const { getOrders, placeDirectOrder } = require('../../controllers/buyer/order.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { requireMpinVerified } = require('../../middlewares/requireMpinVerified.middleware');
const { requireKycApproval } = require('../../middlewares/requireKyc.middleware');

// All routes require buyer authentication and MPIN verification
router.use(protectBuyer);
router.use(requireMpinVerified);

router.get('/', getOrders);
router.post('/direct', requireKycApproval, placeDirectOrder);

module.exports = router;

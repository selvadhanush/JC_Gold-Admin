const express = require('express');
const router = express.Router();
const {
    createRazorpayOrder,
    verifyPayment,
    getPayments,
    getPaymentById
} = require('../../controllers/buyer/payment.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { requireMpinVerified } = require('../../middlewares/requireMpinVerified.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require buyer authentication and MPIN verification
router.use(protectBuyer);
router.use(requireMpinVerified);

router.post('/razorpay-order', createRazorpayOrder);
router.post('/verify', verifyPayment);
router.get('/', getPayments);
router.get('/:id', getPaymentById);

module.exports = router;

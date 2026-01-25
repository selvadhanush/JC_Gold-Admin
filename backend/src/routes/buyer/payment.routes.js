const express = require('express');
const router = express.Router();
const {
    createRazorpayOrder,
    verifyPayment,
    getPayments,
    getPaymentById
} = require('../../controllers/buyer/payment.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');

// All routes are protected
router.post('/razorpay-order', protectBuyer, createRazorpayOrder);
router.post('/verify', protectBuyer, verifyPayment);
router.get('/', protectBuyer, getPayments);
router.get('/:id', protectBuyer, getPaymentById);

module.exports = router;

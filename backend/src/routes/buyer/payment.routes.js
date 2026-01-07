const express = require('express');
const router = express.Router();
const { createPayment, getPayments, getPaymentById } = require('../../controllers/buyer/payment.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');

// All routes are protected
router.post('/', protectBuyer, createPayment);
router.get('/', protectBuyer, getPayments);
router.get('/:id', protectBuyer, getPaymentById);

module.exports = router;

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
const { createPaymentSchema } = require('../../validations/buyer/payment.validation');

// All routes require buyer authentication and MPIN verification
router.use(protectBuyer);
router.use(requireMpinVerified);

router.post('/', validate(createPaymentSchema), createPayment);
router.get('/', getPayments);
router.get('/:id', getPaymentById);

module.exports = router;

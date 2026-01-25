const express = require('express');
const router = express.Router();
const { getOrders, placeOrder, placeDirectOrder, getOrderById } = require('../../controllers/buyer/order.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { requireMpinVerified } = require('../../middlewares/requireMpinVerified.middleware');
const { requireKycApproval } = require('../../middlewares/requireKyc.middleware');
const validate = require('../../middlewares/validate.middleware');
const { placeOrderSchema, placeDirectOrderSchema } = require('../../validations/buyer/order.validation');

// All routes require buyer authentication and MPIN verification
router.use(protectBuyer);
router.use(requireMpinVerified);

router.get('/', getOrders);
router.post('/', validate(placeOrderSchema), placeOrder);
router.post('/direct', requireKycApproval, validate(placeDirectOrderSchema), placeDirectOrder);
router.get('/:id', getOrderById);

module.exports = router;

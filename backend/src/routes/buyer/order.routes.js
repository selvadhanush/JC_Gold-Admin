const express = require('express');
const router = express.Router();
const { placeOrder, placeDirectOrder, getOrders, getOrderById } = require('../../controllers/buyer/order.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { placeOrderSchema, placeDirectOrderSchema } = require('../../validations/buyer/order.validation');

// All routes are protected
router.post('/', protectBuyer, validate(placeOrderSchema), placeOrder);
router.post('/direct', protectBuyer, validate(placeDirectOrderSchema), placeDirectOrder);
router.get('/', protectBuyer, getOrders);
router.get('/:id', protectBuyer, getOrderById);

module.exports = router;

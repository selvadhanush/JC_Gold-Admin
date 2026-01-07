const express = require('express');
const router = express.Router();
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
} = require('../../controllers/buyer/cart.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { addToCartSchema, updateCartItemSchema } = require('../../validations/buyer/cart.validation');

// All routes are protected
router.get('/', protectBuyer, getCart);
router.post('/', protectBuyer, validate(addToCartSchema), addToCart);
router.put('/:itemId', protectBuyer, validate(updateCartItemSchema), updateCartItem);
router.delete('/:itemId', protectBuyer, removeFromCart);
router.delete('/', protectBuyer, clearCart);

module.exports = router;

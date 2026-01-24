const express = require('express');
const router = express.Router();
const { addToCart, getCart, updateCartItem, removeFromCart, clearCart } = require('../../controllers/buyer/cart.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { requireMpinVerified } = require('../../middlewares/requireMpinVerified.middleware');
const validate = require('../../middlewares/validate.middleware');
const { addToCartSchema, updateCartItemSchema } = require('../../validations/buyer/cart.validation');

// All routes require buyer authentication and MPIN verification
router.use(protectBuyer);
router.use(requireMpinVerified);

router.post('/', validate(addToCartSchema), addToCart);
router.get('/', getCart);
router.put('/:id', validate(updateCartItemSchema), updateCartItem);
router.delete('/:id', removeFromCart);
router.delete('/', clearCart);

module.exports = router;

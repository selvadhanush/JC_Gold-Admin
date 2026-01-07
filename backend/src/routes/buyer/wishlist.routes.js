const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require('../../controllers/buyer/wishlist.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { addToWishlistSchema } = require('../../validations/buyer/wishlist.validation');

// All routes are protected
router.get('/', protectBuyer, getWishlist);
router.post('/', protectBuyer, validate(addToWishlistSchema), addToWishlist);
router.delete('/:productId', protectBuyer, removeFromWishlist);

module.exports = router;

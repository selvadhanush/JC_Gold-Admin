const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require('../../controllers/buyer/wishlist.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { requireMpinVerified } = require('../../middlewares/requireMpinVerified.middleware');
const validate = require('../../middlewares/validate.middleware');
const { addToWishlistSchema } = require('../../validations/buyer/wishlist.validation');

// All routes require buyer authentication and MPIN verification
router.use(protectBuyer);
router.use(requireMpinVerified);

router.get('/', getWishlist);
router.post('/', validate(addToWishlistSchema), addToWishlist);
router.delete('/:productId', removeFromWishlist);

module.exports = router;

const Wishlist = require('../../models/Wishlist');
const Product = require('../../models/Product');

// @desc    Get buyer's wishlist
// @route   GET /api/v1/buyer/wishlist
// @access  Private (Buyer)
exports.getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ user: req.buyer._id })
            .populate('product')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: wishlist.length,
            data: wishlist,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Add product to wishlist
// @route   POST /api/v1/buyer/wishlist
// @access  Private (Buyer)
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Check if already in wishlist
        const existing = await Wishlist.findOne({
            user: req.buyer._id,
            product: productId,
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist',
            });
        }

        const wishlistItem = await Wishlist.create({
            user: req.buyer._id,
            product: productId,
        });

        const populatedItem = await Wishlist.findById(wishlistItem._id).populate('product');

        res.status(201).json({
            success: true,
            message: 'Product added to wishlist',
            data: populatedItem,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/v1/buyer/wishlist/:productId
// @access  Private (Buyer)
exports.removeFromWishlist = async (req, res) => {
    try {
        const wishlistItem = await Wishlist.findOne({
            user: req.buyer._id,
            product: req.params.productId,
        });

        if (!wishlistItem) {
            return res.status(404).json({
                success: false,
                message: 'Product not in wishlist',
            });
        }

        await wishlistItem.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Product removed from wishlist',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

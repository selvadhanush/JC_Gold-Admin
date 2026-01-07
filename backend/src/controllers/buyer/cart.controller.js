const Cart = require('../../models/Cart');
const CartItem = require('../../models/CartItem');
const Product = require('../../models/Product');
const Inventory = require('../../models/Inventory');

// @desc    Get buyer's cart
// @route   GET /api/v1/buyer/cart
// @access  Private (Buyer)
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.buyer._id })
            .populate({
                path: 'items',
                populate: {
                    path: 'product',
                    select: 'name price images metal purity weight status',
                },
            });

        if (!cart) {
            // Create empty cart if doesn't exist
            cart = await Cart.create({ user: req.buyer._id, items: [], totalAmount: 0 });
        }

        res.status(200).json({
            success: true,
            data: cart,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Add product to cart
// @route   POST /api/v1/buyer/cart
// @access  Private (Buyer)
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || product.status !== 'active') {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not available',
            });
        }

        // Check stock availability
        const inventory = await Inventory.findOne({ product: productId });
        if (!inventory || inventory.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${inventory?.quantity || 0} items available in stock`,
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ user: req.buyer._id });
        if (!cart) {
            cart = await Cart.create({ user: req.buyer._id, items: [], totalAmount: 0 });
        }

        // Check if product already in cart
        const existingItem = await CartItem.findOne({
            cart: cart._id,
            product: productId,
        });

        if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + quantity;
            
            if (inventory.quantity < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${inventory.quantity} items available in stock`,
                });
            }

            existingItem.quantity = newQuantity;
            await existingItem.save();
        } else {
            // Create new cart item
            const cartItem = await CartItem.create({
                cart: cart._id,
                product: productId,
                quantity,
                priceAtAdd: product.price,
            });

            cart.items.push(cartItem._id);
        }

        // Recalculate total
        await recalculateCartTotal(cart._id);

        // Get updated cart
        cart = await Cart.findById(cart._id).populate({
            path: 'items',
            populate: {
                path: 'product',
            },
        });

        res.status(200).json({
            success: true,
            message: 'Product added to cart',
            data: cart,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/v1/buyer/cart/:itemId
// @access  Private (Buyer)
exports.updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;

        const cartItem = await CartItem.findById(req.params.itemId).populate('product');
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found',
            });
        }

        // Verify ownership
        const cart = await Cart.findById(cartItem.cart);
        if (cart.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        // Check stock
        const inventory = await Inventory.findOne({ product: cartItem.product._id });
        if (!inventory || inventory.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${inventory?.quantity || 0} items available in stock`,
            });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        // Recalculate total
        await recalculateCartTotal(cart._id);

        // Get updated cart
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items',
            populate: {
                path: 'product',
            },
        });

        res.status(200).json({
            success: true,
            message: 'Cart updated',
            data: updatedCart,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/v1/buyer/cart/:itemId
// @access  Private (Buyer)
exports.removeFromCart = async (req, res) => {
    try {
        const cartItem = await CartItem.findById(req.params.itemId);
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found',
            });
        }

        // Verify ownership
        const cart = await Cart.findById(cartItem.cart);
        if (cart.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        // Remove from cart items array
        cart.items = cart.items.filter(item => item.toString() !== cartItem._id.toString());
        await cart.save();

        // Delete cart item
        await cartItem.deleteOne();

        // Recalculate total
        await recalculateCartTotal(cart._id);

        // Get updated cart
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items',
            populate: {
                path: 'product',
            },
        });

        res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: updatedCart,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Clear entire cart
// @route   DELETE /api/v1/buyer/cart
// @access  Private (Buyer)
exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.buyer._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found',
            });
        }

        // Delete all cart items
        await CartItem.deleteMany({ cart: cart._id });

        // Clear cart
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared',
            data: cart,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// Helper function to recalculate cart total
async function recalculateCartTotal(cartId) {
    const cart = await Cart.findById(cartId).populate('items');
    
    let total = 0;
    for (const itemId of cart.items) {
        const item = await CartItem.findById(itemId);
        if (item) {
            total += item.priceAtAdd * item.quantity;
        }
    }
    
    cart.totalAmount = total;
    await cart.save();
}

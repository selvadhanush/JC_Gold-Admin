const Cart = require('../../models/Cart');
const CartItem = require('../../models/CartItem');
const Product = require('../../models/Product');

// @desc    Get buyer's cart
// @route   GET /api/v1/buyer/cart
// @access  Private (Buyer)
exports.getCart = async (req, res) => {
    try {
        console.log('=== GET CART ===');
        console.log('Buyer ID:', req.buyer._id);

        let cart = await Cart.findOne({ user: req.buyer._id });

        if (!cart) {
            // Create empty cart if doesn't exist
            cart = await Cart.create({ user: req.buyer._id, items: [], totalAmount: 0 });
            console.log('Created new empty cart');
        } else {
            // HEALING LOGIC: Synchronize any orphaned CartItems
            // This fixes carts that were broken by previous bugs
            const allItemsForThisCart = await CartItem.find({ cart: cart._id });
            const allItemIds = allItemsForThisCart.map(i => i._id.toString());

            // Use updateOne with $set to ensure the array is correct in DB
            // This is safer than manipulate-and-save
            await Cart.updateOne(
                { _id: cart._id },
                { $set: { items: allItemsForThisCart.map(i => i._id) } }
            );

            console.log(`Healing cart: Found ${allItemIds.length} items in DB for this cart`);

            // Recalculate total after healing
            await recalculateCartTotalInternal(cart._id);
        }

        // Now fetch a clean, populated version for response
        const populatedCart = await Cart.findOne({ user: req.buyer._id }).populate({
            path: 'items',
            populate: {
                path: 'product',
                select: 'name price images specifications status',
            },
        });

        console.log('Cart items count (Post-Healing):', populatedCart.items ? populatedCart.items.length : 0);

        res.status(200).json({
            success: true,
            data: populatedCart,
        });
    } catch (error) {
        console.error('Error in getCart:', error);
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
        console.log('=== ADD TO CART ===');
        console.log('Product ID:', productId);
        console.log('Quantity:', quantity);
        console.log('Buyer ID:', req.buyer._id);

        // Check if product exists and is active
        const product = await Product.findById(productId);
        if (!product || product.status !== 'ACTIVE') {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not available',
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ user: req.buyer._id });
        if (!cart) {
            cart = await Cart.create({ user: req.buyer._id, items: [], totalAmount: 0 });
        }

        // Check if product already in cart
        let cartItem = await CartItem.findOne({
            cart: cart._id,
            product: productId,
        });

        if (cartItem) {
            // Update quantity
            cartItem.quantity += quantity;
            await cartItem.save();
            console.log('Updated existing item, new quantity:', cartItem.quantity);
        } else {
            // Create new cart item
            cartItem = await CartItem.create({
                cart: cart._id,
                product: productId,
                quantity,
                priceAtAdd: product.price,
            });
            console.log('Created new cart item document:', cartItem._id);
        }

        // CRITICAL FIX: Ensure the item ID is in the cart.items array using $addToSet
        // This bypasses any Mongoose document state issues
        await Cart.updateOne(
            { _id: cart._id },
            { $addToSet: { items: cartItem._id } }
        );

        // Recalculate total
        await recalculateCartTotalInternal(cart._id);

        // Get updated and populated cart
        const updatedCart = await Cart.findById(cart._id).populate({
            path: 'items',
            populate: {
                path: 'product',
            },
        });

        console.log('Final cart items count:', updatedCart.items.length);

        res.status(200).json({
            success: true,
            message: 'Product added to cart',
            data: updatedCart,
        });
    } catch (error) {
        console.error('Error in addToCart:', error);
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

        const cartItem = await CartItem.findById(req.params.itemId);
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found',
            });
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        await recalculateCartTotalInternal(cartItem.cart);

        const updatedCart = await Cart.findById(cartItem.cart).populate({
            path: 'items',
            populate: {
                path: 'product',
            },
        });

        res.status(200).json({
            success: true,
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

        const cartId = cartItem.cart;

        // Remove ID from array
        await Cart.updateOne(
            { _id: cartId },
            { $pull: { items: cartItem._id } }
        );

        // Delete document
        await cartItem.deleteOne();

        // Recalculate total
        await recalculateCartTotalInternal(cartId);

        const updatedCart = await Cart.findById(cartId).populate({
            path: 'items',
            populate: {
                path: 'product',
            },
        });

        res.status(200).json({
            success: true,
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
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        await CartItem.deleteMany({ cart: cart._id });
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

// Enhanced internal recalculate
async function recalculateCartTotalInternal(cartId) {
    const items = await CartItem.find({ cart: cartId });
    let total = 0;
    for (const item of items) {
        total += (item.priceAtAdd || 0) * (item.quantity || 0);
    }
    await Cart.updateOne({ _id: cartId }, { $set: { totalAmount: total } });
}

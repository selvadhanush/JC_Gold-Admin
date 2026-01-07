const Order = require('../../models/Order');
const OrderItem = require('../../models/OrderItem');
const Cart = require('../../models/Cart');
const CartItem = require('../../models/CartItem');
const Address = require('../../models/Address');
const Inventory = require('../../models/Inventory');
const Payment = require('../../models/Payment');

// @desc    Place order from cart
// @route   POST /api/v1/buyer/orders
// @access  Private (Buyer)
exports.placeOrder = async (req, res) => {
    try {
        const { addressId, paymentMethod } = req.body;

        // Get cart
        const cart = await Cart.findOne({ user: req.buyer._id }).populate({
            path: 'items',
            populate: { path: 'product' },
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty',
            });
        }

        // Get address
        const address = await Address.findById(addressId);
        if (!address || address.user.toString() !== req.buyer._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid address',
            });
        }

        // Validate stock for all items
        for (const item of cart.items) {
            const cartItem = await CartItem.findById(item._id).populate('product');
            const inventory = await Inventory.findOne({ product: cartItem.product._id });
            
            if (!inventory || inventory.quantity < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${cartItem.product.name}`,
                });
            }
        }

        // Create order
        const order = await Order.create({
            user: req.buyer._id,
            orderItems: [],
            totalAmount: cart.totalAmount,
            paymentMethod,
            orderStatus: 'PENDING',
            paymentStatus: 'PENDING',
            shippingAddress: {
                street: address.addressLine1 + (address.addressLine2 ? ', ' + address.addressLine2 : ''),
                city: address.city,
                state: address.state,
                zipCode: address.pincode,
                phoneNumber: address.phone,
            },
        });

        // Create order items and update inventory
        for (const item of cart.items) {
            const cartItem = await CartItem.findById(item._id).populate('product');
            
            const orderItem = await OrderItem.create({
                order: order._id,
                product: cartItem.product._id,
                quantity: cartItem.quantity,
                price: cartItem.priceAtAdd,
                total: cartItem.priceAtAdd * cartItem.quantity,
            });

            order.orderItems.push(orderItem._id);

            // Reduce inventory
            await Inventory.findOneAndUpdate(
                { product: cartItem.product._id },
                { $inc: { quantity: -cartItem.quantity } }
            );
        }

        await order.save();

        // Clear cart
        await CartItem.deleteMany({ cart: cart._id });
        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        // Populate order for response
        const populatedOrder = await Order.findById(order._id)
            .populate({
                path: 'orderItems',
                populate: { path: 'product' },
            });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: populatedOrder,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Get buyer's order history
// @route   GET /api/v1/buyer/orders
// @access  Private (Buyer)
exports.getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.buyer._id })
            .populate({
                path: 'orderItems',
                populate: { path: 'product', select: 'name images price' },
            })
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Get single order details
// @route   GET /api/v1/buyer/orders/:id
// @access  Private (Buyer)
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate({
                path: 'orderItems',
                populate: { path: 'product' },
            })
            .populate('payment');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Verify ownership
        if (order.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order',
            });
        }

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const ErrorResponse = require('../utils/errorResponse');
const checkLowStock = require('../utils/stockAlert');

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private (Admin)
exports.getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private (Admin)
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate({
                path: 'orderItems',
                populate: { path: 'product', select: 'name sku price' }
            });

        if (!order) {
            return next(new ErrorResponse('Order not found', 404));
        }

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update order status
// @route   PATCH /api/v1/orders/:id/status
// @access  Private (ORDER_ADMIN, SUPER_ADMIN)
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        let order = await Order.findById(req.params.id);

        if (!order) {
            return next(new ErrorResponse('Order not found', 404));
        }

        if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') {
            return next(new ErrorResponse('Cannot change status of a completed or cancelled order', 400));
        }

        order.orderStatus = status;
        await order.save();

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Cancel order
// @route   PATCH /api/v1/orders/:id/cancel
// @access  Private (ORDER_ADMIN, SUPER_ADMIN)
exports.cancelOrder = async (req, res, next) => {
    try {
        let order = await Order.findById(req.params.id).populate('orderItems');
        if (!order) {
            return next(new ErrorResponse('Order not found', 404));
        }

        if (order.orderStatus === 'DELIVERED') {
            return next(new ErrorResponse('Cannot cancel a delivered order', 400));
        }

        order.orderStatus = 'CANCELLED';
        await order.save();

        // Restore stock
        for (const item of order.orderItems) {
            await Inventory.findOneAndUpdate(
                { product: item.product },
                { $inc: { quantity: item.quantity } }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Order cancelled and stock restored',
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Generate invoice (logic only)
// @route   GET /api/v1/orders/:id/invoice
// @access  Private (Admin)
exports.generateInvoice = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email address')
            .populate({
                path: 'orderItems',
                populate: { path: 'product', select: 'name sku price' }
            });

        if (!order) {
            return next(new ErrorResponse('Order not found', 404));
        }

        // Return invoice-ready data
        const invoiceData = {
            invoiceNumber: `INV-${order._id.toString().slice(-6).toUpperCase()}`,
            date: order.createdAt,
            customer: order.user,
            items: order.orderItems,
            subTotal: order.totalAmount,
            tax: order.taxAmount,
            shipping: order.shippingAmount,
            total: order.totalAmount + order.taxAmount + order.shippingAmount,
            paymentMethod: order.paymentMethod,
            status: order.paymentStatus,
        };

        res.status(200).json({
            success: true,
            data: invoiceData,
        });
    } catch (err) {
        next(err);
    }
};

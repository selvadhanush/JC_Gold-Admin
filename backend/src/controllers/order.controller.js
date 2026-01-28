const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const ErrorResponse = require('../utils/errorResponse');
const checkLowStock = require('../utils/stockAlert');

const Refund = require('../models/Refund');

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private (Admin)
exports.getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ orderStatus: { $ne: 'PENDING_PAYMENT' } })
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

        // Gatekeeping: Only Finance can confirm payment and release order for processing
        if (status !== 'CANCELLED' && !order.isFinanceConfirmed) {
            return next(new ErrorResponse('Order must be confirmed by Finance before processing', 400));
        }

        order.orderStatus = status;
        await order.save();

        // Notify Buyer
        const { notifyRecipient } = require('../utils/notification');
        await notifyRecipient(order.user, 'User', {
            title: 'Order Status Updated',
            message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${status.toLowerCase()}.`,
            type: 'ORDER_UPDATE'
        });

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
        let order = await Order.findById(req.params.id)
            .populate('orderItems')
            .populate('payment');

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

        // Check if refund needed
        let refundMessage = '';
        if (order.payment && order.payment.status === 'COMPLETED') {
            await Refund.create({
                payment: order.payment._id,
                order: order._id,
                amount: order.payment.amount,
                reason: 'Order Cancelled by Admin',
                status: 'PENDING'
            });

            // Update payment status to REFUND_INITIATED or similar if needed, 
            // but keeping it simple as per plan: Finance will process it.
            // Optionally could set payment status to 'REFUND_PENDING' but Payment model enum check required.
            // Payment model enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']
            // So we leave payment status as COMPLETED until finance processes it to REFUNDED.

            refundMessage = ' and refund request initiated';
        }

        res.status(200).json({
            success: true,
            message: `Order cancelled and stock restored${refundMessage}`,
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

// @desc    Bulk update order status
// @route   PATCH /api/v1/orders/bulk-status
// @access  Private (ORDER_ADMIN)
exports.bulkUpdateStatus = async (req, res, next) => {
    try {
        const { orderIds, status } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return next(new ErrorResponse('Please provide order IDs', 400));
        }

        const orders = await Order.find({ _id: { $in: orderIds } });

        const updatedOrders = [];
        for (const order of orders) {
            if (order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED') {
                order.orderStatus = status;
                await order.save();
                updatedOrders.push(order._id);

                // Notify Buyer
                const { notifyRecipient } = require('../utils/notification');
                await notifyRecipient(order.user, 'User', {
                    title: 'Order Status Updated',
                    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is now ${status.toLowerCase()}.`,
                    type: 'ORDER_UPDATE'
                }).catch(err => console.error('Notification Error:', err));
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully updated ${updatedOrders.length} orders`,
            data: updatedOrders,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Finance confirms order payment
// @route   PATCH /api/v1/orders/:id/finance-confirm
// @access  Private (FINANCE_ADMIN, SUPER_ADMIN)
exports.financeConfirmOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new ErrorResponse('Order not found', 404));
        }

        order.isFinanceConfirmed = true;
        order.isPriority = false; // Reset priority once confirmed
        await order.save();

        res.status(200).json({
            success: true,
            data: order,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Request priority processing (Verify Fast)
// @route   PATCH /api/v1/orders/:id/priority
// @access  Private (ORDER_ADMIN, SUPER_ADMIN)
exports.requestPriority = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return next(new ErrorResponse('Order not found', 404));
        }

        if (order.isFinanceConfirmed) {
            return next(new ErrorResponse('Order already confirmed by finance', 400));
        }

        order.isPriority = true;
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Priority request sent to finance',
            data: order,
        });
    } catch (err) {
        next(err);
    }
};

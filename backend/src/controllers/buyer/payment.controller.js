const Payment = require('../../models/Payment');
const Order = require('../../models/Order');

// @desc    Create payment (mock gateway)
// @route   POST /api/v1/buyer/payments
// @access  Private (Buyer)
exports.createPayment = async (req, res) => {
    try {
        const { orderId, amount, method } = req.body;

        // Verify order ownership
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (order.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        // Mock payment gateway - in production, integrate with real gateway
        const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);
        
        const payment = await Payment.create({
            user: req.buyer._id,
            order: orderId,
            amount,
            method,
            transactionId,
            status: 'COMPLETED', // Mock success
        });

        // Update order payment status
        order.payment = payment._id;
        order.paymentStatus = 'COMPLETED';
        await order.save();

        res.status(201).json({
            success: true,
            message: 'Payment processed successfully',
            data: payment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Get buyer's payment history
// @route   GET /api/v1/buyer/payments
// @access  Private (Buyer)
exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.buyer._id })
            .populate('order')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Get single payment details
// @route   GET /api/v1/buyer/payments/:id
// @access  Private (Buyer)
exports.getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('order')
            .populate('user', 'name email');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found',
            });
        }

        // Verify ownership
        if (payment.user._id.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this payment',
            });
        }

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

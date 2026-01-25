const Payment = require('../../models/Payment');
const Order = require('../../models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
// @route   POST /api/v1/buyer/payments/razorpay-order
// @access  Private (Buyer)
exports.createRazorpayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const options = {
            amount: Math.round(order.totalAmount * 100), // amount in the smallest currency unit (paise)
            currency: 'INR',
            receipt: `receipt_${order._id}`,
        };

        const rzpOrder = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order_id: rzpOrder.id,
            amount: options.amount,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/v1/buyer/payments/verify
// @access  Private (Buyer)
exports.verifyPayment = async (req, res) => {
    try {
        const {
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        const isSimulated = process.env.NODE_ENV === 'development' && razorpay_signature === 'SIMULATED_SIGNATURE';

        if (razorpay_signature !== expectedSign && !isSimulated) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Update payment and order status
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const payment = await Payment.create({
            user: req.buyer._id,
            order: orderId,
            amount: order.totalAmount,
            paymentMethod: 'ONLINE',
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            razorpaySignature: razorpay_signature,
            status: 'COMPLETED',
        });

        order.payment = payment._id;
        order.paymentStatus = 'COMPLETED';
        order.orderStatus = 'CONFIRMED';
        await order.save();

        // Notify admins now that payment is confirmed
        try {
            const { notifyAdmins } = require('../../utils/notification');
            await notifyAdmins(['ORDER_ADMIN', 'SUPER_ADMIN'], {
                title: 'Online Order Confirmed',
                message: `Payment received for order #${order._id.toString().slice(-6).toUpperCase()}.`,
                type: 'ORDER_UPDATE'
            });
        } catch (notifyErr) {
            console.error('Failed to notify admins of payment:', notifyErr);
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            data: payment
        });
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ success: false, message: error.message });
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

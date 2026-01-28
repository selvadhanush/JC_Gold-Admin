const Payment = require('../../models/Payment');
const Order = require('../../models/Order');
const DigitalGoldTransaction = require('../../models/DigitalGoldTransaction');
const UserScheme = require('../../models/UserScheme');
const Installment = require('../../models/Installment');
const { getCurrentGoldRate, convertToGrams } = require('../../utils/goldConversion');
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
        const { orderId, type, amount, targetId } = req.body;
        let finalAmount = 0;
        let receipt = '';

        if (type === 'DIGITAL_GOLD') {
            finalAmount = amount;
            receipt = `dg_${Date.now()}`;
        } else if (type === 'SCHEME_INSTALLMENT') {
            finalAmount = amount;
            receipt = `sc_${Date.now()}`;
        } else {
            // Default to PRODUCT ORDER
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
            finalAmount = order.totalAmount;
            receipt = `ord_${order._id.toString().slice(-6)}_${Date.now()}`;
        }

        const options = {
            amount: Math.round(finalAmount * 100), // amount in the smallest currency unit (paise)
            currency: 'INR',
            receipt: receipt,
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
            type,
            targetId,
            amount,
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

        let paymentData = {
            user: req.buyer._id,
            amount: amount,
            paymentMethod: 'ONLINE',
            transactionId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            razorpaySignature: razorpay_signature,
            status: 'COMPLETED',
        };

        if (type === 'DIGITAL_GOLD') {
            const rate = await getCurrentGoldRate();
            const grams = convertToGrams(amount, rate);

            const transaction = await DigitalGoldTransaction.create({
                user: req.buyer._id,
                type: 'BUY',
                amountPaid: amount,
                goldRateAtTime: rate,
                goldGrams: grams,
                paymentMethod: 'ONLINE',
                transactionId: razorpay_payment_id,
                status: 'PENDING' // Still requires admin gram approval, but payment is confirmed
            });

            paymentData.paymentType = 'DIGITAL_GOLD';
            const payment = await Payment.create(paymentData);

            // Notify Admins
            const { notifyAdmins } = require('../../utils/notification');
            await notifyAdmins(['FINANCE_ADMIN', 'SUPER_ADMIN'], {
                title: 'Gold Purchase (Paid Online)',
                message: `Verified gold purchase of ₹${amount} (${grams}g). Waiting for gram approval.`,
                type: 'GOLD_PURCHASE'
            });

            return res.status(200).json({ success: true, message: 'Gold purchase verified', data: transaction });

        } else if (type === 'SCHEME_INSTALLMENT') {
            const userScheme = await UserScheme.findById(targetId).populate('scheme');
            if (!userScheme) {
                return res.status(404).json({ success: false, message: 'Scheme enrollment not found' });
            }

            paymentData.paymentType = 'SCHEME_INSTALMENT';
            paymentData.scheme = userScheme.scheme._id;
            const payment = await Payment.create(paymentData);

            // Create installment record
            const installment = await Installment.create({
                userScheme: targetId,
                user: req.buyer._id,
                amount,
                dueDate: new Date(),
                paymentDate: new Date(),
                payment: payment._id,
                status: 'PAID',
            });

            // Update user scheme
            userScheme.paidInstallments += 1;
            userScheme.totalAmountPaid += amount;
            const benefitAmount = (amount * userScheme.scheme.benefitPercentage) / 100;
            userScheme.benefitsEarned += benefitAmount;

            if (userScheme.paidInstallments >= userScheme.totalInstallments) {
                userScheme.status = 'COMPLETED';
            }
            await userScheme.save();

            return res.status(200).json({ success: true, message: 'Installment verified', data: installment });

        } else {
            // Default to PRODUCT ORDER
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            paymentData.order = orderId;
            paymentData.paymentType = 'ORDER';
            const payment = await Payment.create(paymentData);

            order.payment = payment._id;
            order.paymentStatus = 'COMPLETED';
            order.orderStatus = 'CONFIRMED';
            await order.save();

            // Notify admins
            const { notifyAdmins } = require('../../utils/notification');
            await notifyAdmins(['ORDER_ADMIN', 'SUPER_ADMIN'], {
                title: 'Online Order Confirmed',
                message: `Payment received for order #${order._id.toString().slice(-6).toUpperCase()}.`,
                type: 'ORDER_UPDATE'
            });

            return res.status(200).json({ success: true, message: 'Payment verified successfully', data: payment });
        }
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

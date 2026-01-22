const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const Order = require('../models/Order');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all payments with filters
// @route   GET /api/v1/payments
// @access  Private (Admin, FINANCE_ADMIN)
exports.getPayments = async (req, res, next) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];
        removeFields.forEach(param => delete reqQuery[param]);

        // Filter by user, order, or date range
        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        query = Payment.find(JSON.parse(queryStr))
            .populate('user', 'name email')
            .populate('order', 'orderNumber totalAmount');

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        const payments = await query;

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single payment
// @route   GET /api/v1/payments/:id
// @access  Private (Admin)
exports.getPayment = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('user', 'name email')
            .populate('order');

        if (!payment) {
            return next(new ErrorResponse('Payment records not found', 404));
        }

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all refunds
// @route   GET /api/v1/payments/refunds
// @access  Private (Admin, FINANCE_ADMIN)
exports.getRefunds = async (req, res, next) => {
    try {
        console.log('Fetching refunds...');

        // Ensure models are registered (Mongoose sometimes needs objects to be touched to register)
        const mongoose = require('mongoose');
        if (!mongoose.models.Refund) require('../models/Refund');
        if (!mongoose.models.Payment) require('../models/Payment');
        if (!mongoose.models.Order) require('../models/Order');
        if (!mongoose.models.Admin) require('../models/Admin');

        const refunds = await Refund.find()
            .populate({
                path: 'payment',
                select: 'amount status transactionId'
            })
            .populate({
                path: 'order',
                select: 'orderNumber totalAmount'
            })
            .populate('processedBy', 'name email');

        console.log(`Found ${refunds.length} refunds`);

        res.status(200).json({
            success: true,
            count: refunds.length,
            data: refunds,
        });
    } catch (err) {
        console.error('getRefunds Error:', err);
        next(err);
    }
};

// @desc    Process refund
// @route   POST /api/v1/payments/:id/refund
// @access  Private (FINANCE_ADMIN, SUPER_ADMIN)
exports.processRefund = async (req, res, next) => {
    try {
        const { reason, amount } = req.body;
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return next(new ErrorResponse('Payment not found', 404));
        }

        if (payment.status !== 'COMPLETED') {
            return next(new ErrorResponse('Only completed payments can be refunded', 400));
        }

        if (amount > payment.amount) {
            return next(new ErrorResponse('Refund amount cannot exceed payment amount', 400));
        }

        const refund = await Refund.create({
            payment: payment._id,
            order: payment.order,
            amount: amount || payment.amount,
            reason,
            processedBy: req.admin._id,
            status: 'PROCESSED', // Mocking success
        });

        payment.status = 'REFUNDED';
        await payment.save();

        if (payment.order) {
            await Order.findByIdAndUpdate(payment.order, { paymentStatus: 'REFUNDED' });
        }

        res.status(201).json({
            success: true,
            data: refund,
        });
    } catch (err) {
        next(err);
    }
};
// @desc    Update payment status
// @route   PUT /api/v1/payments/:id/status
// @access  Private (FINANCE_ADMIN)
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        // DETAILED DEBUG LOGGING
        console.log('--- UPDATE PAYMENT STATUS ATTEMPT ---');
        console.log('Time:', new Date().toISOString());
        console.log('ID Params:', `|${req.params.id}|`);
        console.log('Status Body:', status);
        console.log('Headers:', req.headers['authorization'] ? 'Auth Header Present' : 'NO AUTH HEADER');

        // Requested Debug State via query param
        if (req.query.debug === 'true') {
            console.log('Debug mode triggered via query');
            return res.status(200).json({
                success: true,
                debug: true,
                receivedId: req.params.id,
                receivedStatus: status,
                admin: req.admin ? { role: req.admin.role.name, id: req.admin._id } : 'NO_ADMIN_IN_REQ'
            });
        }

        const payment = await Payment.findById(req.params.id);
        console.log('Payment Search Result:', payment ? 'FOUND ✅' : 'NOT FOUND ❌');

        if (!payment) {
            console.log('Returning 404 for Payment ID:', req.params.id);
            return next(new ErrorResponse(`Payment not found with id of ${req.params.id}`, 404));
        }

        payment.status = status;
        await payment.save();

        // Update corresponding order status if applicable
        if (payment.order) {
            await Order.findByIdAndUpdate(payment.order, { paymentStatus: status });
        }

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (err) {
        next(err);
    }
};

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

        query = Payment.find(JSON.parse(queryStr)).populate('user', 'name email');

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

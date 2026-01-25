const GoldRate = require('../models/GoldRate');
const DigitalGoldTransaction = require('../models/DigitalGoldTransaction');
const RedemptionRequest = require('../models/RedemptionRequest');
const User = require('../models/User');
const GoldLot = require('../models/GoldLot');
const ErrorResponse = require('../utils/errorResponse');
const { notifyRecipient } = require('../utils/notification');
const mongoose = require('mongoose');

// @desc    Set gold rate
// @route   POST /api/v1/admin/digital-gold/gold-rate
// @access  Private (Admin)
exports.setGoldRate = async (req, res, next) => {
    try {
        const { date, metalType, ratePerGram, purity, source } = req.body;
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        const goldRate = await GoldRate.findOneAndUpdate(
            { date: normalizedDate, metalType, purity: purity || '24K' },
            { ratePerGram, source, createdBy: req.admin._id, isActive: true },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(201).json({
            success: true,
            data: goldRate
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get gold rates
// @route   GET /api/v1/admin/digital-gold/gold-rate
// @access  Private (Admin)
exports.getGoldRates = async (req, res, next) => {
    try {
        const rates = await GoldRate.find().sort('-date');
        res.status(200).json({
            success: true,
            data: rates
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get latest dashboard rates
// @route   GET /api/v1/admin/digital-gold/dashboard-rates
// @access  Public
exports.getLatestDashboardRates = async (req, res, next) => {
    try {
        const types = [
            { metalType: 'GOLD', purity: '24K' },
            { metalType: 'GOLD', purity: '22K' },
            { metalType: 'GOLD', purity: '18K' },
            { metalType: 'SILVER', purity: 'FINE' },
            { metalType: 'SILVER', purity: 'STERLING' },
            { metalType: 'SILVER', purity: 'BRITANNIA' },
        ];

        const results = await Promise.all(types.map(async (t) => {
            // Fetch two latest rates to calculate change
            const rates = await GoldRate.find({
                metalType: t.metalType,
                purity: t.purity,
                isActive: true
            }).sort({ date: -1 }).limit(2);

            const current = rates[0];
            const previous = rates[1];
            const change = (current && previous) ? (current.ratePerGram - previous.ratePerGram) : 0;

            return {
                ...t,
                rate: current ? current.ratePerGram : null,
                change: change,
                hasHistory: !!previous
            };
        }));

        res.status(200).json({
            success: true,
            data: results
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Approve/Reject gold purchase
// @route   PUT /api/v1/admin/digital-gold/approve/:id
// @access  Private (FINANCE_ADMIN, SUPER_ADMIN)
exports.approveTransaction = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { status, rejectionReason } = req.body;
        const transaction = await DigitalGoldTransaction.findById(req.params.id).session(session);

        if (!transaction) {
            return next(new ErrorResponse('Transaction not found', 404));
        }

        if (transaction.status !== 'PENDING') {
            return next(new ErrorResponse('Transaction already processed', 400));
        }

        transaction.status = status === 'APPROVED' ? 'COMPLETED' : 'REJECTED';
        transaction.adminApprovedBy = req.admin._id;
        transaction.approvalDate = Date.now();
        transaction.rejectionReason = rejectionReason;

        if (status === 'APPROVED' && transaction.type === 'BUY') {
            // LOT-BASED: Create a new GoldLot
            const lot = await GoldLot.create([{
                user: transaction.user,
                purchaseTransaction: transaction._id,
                purchaseDate: transaction.createdAt,
                goldGrams: transaction.goldGrams,
                remainingGrams: transaction.goldGrams,
                pricePerGram: transaction.goldRateAtTime,
                totalPaid: transaction.amountPaid,
                status: 'ACTIVE'
            }], { session });

            // Link lot to transaction
            transaction.lotsCreated = [lot[0]._id];

            // Update user wallet (for backward compatibility)
            const user = await User.findById(transaction.user).session(session);
            user.wallet.goldBalance += transaction.goldGrams;
            await user.save({ session });
        }

        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Notify Buyer
        await notifyRecipient(transaction.user, 'User', {
            title: `Gold Purchase ${status}`,
            message: status === 'APPROVED'
                ? `Your purchase of ${transaction.goldGrams}g gold has been approved and added to your wallet.`
                : `Your gold purchase request has been rejected. Reason: ${rejectionReason || 'N/A'}`,
            type: 'GOLD_TRANSACTION'
        });

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
    }
};

// @desc    Approve/Reject redemption
// @route   PUT /api/v1/admin/digital-gold/redemption/approve/:id
// @access  Private (FINANCE_ADMIN, ORDER_ADMIN, SUPER_ADMIN)
exports.approveRedemption = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { status, rejectionReason } = req.body;
        const redemption = await RedemptionRequest.findById(req.params.id).session(session);

        if (!redemption) {
            return next(new ErrorResponse('Redemption request not found', 404));
        }

        if (redemption.status !== 'REQUESTED') {
            return next(new ErrorResponse('Redemption already processed', 400));
        }

        redemption.status = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
        redemption.approvedBy = req.admin._id;
        redemption.approvalDate = Date.now();
        redemption.rejectionReason = rejectionReason;

        const transaction = await DigitalGoldTransaction.findById(redemption.transaction).session(session);
        transaction.status = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';
        transaction.adminApprovedBy = req.admin._id;
        transaction.approvalDate = Date.now();
        transaction.rejectionReason = rejectionReason;

        if (status === 'REJECTED') {
            // Refund the gold back to user wallet
            const user = await User.findById(redemption.user).session(session);
            user.wallet.goldBalance += redemption.goldGrams;
            await user.save({ session });
        }

        // If Cash Redemption and Approved -> Mark as Completed immediately (or after payment, but here we mock it)
        if (status === 'APPROVED' && redemption.redeemType === 'CASH') {
            redemption.status = 'COMPLETED';
            redemption.completionDate = Date.now();
            transaction.status = 'COMPLETED';
        }

        await redemption.save({ session });
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Notify Buyer
        await notifyRecipient(redemption.user, 'User', {
            title: `Gold Redemption ${status}`,
            message: status === 'APPROVED'
                ? `Your ${redemption.redeemType} redemption request for ${redemption.goldGrams}g has been approved.`
                : `Your redemption request has been rejected. Reason: ${rejectionReason || 'N/A'}. Gold balance has been restored.`,
            type: 'GOLD_REDEMPTION'
        });

        res.status(200).json({
            success: true,
            data: redemption
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
    }
};

// @desc    Get all redemption requests
// @route   GET /api/v1/admin/digital-gold/redemptions
// @access  Private (FINANCE_ADMIN, ORDER_ADMIN, SUPER_ADMIN)
exports.getRedemptions = async (req, res, next) => {
    try {
        const { status, redeemType } = req.query;
        let query = {};

        if (status) query.status = status;
        if (redeemType) query.redeemType = redeemType;

        const redemptions = await RedemptionRequest.find(query)
            .populate('user', 'name email phoneNumber')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: redemptions.length,
            data: redemptions
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all digital gold transactions
// @route   GET /api/v1/admin/digital-gold/transactions
// @access  Private (FINANCE_ADMIN, ORDER_ADMIN, SUPER_ADMIN)
exports.getTransactions = async (req, res, next) => {
    try {
        const { status, type } = req.query;
        let query = {};

        if (status) query.status = status;
        if (type) query.type = type;

        const transactions = await DigitalGoldTransaction.find(query)
            .populate('user', 'name email phoneNumber')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (err) {
        next(err);
    }
};

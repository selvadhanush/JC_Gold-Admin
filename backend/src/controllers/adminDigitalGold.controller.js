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

            // Note: We no longer manually update user.wallet.goldBalance here.
            // The getWalletBalance API will auto-sync it from active lots.
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

// @desc    Approve/Reject/Complete redemption
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

        const transaction = await DigitalGoldTransaction.findById(redemption.transaction).session(session);

        // HANDLE STEP 2: MARK AS COMPLETED (Payment Done)
        if (status === 'COMPLETED') {
            if (redemption.status !== 'APPROVED') {
                return next(new ErrorResponse('Redemption must be APPROVED before marking as completed', 400));
            }

            redemption.status = 'COMPLETED';
            redemption.completionDate = Date.now();
            transaction.status = 'COMPLETED';

            await redemption.save({ session });
            await transaction.save({ session });
            await session.commitTransaction();
            session.endSession();

            // Notify User
            await notifyRecipient(redemption.user, 'User', {
                title: 'Payment Completed',
                message: `Your ${redemption.redeemType} redemption payout has been processed successfully.`,
                type: 'GOLD_REDEMPTION'
            });

            return res.status(200).json({ success: true, data: redemption });
        }

        // HANDLE STEP 1: APPROVE / REJECT
        if (redemption.status !== 'REQUESTED') {
            return next(new ErrorResponse('Redemption already processed', 400));
        }

        redemption.status = status; // APPROVED or REJECTED
        redemption.approvedBy = req.admin._id;
        redemption.approvalDate = Date.now();
        redemption.rejectionReason = rejectionReason;

        transaction.status = status;
        transaction.adminApprovedBy = req.admin._id;
        transaction.approvalDate = Date.now();
        transaction.rejectionReason = rejectionReason;

        if (status === 'REJECTED') {
            // REFUND LOGIC: Restore gold balance and lots
            const user = await User.findById(redemption.user).session(session);
            user.wallet.goldBalance += redemption.goldGrams;
            await user.save({ session });

            // Restore the lots that were consumed
            if (transaction.lotsUsed && transaction.lotsUsed.length > 0) {
                const GoldLot = require('../models/GoldLot');
                for (const lotUsage of transaction.lotsUsed) {
                    const lot = await GoldLot.findById(lotUsage.lot).session(session);
                    if (lot) {
                        lot.remainingGrams += lotUsage.gramsUsed;
                        if (lot.status === 'CLOSED' && lot.remainingGrams > 0) {
                            lot.status = 'ACTIVE';
                        }
                        await lot.save({ session });
                    }
                }
            }
        }

        await redemption.save({ session });
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Notify Buyer
        await notifyRecipient(redemption.user, 'User', {
            title: `Redemption Request ${status}`,
            message: status === 'APPROVED'
                ? `Your ${redemption.redeemType} redemption request for ${redemption.goldGrams}g has been approved. Payment/Delivery is being processed.`
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

// @desc    Mark physical gold as ready for pickup
// @route   PUT /api/v1/admin/digital-gold/redemption/ready-for-pickup/:id
// @access  Private (FINANCE_ADMIN, ORDER_ADMIN, SUPER_ADMIN)
exports.markReadyForPickup = async (req, res, next) => {
    try {
        const { pickupLocation } = req.body;
        const redemption = await RedemptionRequest.findById(req.params.id);

        if (!redemption) {
            return next(new ErrorResponse('Redemption request not found', 404));
        }

        if (redemption.redeemType !== 'PHYSICAL_GOLD') {
            return next(new ErrorResponse('This action is only for physical gold redemptions', 400));
        }

        if (redemption.status !== 'APPROVED') {
            return next(new ErrorResponse('Redemption must be APPROVED before marking ready for pickup', 400));
        }

        redemption.status = 'READY_FOR_PICKUP';
        redemption.pickupLocation = pickupLocation;
        await redemption.save();

        // Notify User
        await notifyRecipient(redemption.user, 'User', {
            title: 'Gold Ready for Pickup',
            message: `Your physical gold (${redemption.goldGrams}g) is ready for pickup at ${pickupLocation.storeName}. Please visit the store to collect your gold.`,
            type: 'GOLD_REDEMPTION'
        });

        res.status(200).json({
            success: true,
            data: redemption
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Mark physical gold as collected by buyer
// @route   PUT /api/v1/admin/digital-gold/redemption/mark-collected/:id
// @access  Private (FINANCE_ADMIN, ORDER_ADMIN, SUPER_ADMIN)
exports.markAsCollected = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const redemption = await RedemptionRequest.findById(req.params.id).session(session);

        if (!redemption) {
            return next(new ErrorResponse('Redemption request not found', 404));
        }

        if (redemption.redeemType !== 'PHYSICAL_GOLD') {
            return next(new ErrorResponse('This action is only for physical gold redemptions', 400));
        }

        if (redemption.status !== 'READY_FOR_PICKUP') {
            return next(new ErrorResponse('Gold must be READY_FOR_PICKUP before marking as collected', 400));
        }

        redemption.status = 'COMPLETED';
        redemption.collectionDate = Date.now();
        redemption.completionDate = Date.now();
        await redemption.save({ session });

        // Update transaction status
        const transaction = await DigitalGoldTransaction.findById(redemption.transaction).session(session);
        if (transaction) {
            transaction.status = 'COMPLETED';
            await transaction.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        // Notify User
        await notifyRecipient(redemption.user, 'User', {
            title: 'Gold Collection Confirmed',
            message: `Thank you for collecting your physical gold (${redemption.goldGrams}g). Your redemption is now complete.`,
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

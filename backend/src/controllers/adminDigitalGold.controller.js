const GoldRate = require('../models/GoldRate');
const DigitalGoldTransaction = require('../models/DigitalGoldTransaction');
const RedemptionRequest = require('../models/RedemptionRequest');
const User = require('../models/User');
const GoldLot = require('../models/GoldLot');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const ErrorResponse = require('../utils/errorResponse');
const { notifyRecipient } = require('../utils/notification');
const { redeemGoldFIFO } = require('../utils/goldLotHelper');
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

        if (status === 'REJECTED' && transaction.type === 'BUY') {
            // Find the associated payment
            const payment = await Payment.findOne({ transactionId: transaction.transactionId }).session(session);
            if (payment) {
                payment.status = 'REFUNDED';
                await payment.save({ session });

                // Create a record in Refund history
                await Refund.create([{
                    payment: payment._id,
                    digitalGoldTransaction: transaction._id,
                    amount: transaction.amountPaid,
                    reason: rejectionReason || 'Admin Rejection',
                    processedBy: req.admin._id,
                    status: 'PROCESSED' // In a real system, this would be PENDING until Razorpay confirms
                }], { session });
            }
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

// @desc    Adjust user gold vault (Manual Add/Deduct)
// @route   POST /api/v1/admin/digital-gold/adjust-vault
// @access  Private (ORDER_ADMIN, SUPER_ADMIN)
exports.adjustUserGold = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { userId, type, goldGrams, goldRateAtTime, notes } = req.body;

        const user = await User.findById(userId).session(session);
        if (!user) {
            return next(new ErrorResponse('User not found', 404));
        }

        let transaction;

        if (type === 'ADD') {
            // 1. Create a COMPLETED transaction
            // Using OFFLINE as purchase method for shop visits
            transaction = await DigitalGoldTransaction.create([{
                user: userId,
                type: 'BUY',
                amountPaid: goldGrams * goldRateAtTime,
                goldRateAtTime,
                goldGrams,
                status: 'COMPLETED',
                paymentMethod: 'OFFLINE',
                adminApprovedBy: req.admin._id,
                approvalDate: Date.now(),
                notes: notes || 'Manual addition by admin'
            }], { session });

            // 2. Create an ACTIVE gold lot
            const lot = await GoldLot.create([{
                user: userId,
                purchaseTransaction: transaction[0]._id,
                purchaseDate: Date.now(),
                goldGrams,
                remainingGrams: goldGrams,
                pricePerGram: goldRateAtTime,
                totalPaid: goldGrams * goldRateAtTime,
                status: 'ACTIVE'
            }], { session });

            // 3. Link lot to transaction
            transaction[0].lotsCreated = [lot[0]._id];
            await transaction[0].save({ session });

            // 4. Update user balance
            user.wallet.goldBalance = Number(((user.wallet.goldBalance || 0) + goldGrams).toFixed(6));
            await user.save({ session });

        } else if (type === 'DEDUCT') {
            // 1. Check if user has sufficient balance
            if ((user.wallet.goldBalance || 0) < goldGrams) {
                return next(new ErrorResponse('Insufficient user gold balance for deduction', 400));
            }

            // 2. Use FIFO to consume lots
            const { lotsUsed } = await redeemGoldFIFO(userId, goldGrams, goldRateAtTime, session);

            // 3. Create a COMPLETED redemption transaction
            transaction = await DigitalGoldTransaction.create([{
                user: userId,
                type: 'REDEEM_PHYSICAL_GOLD', // Used for "decreasing gold" (shop collection/correction)
                goldRateAtTime,
                goldGrams,
                lotsUsed,
                status: 'COMPLETED',
                adminApprovedBy: req.admin._id,
                approvalDate: Date.now(),
                notes: notes || 'Manual deduction by admin'
            }], { session });

            // 4. Update user balance
            user.wallet.goldBalance = Number(((user.wallet.goldBalance || 0) - goldGrams).toFixed(6));
            await user.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        // Notify Buyer
        await notifyRecipient(userId, 'User', {
            title: `Gold Vault ${type === 'ADD' ? 'Credited' : 'Debited'}`,
            message: type === 'ADD'
                ? `An admin has added ${goldGrams}g gold to your vault.`
                : `An admin has deducted ${goldGrams}g gold from your vault.`,
            type: 'GOLD_TRANSACTION'
        });

        res.status(200).json({
            success: true,
            message: `Successfully ${type === 'ADD' ? 'added' : 'deducted'} gold.`,
            data: transaction[0]
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
    }
};

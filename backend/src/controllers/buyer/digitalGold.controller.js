const User = require('../../models/User');
const DigitalGoldTransaction = require('../../models/DigitalGoldTransaction');
const RedemptionRequest = require('../../models/RedemptionRequest');
const ErrorResponse = require('../../utils/errorResponse');
const { getCurrentGoldRate, convertToGrams } = require('../../utils/goldConversion');
const { notifyAdmins } = require('../../utils/notification');
const mongoose = require('mongoose');

// @desc    Buy digital gold
// @route   POST /api/v1/buyer/digital-gold/buy
// @access  Private (Buyer)
exports.buyDigitalGold = async (req, res, next) => {
    try {
        const { amount, paymentMethod, transactionId } = req.body;

        const rate = await getCurrentGoldRate();
        const grams = convertToGrams(amount, rate);

        const transaction = await DigitalGoldTransaction.create({
            user: req.buyer._id,
            type: 'BUY',
            amountPaid: amount,
            goldRateAtTime: rate,
            goldGrams: grams,
            paymentMethod,
            transactionId,
            status: 'PENDING' // Requires admin approval
        });

        // Notify Admins
        await notifyAdmins(['FINANCE_ADMIN', 'SUPER_ADMIN'], {
            title: 'New Gold Purchase Request',
            message: `A new digital gold purchase request of ₹${amount} (${grams}g) has been submitted.`,
            type: 'GOLD_PURCHASE'
        });

        res.status(201).json({
            success: true,
            message: 'Gold purchase request submitted. Waiting for admin approval.',
            data: transaction
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get gold wallet balance
// @route   GET /api/v1/buyer/digital-gold/wallet
// @access  Private (Buyer)
exports.getWalletBalance = async (req, res, next) => {
    try {
        const user = await User.findById(req.buyer._id);
        
        res.status(200).json({
            success: true,
            data: {
                wallet: user.wallet || { goldBalance: 0, silverBalance: 0, cashBalance: 0 }
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Request redemption
// @route   POST /api/v1/buyer/digital-gold/redeem
// @access  Private (Buyer)
exports.requestRedemption = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { redeemType, goldGrams, productId, deliveryAddress } = req.body;
        const user = await User.findById(req.buyer._id).session(session);

        if (user.wallet.goldBalance < goldGrams) {
            return next(new ErrorResponse('Insufficient gold balance', 400));
        }

        const rate = await getCurrentGoldRate();
        const equivalentAmount = goldGrams * rate;

        // Note: For Accessories, we might need more logic to check if goldGrams covers the product
        
        const transaction = await DigitalGoldTransaction.create([{
            user: req.buyer._id,
            type: `REDEEM_${redeemType}`,
            goldRateAtTime: rate,
            goldGrams: goldGrams,
            status: 'PENDING'
        }], { session });

        const redemption = await RedemptionRequest.create([{
            user: req.buyer._id,
            transaction: transaction[0]._id,
            redeemType,
            goldGrams,
            equivalentAmount,
            goldRateAtRedemption: rate,
            deliveryAddress,
            productId,
            status: 'REQUESTED'
        }], { session });

        // Lock the gold balance? 
        // For now we don't deduct until approval, but we should verify at approval time again.
        // Or we could deduct now and refund if rejected. 
        // Best practice: Deduct now to prevent double spending.
        user.wallet.goldBalance -= goldGrams;
        await user.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Notify Admins
        await notifyAdmins(['FINANCE_ADMIN', 'SUPER_ADMIN', 'ORDER_ADMIN'], {
            title: 'New Gold Redemption Request',
            message: `A new ${redeemType} redemption request for ${goldGrams}g has been submitted.`,
            type: 'GOLD_REDEMPTION'
        });

        res.status(201).json({
            success: true,
            message: 'Redemption request submitted.',
            data: redemption[0]
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
    }
};

// @desc    Get digital gold transactions
// @route   GET /api/v1/buyer/digital-gold/transactions
// @access  Private (Buyer)
exports.getTransactions = async (req, res, next) => {
    try {
        const transactions = await DigitalGoldTransaction.find({ user: req.buyer._id })
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

const User = require('../../models/User');
const DigitalGoldTransaction = require('../../models/DigitalGoldTransaction');
const RedemptionRequest = require('../../models/RedemptionRequest');
const RedemptionLot = require('../../models/RedemptionLot');
const ErrorResponse = require('../../utils/errorResponse');
const { getCurrentGoldRate, convertToGrams } = require('../../utils/goldConversion');
const { notifyAdmins } = require('../../utils/notification');
const { redeemGoldFIFO, calculatePortfolioSummary } = require('../../utils/goldLotHelper');
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

// @desc    Get gold wallet balance (LOT-BASED)
// @route   GET /api/v1/buyer/digital-gold/wallet
// @access  Private (Buyer)
exports.getWalletBalance = async (req, res, next) => {
    try {
        const currentRate = await getCurrentGoldRate();
        
        // Calculate portfolio from lots
        const portfolio = await calculatePortfolioSummary(req.buyer._id, currentRate);
        
        res.status(200).json({
            success: true,
            data: {
                ...portfolio,
                currentGoldRate: currentRate
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Request redemption (LOT-BASED with FIFO)
// @route   POST /api/v1/buyer/digital-gold/redeem
// @access  Private (Buyer)
exports.requestRedemption = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { redeemType, goldGrams, productId, deliveryAddress } = req.body;
        
        const currentRate = await getCurrentGoldRate();
        const equivalentAmount = goldGrams * currentRate;

        // LOT-BASED: Use FIFO redemption
        const { lotsUsed, redemptionLots, totalProfit } = await redeemGoldFIFO(
            req.buyer._id,
            goldGrams,
            currentRate
        );

        // Create transaction with lots used
        const transaction = await DigitalGoldTransaction.create([{
            user: req.buyer._id,
            type: `REDEEM_${redeemType}`,
            goldRateAtTime: currentRate,
            goldGrams: goldGrams,
            lotsUsed: lotsUsed,
            status: 'PENDING'
        }], { session });

        // Create redemption request
        const redemption = await RedemptionRequest.create([{
            user: req.buyer._id,
            transaction: transaction[0]._id,
            redeemType,
            goldGrams,
            equivalentAmount,
            goldRateAtRedemption: currentRate,
            deliveryAddress,
            productId,
            status: 'REQUESTED'
        }], { session });

        // Create redemption lot records
        for (const rl of redemptionLots) {
            await RedemptionLot.create([{
                redemptionRequest: redemption[0]._id,
                ...rl
            }], { session });
        }

        // Update user wallet (for backward compatibility)
        const user = await User.findById(req.buyer._id).session(session);
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
            data: {
                redemption: redemption[0],
                lotsUsed: lotsUsed.length,
                totalProfit: totalProfit
            }
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
            .populate('lotsCreated')
            .populate('lotsUsed.lot')
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

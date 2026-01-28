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

        if (paymentMethod !== 'ONLINE') {
            return next(new ErrorResponse('Digital Gold can only be purchased using ONLINE payment method', 400));
        }

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
        const user = await User.findById(req.buyer._id);
        const currentRate = await getCurrentGoldRate(); // Using correct variable name
        const portfolio = await calculatePortfolioSummary(req.buyer._id, currentRate);

        // Calculate pending gold from pending transactions
        const pendingTransactions = await DigitalGoldTransaction.find({
            user: req.buyer._id,
            status: 'PENDING',
            type: 'BUY'
        });
        const pendingGoldBalance = pendingTransactions.reduce((sum, t) => sum + t.goldGrams, 0);

        // SELF-HEALING: Sync User Wallet Balance with Active Lots
        // If there's a mismatch (Ghost Gold), we prioritize the Lots as the source of truth.
        if (Math.abs((user.wallet.goldBalance || 0) - portfolio.totalGoldGrams) > 0.001) {
            console.log(`[Auto-Fix] Correcting user balance from ${user.wallet.goldBalance} to ${portfolio.totalGoldGrams}`);
            user.wallet.goldBalance = portfolio.totalGoldGrams;
            await user.save();
        }

        const totalDisplayBalance = portfolio.totalGoldGrams;
        const totalDisplayValue = totalDisplayBalance * currentRate;

        res.status(200).json({
            success: true,
            data: {
                wallet: {
                    goldBalance: totalDisplayBalance,
                    pendingGoldBalance: pendingGoldBalance,
                    totalInvested: portfolio.totalInvested,
                    currentValue: totalDisplayValue,
                    totalProfit: portfolio.totalProfit,
                    profitPercentage: portfolio.profitPercentage,
                    isLegacyUser: false
                },
                portfolio: {
                    ...portfolio,
                    totalGoldGrams: totalDisplayBalance
                },
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
        const { redeemType, goldGrams, productId, deliveryAddress, bankDetails } = req.body;
        const user = await User.findById(req.buyer._id).session(session);

        if (user.wallet.goldBalance < goldGrams) {
            return next(new ErrorResponse('Insufficient gold balance', 400));
        }

        const currentRate = await getCurrentGoldRate();
        const equivalentAmount = goldGrams * currentRate;

        // FIFO: Take from oldest lots first
        const { lotsUsed, totalProfit } = await redeemGoldFIFO(req.buyer._id, goldGrams, currentRate, session);

        // Note: For Accessories, we might need more logic to check if goldGrams covers the product

        const transaction = await DigitalGoldTransaction.create([{
            user: req.buyer._id,
            type: `REDEEM_${redeemType}`,
            goldRateAtTime: currentRate,
            goldGrams: goldGrams,
            lotsUsed: lotsUsed,
            status: 'PENDING'
        }], { session });

        // Create redemption request
        const redemptionData = {
            user: req.buyer._id,
            transaction: transaction[0]._id,
            redeemType,
            goldGrams,
            equivalentAmount,
            goldRateAtRedemption: currentRate,
            status: 'REQUESTED'
        };

        if (redeemType === 'PHYSICAL_GOLD') {
            redemptionData.deliveryAddress = deliveryAddress;
        } else if (redeemType === 'CASH') {
            redemptionData.bankDetails = bankDetails;
        } else {
            redemptionData.productId = productId;
        }

        const redemption = await RedemptionRequest.create([redemptionData], { session });

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

// @desc    Get buyer's redemption requests
// @route   GET /api/v1/buyer/digital-gold/redemptions
// @access  Private (Buyer)
exports.getRedemptionRequests = async (req, res, next) => {
    try {
        const redemptions = await RedemptionRequest.find({ user: req.buyer._id })
            .populate('transaction')
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

const GoldLot = require('../../models/GoldLot');
const RedemptionLot = require('../../models/RedemptionLot');
const { getCurrentGoldRate } = require('../../utils/goldConversion');

// @desc    Get all lots for buyer
// @route   GET /api/v1/buyer/digital-gold/lots
// @access  Private (Buyer)
exports.getLots = async (req, res, next) => {
    try {
        const { status } = req.query;
        
        const query = { user: req.buyer._id };
        if (status) {
            query.status = status;
        }
        
        const lots = await GoldLot.find(query)
            .populate('purchaseTransaction')
            .sort({ purchaseDate: -1 });
        
        const currentRate = await getCurrentGoldRate();
        
        const lotsWithProfit = lots.map(lot => ({
            id: lot._id,
            purchaseDate: lot.purchaseDate,
            goldGrams: lot.goldGrams,
            remainingGrams: lot.remainingGrams,
            pricePerGram: lot.pricePerGram,
            totalPaid: lot.totalPaid,
            status: lot.status,
            currentValue: lot.calculateCurrentValue(currentRate),
            profit: lot.calculateProfit(currentRate),
            profitPercentage: lot.calculateProfitPercentage(currentRate),
            transaction: lot.purchaseTransaction
        }));
        
        res.status(200).json({
            success: true,
            count: lotsWithProfit.length,
            data: lotsWithProfit
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single lot details
// @route   GET /api/v1/buyer/digital-gold/lots/:id
// @access  Private (Buyer)
exports.getLotById = async (req, res, next) => {
    try {
        const lot = await GoldLot.findOne({
            _id: req.params.id,
            user: req.buyer._id
        }).populate('purchaseTransaction');
        
        if (!lot) {
            return res.status(404).json({
                success: false,
                message: 'Lot not found'
            });
        }
        
        const currentRate = await getCurrentGoldRate();
        
        res.status(200).json({
            success: true,
            data: {
                id: lot._id,
                purchaseDate: lot.purchaseDate,
                goldGrams: lot.goldGrams,
                remainingGrams: lot.remainingGrams,
                pricePerGram: lot.pricePerGram,
                totalPaid: lot.totalPaid,
                status: lot.status,
                currentValue: lot.calculateCurrentValue(currentRate),
                profit: lot.calculateProfit(currentRate),
                profitPercentage: lot.calculateProfitPercentage(currentRate),
                transaction: lot.purchaseTransaction
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get redemption lot breakdown
// @route   GET /api/v1/buyer/digital-gold/redemptions/:id/lots
// @access  Private (Buyer)
exports.getRedemptionLots = async (req, res, next) => {
    try {
        const redemptionLots = await RedemptionLot.find({
            redemptionRequest: req.params.id
        })
        .populate('goldLot')
        .populate({
            path: 'redemptionRequest',
            match: { user: req.buyer._id }
        });
        
        // Filter out if redemption doesn't belong to user
        const validLots = redemptionLots.filter(rl => rl.redemptionRequest);
        
        if (validLots.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Redemption not found or access denied'
            });
        }
        
        const totalGrams = validLots.reduce((sum, rl) => sum + rl.gramsUsed, 0);
        const totalProfit = validLots.reduce((sum, rl) => sum + rl.profit, 0);
        
        res.status(200).json({
            success: true,
            data: {
                redemptionId: req.params.id,
                totalGrams,
                totalProfit,
                lotsUsed: validLots.map(rl => ({
                    lotId: rl.goldLot._id,
                    purchaseDate: rl.goldLot.purchaseDate,
                    gramsUsed: rl.gramsUsed,
                    purchasePrice: rl.pricePerGramAtPurchase,
                    redemptionPrice: rl.pricePerGramAtRedemption,
                    profit: rl.profit,
                    profitPercentage: rl.calculateProfitPercentage()
                }))
            }
        });
    } catch (err) {
        next(err);
    }
};

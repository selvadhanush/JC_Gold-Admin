const GoldLot = require('../models/GoldLot');

/**
 * Get active lots for a user in FIFO order (oldest first)
 * @param {ObjectId} userId - User ID
 * @returns {Array} Array of active gold lots
 */
exports.getActiveLotsFIFO = async (userId) => {
    return await GoldLot.find({
        user: userId,
        status: 'ACTIVE',
        remainingGrams: { $gt: 0 }
    }).sort({ purchaseDate: 1 }); // Oldest first (FIFO)
};

/**
 * Calculate total gold from active lots
 * @param {ObjectId} userId - User ID
 * @returns {Number} Total gold in grams
 */
exports.calculateTotalGold = async (userId) => {
    const lots = await GoldLot.find({
        user: userId,
        status: 'ACTIVE'
    });
    
    return lots.reduce((sum, lot) => sum + lot.remainingGrams, 0);
};

/**
 * Redeem gold using FIFO logic
 * @param {ObjectId} userId - User ID
 * @param {Number} gramsToRedeem - Grams to redeem
 * @param {Number} currentRate - Current gold rate
 * @returns {Object} Redemption details with lots used
 */
exports.redeemGoldFIFO = async (userId, gramsToRedeem, currentRate) => {
    const lots = await exports.getActiveLotsFIFO(userId);
    
    let remainingToRedeem = gramsToRedeem;
    const lotsUsed = [];
    const redemptionLots = [];
    
    // Check if user has enough gold
    const totalAvailable = lots.reduce((sum, lot) => sum + lot.remainingGrams, 0);
    if (totalAvailable < gramsToRedeem) {
        throw new Error(`Insufficient gold balance. Available: ${totalAvailable}g, Requested: ${gramsToRedeem}g`);
    }
    
    // FIFO: Take from oldest lots first
    for (const lot of lots) {
        if (remainingToRedeem <= 0) break;
        
        const gramsFromThisLot = Math.min(remainingToRedeem, lot.remainingGrams);
        
        // Update lot
        lot.remainingGrams -= gramsFromThisLot;
        if (lot.remainingGrams === 0) {
            lot.status = 'CLOSED';
        }
        await lot.save();
        
        // Track usage for transaction
        lotsUsed.push({
            lot: lot._id,
            gramsUsed: gramsFromThisLot
        });
        
        // Track for redemption lot record
        const profit = (currentRate - lot.pricePerGram) * gramsFromThisLot;
        redemptionLots.push({
            goldLot: lot._id,
            gramsUsed: gramsFromThisLot,
            pricePerGramAtPurchase: lot.pricePerGram,
            pricePerGramAtRedemption: currentRate,
            profit: profit
        });
        
        remainingToRedeem -= gramsFromThisLot;
    }
    
    return {
        lotsUsed,
        redemptionLots,
        totalProfit: redemptionLots.reduce((sum, rl) => sum + rl.profit, 0)
    };
};

/**
 * Calculate portfolio summary
 * @param {ObjectId} userId - User ID
 * @param {Number} currentRate - Current gold rate
 * @returns {Object} Portfolio summary
 */
exports.calculatePortfolioSummary = async (userId, currentRate) => {
    const activeLots = await GoldLot.find({
        user: userId,
        status: 'ACTIVE'
    });
    
    const totalGoldGrams = activeLots.reduce((sum, lot) => sum + lot.remainingGrams, 0);
    const currentValue = totalGoldGrams * currentRate;
    
    // Calculate total invested (only for remaining grams)
    const totalInvested = activeLots.reduce((sum, lot) => 
        sum + (lot.remainingGrams * lot.pricePerGram), 0
    );
    
    const totalProfit = currentValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    
    return {
        totalGoldGrams,
        currentValue,
        totalInvested,
        totalProfit,
        profitPercentage,
        activeLots: activeLots.map(lot => ({
            id: lot._id,
            purchaseDate: lot.purchaseDate,
            goldGrams: lot.goldGrams,
            remainingGrams: lot.remainingGrams,
            pricePerGram: lot.pricePerGram,
            currentValue: lot.calculateCurrentValue(currentRate),
            profit: lot.calculateProfit(currentRate),
            profitPercentage: lot.calculateProfitPercentage(currentRate)
        }))
    };
};

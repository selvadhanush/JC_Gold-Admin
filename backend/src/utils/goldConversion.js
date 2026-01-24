const GoldRate = require('../models/GoldRate');

/**
 * Get the current active gold rate
 * @returns {Promise<number>} Rate per gram
 */
exports.getCurrentGoldRate = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find active rate for today first
    let rate = await GoldRate.findOne({
        isActive: true,
        metalType: 'GOLD',
        // We can relax the date constraint to find the MOST RECENT active rate if today's isn't set
    }).sort({ date: -1 });

    if (!rate) {
        throw new Error('Gold rate not found for today. Please contact admin.');
    }

    return rate.ratePerGram;
};

/**
 * Convert INR to Gold Grams
 * @param {number} amount Amount in INR
 * @param {number} rate Rate per gram
 * @returns {number} Gold in grams (rounded to 3 decimal places)
 */
exports.convertToGrams = (amount, rate) => {
    if (!rate || rate <= 0) return 0;
    const grams = amount / rate;
    return Math.round(grams * 1000) / 1000;
};

/**
 * Convert Gold Grams to INR
 * @param {number} grams Gold in grams
 * @param {number} rate Rate per gram
 * @returns {number} Amount in INR
 */
exports.convertToCurrency = (grams, rate) => {
    return grams * rate;
};

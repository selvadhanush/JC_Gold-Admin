const mongoose = require('mongoose');

const redemptionLotSchema = new mongoose.Schema({
    redemptionRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RedemptionRequest',
        required: true,
        index: true
    },
    goldLot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoldLot',
        required: true,
        index: true
    },
    gramsUsed: {
        type: Number,
        required: true,
        min: [0, 'Grams used must be positive']
    },
    pricePerGramAtPurchase: {
        type: Number,
        required: true,
        min: [0, 'Purchase price must be positive']
    },
    pricePerGramAtRedemption: {
        type: Number,
        required: true,
        min: [0, 'Redemption price must be positive']
    },
    profit: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// Index for efficient queries
redemptionLotSchema.index({ redemptionRequest: 1, goldLot: 1 });

// Method to calculate profit percentage
redemptionLotSchema.methods.calculateProfitPercentage = function() {
    const investedValue = this.gramsUsed * this.pricePerGramAtPurchase;
    return investedValue > 0 ? (this.profit / investedValue) * 100 : 0;
};

module.exports = mongoose.model('RedemptionLot', redemptionLotSchema);

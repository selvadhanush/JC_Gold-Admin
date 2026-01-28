const mongoose = require('mongoose');

const goldLotSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    purchaseTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalGoldTransaction',
        index: true
    },
    purchaseDate: {
        type: Date,
        required: true,
        index: true
    },
    goldGrams: {
        type: Number,
        required: true,
        min: [0, 'Gold grams must be positive']
    },
    remainingGrams: {
        type: Number,
        required: true,
        min: [0, 'Remaining grams cannot be negative']
    },
    pricePerGram: {
        type: Number,
        required: true,
        min: [0, 'Price per gram must be positive']
    },
    totalPaid: {
        type: Number,
        required: true,
        min: [0, 'Total paid must be positive']
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'CLOSED'],
        default: 'ACTIVE',
        index: true
    }
}, { timestamps: true });

// Compound index for FIFO queries (user + status + oldest first)
goldLotSchema.index({ user: 1, status: 1, purchaseDate: 1 });

// Method to calculate current value based on current market rate
goldLotSchema.methods.calculateCurrentValue = function (currentRate) {
    return this.remainingGrams * currentRate;
};

// Method to calculate profit/loss
goldLotSchema.methods.calculateProfit = function (currentRate) {
    const currentValue = this.calculateCurrentValue(currentRate);
    const investedValue = this.remainingGrams * this.pricePerGram;
    return currentValue - investedValue;
};

// Method to calculate profit percentage
goldLotSchema.methods.calculateProfitPercentage = function (currentRate) {
    const profit = this.calculateProfit(currentRate);
    const investedValue = this.remainingGrams * this.pricePerGram;
    return investedValue > 0 ? (profit / investedValue) * 100 : 0;
};

// Method to close lot
goldLotSchema.methods.close = function () {
    if (this.remainingGrams === 0) {
        this.status = 'CLOSED';
    }
};

// Pre-save hook to auto-close if remaining grams is 0
goldLotSchema.pre('save', async function () {
    if (this.remainingGrams === 0) {
        this.status = 'CLOSED';
    }
});

module.exports = mongoose.model('GoldLot', goldLotSchema);

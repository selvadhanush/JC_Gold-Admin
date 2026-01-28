const mongoose = require('mongoose');

const digitalGoldTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['BUY', 'REDEEM_CASH', 'REDEEM_PHYSICAL_GOLD', 'REDEEM_ACCESSORY'],
        required: true,
    },
    amountPaid: {
        type: Number,
        required: function () {
            return this.type === 'BUY';
        },
        min: [0, 'Amount must be positive'],
    },
    goldRateAtTime: {
        type: Number,
        required: true,
        min: [0, 'Rate must be positive'],
    },
    goldGrams: {
        type: Number,
        required: true,
        min: [0, 'Gold grams must be positive'],
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
        default: 'PENDING',
    },
    adminApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
    approvalDate: {
        type: Date,
    },
    rejectionReason: {
        type: String,
    },
    paymentMethod: {
        type: String,
        enum: ['ONLINE', 'WALLET', 'OFFLINE'],
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true,
    },
    notes: {
        type: String,
    },
    // LOT-BASED: Track which lots were created (for BUY) or used (for REDEEM)
    lotsCreated: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoldLot'
    }],
    lotsUsed: [{
        lot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GoldLot'
        },
        gramsUsed: Number
    }]
}, { timestamps: true });

// Generate transaction ID before save
digitalGoldTransactionSchema.pre('save', function () {
    if (!this.transactionId) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        this.transactionId = `DG-${dateStr}-${randomNum}`;
    }
});

// Index for efficient queries
digitalGoldTransactionSchema.index({ user: 1, createdAt: -1 });
digitalGoldTransactionSchema.index({ status: 1 });
digitalGoldTransactionSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('DigitalGoldTransaction', digitalGoldTransactionSchema);

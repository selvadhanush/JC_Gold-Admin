const mongoose = require('mongoose');

const redemptionRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalGoldTransaction',
    },
    redeemType: {
        type: String,
        enum: ['CASH', 'GOLD', 'ACCESSORY'],
        required: true,
    },
    goldGrams: {
        type: Number,
        required: true,
        min: [0.001, 'Minimum 0.001 grams required'],
    },
    equivalentAmount: {
        type: Number,
        required: true,
    },
    goldRateAtRedemption: {
        type: Number,
        required: true,
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        phoneNumber: String,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    },
    status: {
        type: String,
        enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'DISPATCHED', 'COMPLETED', 'CANCELLED'],
        default: 'REQUESTED',
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
    approvalDate: {
        type: Date,
    },
    rejectionReason: {
        type: String,
    },
    dispatchDate: {
        type: Date,
    },
    completionDate: {
        type: Date,
    },
    trackingNumber: {
        type: String,
    },
    notes: {
        type: String,
    },
}, { timestamps: true });

// Index for efficient queries
redemptionRequestSchema.index({ user: 1, status: 1 });
redemptionRequestSchema.index({ status: 1, createdAt: -1 });
redemptionRequestSchema.index({ redeemType: 1 });

module.exports = mongoose.model('RedemptionRequest', redemptionRequestSchema);

const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSED', 'FAILED'],
        default: 'PENDING',
    },
    transactionId: {
        type: String,
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
}, { timestamps: true });

module.exports = mongoose.model('Refund', refundSchema);

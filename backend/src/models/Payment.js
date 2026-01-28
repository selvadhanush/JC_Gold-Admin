const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['ONLINE', 'WALLET', 'OFFLINE', 'COD'],
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    razorpayOrderId: {
        type: String,
    },
    razorpaySignature: {
        type: String,
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
        default: 'PENDING',
    },
    paymentType: {
        type: String,
        enum: ['ORDER', 'SCHEME_INSTALMENT', 'WALLET_TOPUP', 'DIGITAL_GOLD'],
        default: 'ORDER',
    },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);

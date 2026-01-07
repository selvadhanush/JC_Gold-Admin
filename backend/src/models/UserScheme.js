const mongoose = require('mongoose');

const userSchemeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
        required: true,
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    maturityDate: {
        type: Date,
        required: true,
    },
    monthlyInstallment: {
        type: Number,
        required: true,
    },
    totalInstallments: {
        type: Number,
        required: true,
    },
    paidInstallments: {
        type: Number,
        default: 0,
    },
    totalAmountPaid: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'LAPSED', 'CANCELLED'],
        default: 'ACTIVE',
    },
    benefitsEarned: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('UserScheme', userSchemeSchema);

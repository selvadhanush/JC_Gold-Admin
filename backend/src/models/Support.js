const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    category: {
        type: String,
        enum: ['PRODUCT', 'PAYMENT', 'GENERAL'],
        required: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        default: 'OPEN',
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'MEDIUM',
    },
    adminResponse: {
        type: String,
    },
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
    respondedAt: {
        type: Date,
    },
}, { timestamps: true });

module.exports = mongoose.model('Support', supportSchema);

const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // One cart per user
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CartItem',
    }],
    totalAmount: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);

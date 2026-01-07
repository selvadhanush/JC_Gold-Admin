const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderItems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OrderItem',
        }
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    taxAmount: {
        type: Number,
        default: 0,
    },
    shippingAmount: {
        type: Number,
        default: 0,
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
        default: 'PENDING',
    },
    orderStatus: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING',
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        phoneNumber: String,
    },
    paymentMethod: {
        type: String,
        enum: ['WALLET', 'ONLINE', 'COD'],
        required: true,
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
    },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

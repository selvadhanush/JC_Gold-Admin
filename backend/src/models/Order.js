const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        sparse: true, // Allow null/undefined for existing orders
    },
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
        enum: ['PENDING_PAYMENT', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING',
    },
    isFinanceConfirmed: {
        type: Boolean,
        default: false,
    },
    isPriority: {
        type: Boolean,
        default: false,
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

// Pre-save hook to generate order number
orderSchema.pre('save', function () {
    if (!this.orderNumber) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        this.orderNumber = `ORD-${dateStr}-${randomNum}`;
    }
});

module.exports = mongoose.model('Order', orderSchema);

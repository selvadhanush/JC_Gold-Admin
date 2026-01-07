const mongoose = require('mongoose');

const installmentSchema = new mongoose.Schema({
    userScheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserScheme',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    paymentDate: {
        type: Date,
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'OVERDUE'],
        default: 'PENDING',
    },
    penalty: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('Installment', installmentSchema);

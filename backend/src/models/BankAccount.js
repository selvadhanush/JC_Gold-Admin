const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    accountHolderName: {
        type: String,
        required: [true, 'Account holder name is required'],
        trim: true
    },
    accountNumber: {
        type: String,
        required: [true, 'Account number is required'],
        trim: true
    },
    ifscCode: {
        type: String,
        required: [true, 'IFSC code is required'],
        trim: true,
        uppercase: true
    },
    bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true
    },
    branchName: {
        type: String,
        required: [true, 'Branch name is required'],
        trim: true
    },
    accountType: {
        type: String,
        enum: ['SAVINGS', 'CURRENT'],
        default: 'SAVINGS'
    },
    passbookImage: {
        type: String,
        required: [true, 'Passbook image is required']
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    rejectionReason: {
        type: String,
        trim: true
    }
}, { timestamps: true });

bankAccountSchema.index({ userId: 1 });

module.exports = mongoose.model('BankAccount', bankAccountSchema);

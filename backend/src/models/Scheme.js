const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a scheme name'],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    durationMonths: {
        type: Number,
        required: [true, 'Please provide duration in months'],
    },
    minMonthlyAmount: {
        type: Number,
        required: [true, 'Please provide minimum monthly amount'],
    },
    benefitPercentage: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Scheme', schemeSchema);

const mongoose = require('mongoose');

const goldRateSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: [true, 'Please provide a date'],
    },
    metalType: {
        type: String,
        enum: ['GOLD', 'SILVER'],
        default: 'GOLD',
        required: true,
    },
    ratePerGram: {
        type: Number,
        required: [true, 'Please provide rate per gram'],
        min: [0, 'Rate must be positive'],
    },
    source: {
        type: String,
        enum: ['MANUAL', 'API'],
        default: 'MANUAL',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
}, { timestamps: true });

// Compound unique index for date and metalType
goldRateSchema.index({ date: 1, metalType: 1 }, { unique: true });
goldRateSchema.index({ isActive: 1, metalType: 1 });

// Automatically normalize date before any save/update
goldRateSchema.pre('save', function() {
    if (this.date) {
        const d = new Date(this.date);
        d.setHours(0, 0, 0, 0);
        this.date = d;
    }
});

module.exports = mongoose.model('GoldRate', goldRateSchema);

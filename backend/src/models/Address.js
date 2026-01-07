const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fullName: {
        type: String,
        required: [true, 'Please provide full name'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number'],
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
    },
    addressLine1: {
        type: String,
        required: [true, 'Please provide address line 1'],
        trim: true,
    },
    addressLine2: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        required: [true, 'Please provide city'],
        trim: true,
    },
    state: {
        type: String,
        required: [true, 'Please provide state'],
        trim: true,
    },
    pincode: {
        type: String,
        required: [true, 'Please provide pincode'],
        match: [/^[0-9]{6}$/, 'Please provide a valid 6-digit pincode'],
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Index for faster queries
addressSchema.index({ user: 1 });

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

module.exports = mongoose.model('Address', addressSchema);

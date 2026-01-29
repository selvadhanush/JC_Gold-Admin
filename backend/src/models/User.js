const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    wallet: {
        goldBalance: { type: Number, default: 0 }, // in grams
        silverBalance: { type: Number, default: 0 }, // in grams
        cashBalance: { type: Number, default: 0 },
    },
    mpin: {
        hash: {
            type: String,
            select: false  // Never include in queries by default
        },
        isSet: {
            type: Boolean,
            default: false
        },
        attempts: {
            type: Number,
            default: 0
        },
        lockedUntil: {
            type: Date
        }
    },
    refreshToken: {
        type: String,
        select: false
    }
}, { timestamps: true });

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Match user entered MPIN to hashed MPIN in database
userSchema.methods.matchMpin = async function (enteredMpin) {
    if (!this.mpin || !this.mpin.hash) {
        return false;
    }
    return await bcrypt.compare(enteredMpin, this.mpin.hash);
};

// Virtual populate for KYC
userSchema.virtual('kyc', {
    ref: 'Kyc',
    localField: '_id',
    foreignField: 'userId',
    justOne: true
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    linkUrl: {
        type: String,
    },
    type: {
        type: String,
        enum: ['HOME_MAIN', 'OFFER', 'CATEGORY_AD'],
        default: 'HOME_MAIN',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);

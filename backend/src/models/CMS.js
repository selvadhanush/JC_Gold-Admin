const mongoose = require('mongoose');

const cmsSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['BANNER', 'PAGE_CONTENT', 'ANNOUNCEMENT'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
    },
    image: {
        type: String,
    },
    link: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('CMS', cmsSchema);

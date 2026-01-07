const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['ORDER_UPDATE', 'SCHEME_REMINDER', 'PROMOTION', 'SYSTEM'],
        default: 'SYSTEM',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);

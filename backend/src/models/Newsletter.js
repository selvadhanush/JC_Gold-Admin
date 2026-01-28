const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SENT'],
        default: 'DRAFT',
    },
    sentAt: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
}, { timestamps: true });

module.exports = mongoose.model('Newsletter', newsletterSchema);

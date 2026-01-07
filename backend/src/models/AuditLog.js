const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    module: {
        type: String,
        required: true,
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);

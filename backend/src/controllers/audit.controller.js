const AuditLog = require('../models/AuditLog');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all audit logs
// @route   GET /api/v1/audit
// @access  Private (Super Admin)
exports.getAuditLogs = async (req, res, next) => {
    try {
        const logs = await AuditLog.find().populate('admin', 'name email').sort('-createdAt');
        res.status(200).json({
            success: true,
            count: logs.length,
            data: logs,
        });
    } catch (err) {
        next(err);
    }
};

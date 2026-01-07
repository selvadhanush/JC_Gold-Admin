const AuditLog = require('../models/AuditLog');

exports.logAction = (action, module) => {
    return async (req, res, next) => {
        const originalSend = res.send;

        res.send = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300 && req.admin) {
                AuditLog.create({
                    admin: req.admin._id,
                    action: action || req.method,
                    module: module || req.baseUrl.split('/').pop(),
                    details: req.body,
                    ipAddress: req.ip,
                }).catch(err => console.error('Error creating audit log:', err));
            }
            originalSend.apply(res, arguments);
        };

        next();
    };
};

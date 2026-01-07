exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.admin || !req.admin.role) {
            return res.status(403).json({
                success: false,
                message: 'Internal authorization error',
            });
        }

        if (req.admin.role.name === 'SUPER_ADMIN') {
            return next();
        }

        if (!roles.includes(req.admin.role.name)) {
            return res.status(403).json({
                success: false,
                message: `Admin role ${req.admin.role.name} is not authorized to access this route`,
            });
        }
        next();
    };
};

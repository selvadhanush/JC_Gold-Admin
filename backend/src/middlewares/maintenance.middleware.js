const MaintenanceMode = require('../models/MaintenanceMode');

// Middleware to check if maintenance mode is active and block buyer requests
exports.checkMaintenance = async (req, res, next) => {
    try {
        const maintenance = await MaintenanceMode.getInstance();

        // If maintenance is not active, allow all requests
        if (!maintenance.isActive) {
            return next();
        }

        // If maintenance is active, check if user is an admin
        // Admin requests should pass through
        if (req.admin) {
            return next();
        }

        // If user is a buyer (or no admin auth), block the request
        if (req.buyer || !req.admin) {
            return res.status(503).json({
                success: false,
                message: maintenance.message || 'System is currently under maintenance. Please try again later.',
                maintenanceMode: true
            });
        }

        next();
    } catch (error) {
        console.error('Maintenance middleware error:', error);
        // On error, allow the request to proceed
        next();
    }
};

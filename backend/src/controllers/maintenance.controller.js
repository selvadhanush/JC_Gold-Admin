const MaintenanceMode = require('../models/MaintenanceMode');

// @desc    Get maintenance status
// @route   GET /api/v1/maintenance/status
// @access  Public
exports.getMaintenanceStatus = async (req, res) => {
    try {
        const maintenance = await MaintenanceMode.getInstance();

        const response = {
            success: true,
            data: {
                isActive: maintenance.isActive,
                isScheduled: maintenance.isScheduled,
                message: maintenance.message,
                startsAt: maintenance.startsAt,
                expectedDuration: maintenance.expectedDuration,
                remainingSeconds: 0
            }
        };

        // Calculate remaining seconds if scheduled
        if (maintenance.isScheduled && maintenance.startsAt) {
            const now = new Date();
            const diff = maintenance.startsAt - now;
            response.data.remainingSeconds = Math.max(0, Math.floor(diff / 1000));
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get countdown
// @route   GET /api/v1/maintenance/countdown
// @access  Public
exports.getCountdown = async (req, res) => {
    try {
        const maintenance = await MaintenanceMode.getInstance();

        let remainingSeconds = 0;
        if (maintenance.isScheduled && maintenance.startsAt) {
            const now = new Date();
            const diff = maintenance.startsAt - now;
            remainingSeconds = Math.max(0, Math.floor(diff / 1000));
        }

        res.status(200).json({
            success: true,
            data: {
                remainingSeconds,
                isScheduled: maintenance.isScheduled,
                isActive: maintenance.isActive
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Activate/Schedule maintenance
// @route   POST /api/v1/maintenance/activate
// @access  Private (Super Admin)
exports.activateMaintenance = async (req, res) => {
    try {
        const { delayMinutes, message, expectedDuration } = req.body;

        // Validate delay
        if (typeof delayMinutes !== 'number' || isNaN(delayMinutes) || delayMinutes < 0 || delayMinutes > 1440) {
            return res.status(400).json({
                success: false,
                message: 'Delay must be a number between 0 and 1440 minutes (24 hours)'
            });
        }

        const maintenance = await MaintenanceMode.getInstance();

        const now = new Date();
        const startsAt = new Date(now.getTime() + delayMinutes * 60 * 1000);

        maintenance.isScheduled = true;
        maintenance.scheduledAt = now;
        maintenance.startsAt = startsAt;
        maintenance.delayMinutes = delayMinutes;
        maintenance.activatedBy = req.admin._id;
        maintenance.expectedDuration = expectedDuration || null;

        if (message) {
            maintenance.message = message;
        }

        // If delay is 0, activate immediately
        if (delayMinutes === 0) {
            maintenance.isActive = true;
        }

        await maintenance.save();

        res.status(200).json({
            success: true,
            message: delayMinutes === 0
                ? 'Maintenance mode activated immediately'
                : `Maintenance scheduled to start in ${delayMinutes} minutes`,
            data: maintenance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Deactivate maintenance
// @route   POST /api/v1/maintenance/deactivate
// @access  Private (Super Admin)
exports.deactivateMaintenance = async (req, res) => {
    try {
        const maintenance = await MaintenanceMode.getInstance();

        maintenance.isActive = false;
        maintenance.isScheduled = false;
        maintenance.scheduledAt = null;
        maintenance.startsAt = null;
        maintenance.delayMinutes = 0;

        await maintenance.save();

        res.status(200).json({
            success: true,
            message: 'Maintenance mode deactivated',
            data: maintenance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

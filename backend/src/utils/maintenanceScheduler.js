const MaintenanceMode = require('../models/MaintenanceMode');

// Check maintenance status every minute and activate if scheduled time is reached
const checkScheduledMaintenance = async () => {
    try {
        const maintenance = await MaintenanceMode.getInstance();

        // Skip if not scheduled or already active
        if (!maintenance.isScheduled || maintenance.isActive) {
            return;
        }

        const now = new Date();

        // Check if it's time to activate maintenance
        if (maintenance.startsAt && now >= maintenance.startsAt) {
            console.log('🔧 Activating scheduled maintenance...');
            maintenance.isActive = true;
            await maintenance.save();
            console.log('✅ Maintenance mode activated automatically');
        }
    } catch (error) {
        console.error('Error in maintenance scheduler:', error);
    }
};

// Start the scheduler
const startMaintenanceScheduler = () => {
    console.log('🚀 Maintenance scheduler started');

    // Check every 30 seconds for more accuracy
    setInterval(checkScheduledMaintenance, 30 * 1000);

    // Also check immediately on startup
    checkScheduledMaintenance();
};

module.exports = { startMaintenanceScheduler };

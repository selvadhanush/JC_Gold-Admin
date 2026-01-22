const Admin = require('../models/Admin');
const User = require('../models/User');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Config = require('../models/Config');
const AuditLog = require('../models/AuditLog');

// @desc    Get comprehensive system dashboard stats
// @route   GET /api/v1/super-admin/dashboard-stats
// @access  Private/SuperAdmin
exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // 1. Personnel Stats
        const adminsActive = await Admin.countDocuments({ isActive: true });
        const adminsSuspended = await Admin.countDocuments({ isActive: false });

        // 2. Buyer Stats
        const buyersActive = await User.countDocuments({ isActive: true });
        const buyersBlocked = await User.countDocuments({ isActive: false });

        // 3. Financial Pulse (Today)
        const ordersToday = await Order.find({
            createdAt: { $gte: today },
            orderStatus: { $ne: 'CANCELLED' }
        });
        const revenueToday = ordersToday.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // 4. Financial Pulse (Month)
        const ordersMonth = await Order.find({
            createdAt: { $gte: firstDayOfMonth },
            orderStatus: { $ne: 'CANCELLED' }
        });
        const revenueMonth = ordersMonth.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // 5. System Health
        const lowStockCount = await Inventory.countDocuments({ quantity: { $lte: 10 } });
        const paymentFailures = await Order.countDocuments({
            paymentStatus: 'FAILED',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        });

        // 6. Maintenance Mode Status
        const maintenanceConfig = await Config.findOne({ key: 'MAINTENANCE_MODE' });

        console.log('SuperAdmin Dashboard Stats Fetched Successfully');

        res.status(200).json({
            success: true,
            data: {
                admins: { active: adminsActive, suspended: adminsSuspended },
                buyers: { active: buyersActive, blocked: buyersBlocked },
                today: { orders: ordersToday.length, revenue: revenueToday },
                month: { orders: ordersMonth.length, revenue: revenueMonth },
                lowStock: lowStockCount,
                failures: paymentFailures,
                systemStatus: maintenanceConfig?.value === 'true' ? 'MAINTENANCE' : 'OK'
            }
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reset any admin password
// @route   PATCH /api/v1/super-admin/admins/:id/reset-password
// @access  Private/SuperAdmin
exports.resetAdminPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({ success: false, message: 'New password is required' });
        }

        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        admin.password = newPassword;
        await admin.save();

        // Log this high-risk action
        await AuditLog.create({
            admin: req.admin._id,
            module: 'SYSTEM',
            action: 'RESET_PASSWORD',
            details: `Reset password for admin: ${admin.email}`,
            ipAddress: req.ip
        });

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get system settings
// @route   GET /api/v1/super-admin/settings
// @access  Private/SuperAdmin
exports.getSettings = async (req, res) => {
    try {
        const settings = await Config.find({});
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update system settings
// @route   PATCH /api/v1/super-admin/settings
// @access  Private/SuperAdmin
exports.updateSettings = async (req, res) => {
    try {
        const { settings } = req.body; // Array of { key, value }

        for (const item of settings) {
            await Config.findOneAndUpdate(
                { key: item.key },
                { value: item.value.toString() },
                { upsert: true }
            );
        }

        // Log the change
        await AuditLog.create({
            admin: req.admin._id,
            module: 'SYSTEM',
            action: 'UPDATE_SETTINGS',
            details: `Updated ${settings.length} system configurations`,
            ipAddress: req.ip
        });

        res.status(200).json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get advanced filtered audit logs
// @route   GET /api/v1/super-admin/audit
// @access  Private/SuperAdmin
exports.getFilteredAuditLogs = async (req, res) => {
    try {
        const { module, adminId, startDate, endDate } = req.query;
        let query = {};

        if (module) query.module = module;
        if (adminId) query.admin = adminId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .populate('admin', 'name email')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Generate reports
// @route   GET /api/v1/super-admin/reports/:type
// @access  Private/SuperAdmin
exports.getReport = async (req, res) => {
    try {
        const { type } = req.params;
        // Placeholder for real report generation logic
        // In a real app, this might generate an Excel/CSV file
        res.status(200).json({
            success: true,
            message: `Report for ${type} generated successfully`,
            data: { type, generatedAt: new Date() }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

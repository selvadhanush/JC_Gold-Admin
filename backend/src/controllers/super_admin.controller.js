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

// @desc    Get reports statistics for Insights Hub
// @route   GET /api/v1/super-admin/reports-stats
// @access  Private/SuperAdmin
exports.getReportsStats = async (req, res) => {
    try {
        const Scheme = require('../models/Scheme');
        const UserScheme = require('../models/UserScheme');

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Revenue Trends (Last 30 days with daily breakdown)
        const recentOrders = await Order.find({
            createdAt: { $gte: thirtyDaysAgo },
            orderStatus: { $ne: 'CANCELLED' }
        });

        const previousOrders = await Order.find({
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
            orderStatus: { $ne: 'CANCELLED' }
        });

        const currentRevenue = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // Calculate daily revenue for the last 30 days
        const dailyRevenue = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dayStart = new Date(date.setHours(0, 0, 0, 0));
            const dayEnd = new Date(date.setHours(23, 59, 59, 999));

            const dayOrders = recentOrders.filter(order =>
                order.createdAt >= dayStart && order.createdAt <= dayEnd
            );

            dailyRevenue.push({
                date: dayStart.toISOString().split('T')[0],
                revenue: dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
                orders: dayOrders.length
            });
        }

        // User Growth
        const totalUsers = await User.countDocuments({});
        const usersThisMonth = await User.countDocuments({
            createdAt: { $gte: firstDayOfMonth }
        });
        const usersLastMonth = await User.countDocuments({
            createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth }
        });

        const userGrowthRate = usersLastMonth > 0
            ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(2)
            : 100;

        // Sales Growth
        const salesGrowthRate = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(2)
            : 100;

        // Inventory Health
        const totalInventory = await Inventory.countDocuments({});
        const lowStockItems = await Inventory.countDocuments({ quantity: { $lte: 10 } });
        const outOfStockItems = await Inventory.countDocuments({ quantity: 0 });

        // Scheme Activity
        const totalSchemes = await Scheme.countDocuments({});
        const activeSchemes = await Scheme.countDocuments({ isActive: true });
        const userSchemes = await UserScheme.find({});
        const activeEnrollments = userSchemes.filter(us => us.status === 'ACTIVE').length;
        const completedEnrollments = userSchemes.filter(us => us.status === 'COMPLETED').length;

        // Month-to-Date Revenue
        const mtdOrders = await Order.find({
            createdAt: { $gte: firstDayOfMonth },
            orderStatus: { $ne: 'CANCELLED' }
        });
        const mtdRevenue = mtdOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        res.status(200).json({
            success: true,
            data: {
                revenue: {
                    current30Days: currentRevenue,
                    previous30Days: previousRevenue,
                    growthRate: parseFloat(salesGrowthRate),
                    mtdRevenue: mtdRevenue,
                    dailyTrends: dailyRevenue
                },
                users: {
                    total: totalUsers,
                    thisMonth: usersThisMonth,
                    lastMonth: usersLastMonth,
                    growthRate: parseFloat(userGrowthRate),
                    active: await User.countDocuments({ isActive: true }),
                    blocked: await User.countDocuments({ isActive: false })
                },
                sales: {
                    current30Days: recentOrders.length,
                    previous30Days: previousOrders.length,
                    growthRate: parseFloat(salesGrowthRate),
                    averageOrderValue: recentOrders.length > 0
                        ? currentRevenue / recentOrders.length
                        : 0
                },
                inventory: {
                    total: totalInventory,
                    lowStock: lowStockItems,
                    outOfStock: outOfStockItems,
                    healthScore: totalInventory > 0
                        ? ((totalInventory - lowStockItems) / totalInventory * 100).toFixed(2)
                        : 100
                },
                schemes: {
                    total: totalSchemes,
                    active: activeSchemes,
                    enrollments: {
                        active: activeEnrollments,
                        completed: completedEnrollments,
                        total: userSchemes.length
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error in getReportsStats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Generate reports
// @route   GET /api/v1/super-admin/reports/:type
// @access  Private/SuperAdmin
exports.getReport = async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'excel' } = req.query; // Support format query param
        const XLSX = require('xlsx');
        const Scheme = require('../models/Scheme');
        const UserScheme = require('../models/UserScheme');

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        let worksheetData = [];
        let fileName = '';

        switch (type.toLowerCase()) {
            case 'sales':
                // Sales report with revenue trends
                const salesOrders = await Order.find({
                    createdAt: { $gte: thirtyDaysAgo },
                    orderStatus: { $ne: 'CANCELLED' }
                }).sort({ createdAt: -1 }).populate('user', 'name email phone');

                const totalRevenue = salesOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                const avgOrderValue = salesOrders.length > 0 ? totalRevenue / salesOrders.length : 0;

                // Create worksheet data
                worksheetData = [
                    ['Sales Report - Last 30 Days'],
                    ['Generated:', new Date().toLocaleString()],
                    ['Generated By:', req.admin.email],
                    [],
                    ['Summary'],
                    ['Total Orders:', salesOrders.length],
                    ['Total Revenue:', `₹${totalRevenue.toFixed(2)}`],
                    ['Average Order Value:', `₹${avgOrderValue.toFixed(2)}`],
                    [],
                    ['Order Details'],
                    ['Order ID', 'Date', 'Customer Name', 'Customer Email', 'Amount', 'Status', 'Payment Status'],
                    ...salesOrders.map(order => [
                        order._id.toString(),
                        new Date(order.createdAt).toLocaleString(),
                        order.user?.name || 'N/A',
                        order.user?.email || 'N/A',
                        `₹${(order.totalAmount || 0).toFixed(2)}`,
                        order.orderStatus,
                        order.paymentStatus
                    ])
                ];
                fileName = `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            case 'users':
                // User growth report
                const allUsers = await User.find({}).sort({ createdAt: -1 });
                const recentUsers = allUsers.filter(user => user.createdAt >= thirtyDaysAgo);
                const activeUsers = allUsers.filter(user => user.isActive).length;
                const blockedUsers = allUsers.filter(user => !user.isActive).length;

                worksheetData = [
                    ['User Growth Report - Last 30 Days'],
                    ['Generated:', new Date().toLocaleString()],
                    ['Generated By:', req.admin.email],
                    [],
                    ['Summary'],
                    ['Total Users:', allUsers.length],
                    ['New Users (Last 30 Days):', recentUsers.length],
                    ['Active Users:', activeUsers],
                    ['Blocked Users:', blockedUsers],
                    [],
                    ['New User Details'],
                    ['User ID', 'Name', 'Email', 'Phone', 'Joined Date', 'Status'],
                    ...recentUsers.map(user => [
                        user._id.toString(),
                        user.name,
                        user.email,
                        user.phone || 'N/A',
                        new Date(user.createdAt).toLocaleString(),
                        user.isActive ? 'Active' : 'Blocked'
                    ])
                ];
                fileName = `Users_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            case 'inventory':
                // Inventory health report
                const inventoryItems = await Inventory.find({}).populate('product');
                const lowStockItems = inventoryItems.filter(item => item.quantity <= 10);
                const totalValue = inventoryItems.reduce((sum, item) =>
                    sum + (item.quantity * (item.product?.price || 0)), 0);

                worksheetData = [
                    ['Inventory Health Report'],
                    ['Generated:', new Date().toLocaleString()],
                    ['Generated By:', req.admin.email],
                    [],
                    ['Summary'],
                    ['Total Items:', inventoryItems.length],
                    ['Low Stock Items:', lowStockItems.length],
                    ['Total Inventory Value:', `₹${totalValue.toFixed(2)}`],
                    [],
                    ['Inventory Details'],
                    ['Product ID', 'Product Name', 'SKU', 'Quantity', 'Price', 'Total Value', 'Status'],
                    ...inventoryItems.map(item => [
                        item.product?._id?.toString() || 'N/A',
                        item.product?.name || 'N/A',
                        item.product?.sku || 'N/A',
                        item.quantity,
                        `₹${(item.product?.price || 0).toFixed(2)}`,
                        `₹${(item.quantity * (item.product?.price || 0)).toFixed(2)}`,
                        item.quantity <= 10 ? 'Low Stock' : 'In Stock'
                    ])
                ];
                fileName = `Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            case 'schemes':
                // Schemes activity report
                const schemes = await Scheme.find({});
                const userSchemes = await UserScheme.find({}).populate('scheme user');
                const activeEnrollments = userSchemes.filter(us => us.status === 'ACTIVE').length;
                const completedEnrollments = userSchemes.filter(us => us.status === 'COMPLETED').length;

                worksheetData = [
                    ['Schemes Performance Report'],
                    ['Generated:', new Date().toLocaleString()],
                    ['Generated By:', req.admin.email],
                    [],
                    ['Summary'],
                    ['Total Schemes:', schemes.length],
                    ['Active Schemes:', schemes.filter(s => s.isActive).length],
                    ['Total Enrollments:', userSchemes.length],
                    ['Active Enrollments:', activeEnrollments],
                    ['Completed Enrollments:', completedEnrollments],
                    [],
                    ['Scheme Details'],
                    ['Scheme ID', 'Scheme Name', 'Duration (Months)', 'Min Monthly Amount', 'Benefit %', 'Status', 'Total Enrollments'],
                    ...schemes.map(scheme => [
                        scheme._id.toString(),
                        scheme.name,
                        scheme.durationMonths,
                        `₹${scheme.minMonthlyAmount}`,
                        `${scheme.benefitPercentage}%`,
                        scheme.isActive ? 'Active' : 'Inactive',
                        userSchemes.filter(us => us.scheme._id.toString() === scheme._id.toString()).length
                    ])
                ];
                fileName = `Schemes_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type. Valid types: sales, users, inventory, schemes'
                });
        }

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Auto-size columns
        const maxWidth = worksheetData.reduce((w, r) => Math.max(w, r.length), 10);
        worksheet['!cols'] = Array(maxWidth).fill({ wch: 20 });

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, type.charAt(0).toUpperCase() + type.slice(1));

        // Generate buffer
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Log report generation
        await AuditLog.create({
            admin: req.admin._id,
            module: 'REPORTS',
            action: 'GENERATE_REPORT',
            details: `Generated ${type} report as Excel file`,
            ipAddress: req.ip
        });

        // Set headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', excelBuffer.length);

        // Send file
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error in getReport:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

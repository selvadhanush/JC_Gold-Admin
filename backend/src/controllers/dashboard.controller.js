const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const UserScheme = require('../models/UserScheme');
const Payment = require('../models/Payment');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get dashboard statistics
// @route   GET /api/v1/dashboard/stats?period=MONTH
// @access  Private (Admin, FINANCE_ADMIN)
exports.getStats = async (req, res, next) => {
    try {
        // Determine date range based on period parameter
        const period = req.query.period || 'MONTH';
        let daysBack = 90; // Default to 90 days for backward compatibility

        switch (period) {
            case 'TODAY':
                daysBack = 1;
                break;
            case 'WEEK':
                daysBack = 7;
                break;
            case 'MONTH':
                daysBack = 30;
                break;
            case 'YEAR':
                daysBack = 365;
                break;
            default:
                daysBack = 90;
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        // Total Revenue (all time)
        const revenue = await Order.aggregate([
            { $match: { paymentStatus: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        // Daily Sales & Order Count (filtered by period)
        const dailyStats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: {
                        $sum: {
                            $cond: [{ $eq: ["$paymentStatus", "COMPLETED"] }, "$totalAmount", 0]
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Orders by Status
        const ordersByStatus = await Order.aggregate([
            { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
        ]);

        // Top Selling Products
        const topProducts = await OrderItem.aggregate([
            {
                $group: {
                    _id: '$product',
                    totalSold: { $sum: '$quantity' },
                    revenue: { $sum: '$total' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' }
        ]);

        // Scheme Revenue
        const schemeRevenue = await UserScheme.aggregate([
            { $group: { _id: null, total: { $sum: '$totalAmountPaid' } } }
        ]);

        // Total orders count (all time)
        const totalOrders = await Order.countDocuments();

        // Support Tickets notification count (OPEN or IN_PROGRESS)
        const Support = require('../models/Support');
        const allTickets = await Support.find({}).select('status subject category');
        const unresolvedTicketsCount = await Support.countDocuments({
            status: { $in: ['OPEN', 'IN_PROGRESS'] }
        });

        console.log('🎫 Dashboard API - All Tickets:', allTickets);
        console.log('🎫 Dashboard API - Unresolved Tickets Count:', unresolvedTicketsCount);

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: revenue[0] ? revenue[0].total : 0,
                totalOrders,
                dailySales: dailyStats,
                ordersByStatus,
                topProducts,
                schemeRevenue: schemeRevenue[0] ? schemeRevenue[0].total : 0,
                unresolvedTicketsCount
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Export reports to CSV (mock logic)
// @route   GET /api/v1/dashboard/export/sales
// @access  Private (Admin, FINANCE_ADMIN)
exports.exportSalesCSV = async (req, res, next) => {
    try {
        const orders = await Order.find({ paymentStatus: 'COMPLETED' }).populate('user', 'name');

        // Manual CSV generation
        let csv = 'Order ID,Customer,Amount,Date,Status\n';
        orders.forEach(order => {
            csv += `${order._id},${order.user ? order.user.name : 'N/A'},${order.totalAmount},${order.createdAt.toISOString().split('T')[0]},${order.orderStatus}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.csv');
        res.status(200).send(csv);
    } catch (err) {
        next(err);
    }
};

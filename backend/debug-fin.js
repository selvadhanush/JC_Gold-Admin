const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Order = require('./src/models/Order');
const Payment = require('./src/models/Payment');
const Refund = require('./src/models/Refund');
const UserScheme = require('./src/models/UserScheme');

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check Orders
        const totalOrders = await Order.countDocuments();
        const completedOrders = await Order.countDocuments({ paymentStatus: 'COMPLETED' });
        const pendingOrders = await Order.countDocuments({ paymentStatus: 'PENDING' });

        console.log('\n--- Order Stats ---');
        console.log('Total Orders:', totalOrders);
        console.log('Completed Orders:', completedOrders);
        console.log('Pending Orders:', pendingOrders);

        // Check if there are any orders in the last 30 days
        const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
        const recentOrders = await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        console.log('Recent Orders (last 30 days):', recentOrders);

        // Check Refunds
        const refundsCount = await Refund.countDocuments();
        console.log('\n--- Refund Stats ---');
        console.log('Refunds Count:', refundsCount);

        // Test Refund populate
        try {
            const sampleRefunds = await Refund.find().limit(1).populate('payment').populate('order');
            console.log('Test Refund Populate Result:', sampleRefunds.length > 0 ? 'Success' : 'No refunds found');
        } catch (err) {
            console.error('ERROR during Refund populate test:', err.message);
        }

        process.exit(0);
    } catch (err) {
        console.error('Debug script failed:', err);
        process.exit(1);
    }
}

debug();

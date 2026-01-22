const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Order = require('./src/models/Order');

async function checkOrderRevenue() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Check all orders
        const orders = await Order.find();
        console.log('--- All Orders ---');
        console.log('Total Orders:', orders.length);

        orders.forEach(o => {
            console.log(`\nOrder ID: ${o._id}`);
            console.log(`  Total Amount: ₹${o.totalAmount}`);
            console.log(`  Payment Status: ${o.paymentStatus}`);
            console.log(`  Created: ${o.createdAt}`);
        });

        // Check completed orders
        const completedOrders = await Order.find({ paymentStatus: 'COMPLETED' });
        const completedRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        console.log('\n--- Completed Orders ---');
        console.log('Completed Orders:', completedOrders.length);
        console.log('Total Revenue from Completed:', `₹${completedRevenue}`);

        // Check last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentOrders = await Order.find({ createdAt: { $gte: thirtyDaysAgo } });
        console.log('\n--- Last 30 Days ---');
        console.log('Orders in last 30 days:', recentOrders.length);
        recentOrders.forEach(o => {
            console.log(`  ${o._id}: ₹${o.totalAmount}, Status: ${o.paymentStatus}, Date: ${o.createdAt.toISOString().split('T')[0]}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkOrderRevenue();

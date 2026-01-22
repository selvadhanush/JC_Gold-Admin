const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Order = require('./src/models/Order');

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const orders = await Order.find().sort('-createdAt').limit(5);
        console.log('Total Orders count:', await Order.countDocuments());

        if (orders.length === 0) {
            console.log('No orders found in database.');
        } else {
            console.log('\n--- Recent 5 Orders ---');
            orders.forEach(o => {
                console.log(`ID: ${o._id}, Status: ${o.orderStatus}, Payment: ${o.paymentStatus}, CreatedAt: ${o.createdAt}`);
            });
        }

        const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
        console.log('\nFilter Date (30 days ago):', thirtyDaysAgo);

        process.exit(0);
    } catch (err) {
        console.error('Debug script failed:', err);
        process.exit(1);
    }
}

debug();

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Order = require('./src/models/Order');
const Payment = require('./src/models/Payment');

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check Orders
        const orders = await Order.find().limit(5);
        console.log('\n--- Orders ---');
        console.log('Total Orders:', await Order.countDocuments());
        orders.forEach(o => {
            console.log(`Order ID: ${o._id}, Total: ${o.totalAmount}, Payment Status: ${o.paymentStatus}`);
        });

        // Check Payments
        const payments = await Payment.find().limit(5);
        console.log('\n--- Payments ---');
        console.log('Total Payments:', await Payment.countDocuments());
        payments.forEach(p => {
            console.log(`Payment ID: ${p._id}, Amount: ${p.amount}, Status: ${p.status}, Order: ${p.order}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Debug script failed:', err);
        process.exit(1);
    }
}

debug();

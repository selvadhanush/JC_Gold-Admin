const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Order = require('./src/models/Order');
const Payment = require('./src/models/Payment');

async function updateOrderStatuses() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Find all orders with PENDING status that have payments
        const orders = await Order.find({ paymentStatus: 'PENDING' });
        console.log(`Found ${orders.length} orders with PENDING status\n`);

        for (const order of orders) {
            // Check if there's a payment for this order
            const payment = await Payment.findOne({ order: order._id });

            if (payment) {
                // Update order status to COMPLETED
                order.paymentStatus = 'COMPLETED';
                await order.save();

                console.log(`✓ Updated order ${order._id} to COMPLETED (₹${order.totalAmount})`);
            } else {
                console.log(`- Order ${order._id} has no payment record, skipping`);
            }
        }

        console.log('\n✅ Order status update complete!');

        // Show summary
        const completedOrders = await Order.find({ paymentStatus: 'COMPLETED' });
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        console.log(`\nCompleted Orders: ${completedOrders.length}`);
        console.log(`Total Revenue: ₹${totalRevenue}`);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

updateOrderStatuses();

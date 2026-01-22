const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Order = require('./src/models/Order');
const Payment = require('./src/models/Payment');

async function createPaymentsForOrders() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all orders that don't have payments
        const orders = await Order.find();
        console.log(`Found ${orders.length} orders`);

        for (const order of orders) {
            // Check if payment already exists for this order
            const existingPayment = await Payment.findOne({ order: order._id });

            if (!existingPayment) {
                // Create payment record
                const payment = await Payment.create({
                    user: order.user,
                    order: order._id,
                    amount: order.totalAmount,
                    paymentMethod: 'ONLINE', // Default method
                    transactionId: `TXN-${order._id.toString().slice(-8).toUpperCase()}`,
                    status: order.paymentStatus === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
                    paymentType: 'ORDER',
                });

                console.log(`✓ Created payment for order ${order._id}: ₹${order.totalAmount}`);
            } else {
                console.log(`- Payment already exists for order ${order._id}`);
            }
        }

        console.log('\n✅ Payment creation complete!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createPaymentsForOrders();

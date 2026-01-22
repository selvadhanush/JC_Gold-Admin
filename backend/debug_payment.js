const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
require('./src/models/Payment');
const Payment = mongoose.model('Payment');

async function checkPayment() {
    await connectDB();
    const id = '6970a8190223e6d02060da9a';
    const payment = await Payment.findById(id);
    console.log('Payment:', payment);

    // Also list some payments
    const allPayments = await Payment.find().limit(5);
    console.log('Recent Payments:', allPayments.map(p => p._id.toString()));

    process.exit();
}

checkPayment();

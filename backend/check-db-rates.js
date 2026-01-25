const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
};

const checkRates = async () => {
    await connectDB();

    try {
        const collection = mongoose.connection.collection('goldrates');
        const rates = await collection.find({}).toArray();

        console.log('--- ALL SAVED RATES ---');
        console.log(JSON.stringify(rates, null, 2));
        console.log('-----------------------');

        const latest24k = await collection.findOne(
            { metalType: 'GOLD', purity: '24K', isActive: true },
            { sort: { date: -1 } }
        );
        console.log('Latest GOLD 24K Fetch Test:', latest24k);

        process.exit();
    } catch (error) {
        console.error('Error checking rates:', error);
        process.exit(1);
    }
};

checkRates();

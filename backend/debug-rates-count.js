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

const debug = async () => {
    await connectDB();

    try {
        const GoldRate = require('./src/models/GoldRate');

        const summary = await GoldRate.aggregate([
            {
                $group: {
                    _id: { metal: "$metalType", purity: "$purity" },
                    count: { $sum: 1 },
                    rates: { $push: { rate: "$ratePerGram", date: "$date" } }
                }
            }
        ]);

        console.log('--- RATE HISTORY SUMMARY ---');
        summary.forEach(s => {
            console.log(`${s._id.metal} (${s._id.purity}): ${s.count} records`);
            s.rates.sort((a, b) => b.date - a.date).forEach(r => {
                console.log(`  - ${r.date.toISOString().split('T')[0]}: ₹${r.rate}`);
            });
        });
        console.log('----------------------------');

        process.exit();
    } catch (error) {
        console.error('Debug Error:', error);
        process.exit(1);
    }
};

debug();

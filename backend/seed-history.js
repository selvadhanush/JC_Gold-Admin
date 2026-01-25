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

const seed = async () => {
    await connectDB();

    try {
        const GoldRate = require('./src/models/GoldRate');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const rates = [
            { metalType: 'GOLD', purity: '24K', ratePerGram: 15449 }, // If today is 15949, this is +500
            { metalType: 'GOLD', purity: '22K', ratePerGram: 14000 },
            { metalType: 'GOLD', purity: '18K', ratePerGram: 12000 },
            { metalType: 'SILVER', purity: 'FINE', ratePerGram: 300 }, // If today is 365, this is +65
            { metalType: 'SILVER', purity: 'STERLING', ratePerGram: 250 },
            { metalType: 'SILVER', purity: 'BRITANNIA', ratePerGram: 200 }
        ];

        for (const r of rates) {
            await GoldRate.findOneAndUpdate(
                { date: yesterday, metalType: r.metalType, purity: r.purity },
                { ...r, isActive: true },
                { upsert: true }
            );
        }

        console.log('Successfully seeded yesterday\'s rates for history comparison!');
        process.exit();
    } catch (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    }
};

seed();

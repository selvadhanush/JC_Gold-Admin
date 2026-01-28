require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const GoldLot = require('../src/models/GoldLot');

async function fixWalletBalances() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database');

        const users = await User.find({});
        console.log(`Found ${users.length} users`);

        let fixedCount = 0;

        for (const user of users) {
            const lots = await GoldLot.find({
                user: user._id,
                status: 'ACTIVE'
            });

            const totalGrams = lots.reduce((sum, lot) => sum + lot.remainingGrams, 0);
            const currentBalance = user.wallet.goldBalance || 0;

            if (Math.abs(currentBalance - totalGrams) > 0.001) {
                console.log(`Fixing user ${user.email}: ${currentBalance}g -> ${totalGrams}g`);
                user.wallet.goldBalance = totalGrams;
                await user.save();
                fixedCount++;
            }
        }

        console.log(`\nMigration complete! Fixed ${fixedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

fixWalletBalances();

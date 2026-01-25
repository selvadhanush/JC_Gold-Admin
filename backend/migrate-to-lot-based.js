/**
 * Migration Script: Convert POOL-BASED to LOT-BASED Digital Gold
 * 
 * This script creates GoldLot records for existing users with gold balance
 * based on their transaction history.
 * 
 * Run this ONCE before deploying LOT-BASED changes to production.
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const DigitalGoldTransaction = require('./src/models/DigitalGoldTransaction');
const GoldLot = require('./src/models/GoldLot');
const { getCurrentGoldRate } = require('./src/utils/goldConversion');

async function migrateToLotBased() {
    try {
        console.log('🔄 Starting migration from POOL-BASED to LOT-BASED...\n');

        // Get all users with gold balance
        const users = await User.find({ 'wallet.goldBalance': { $gt: 0 } });
        console.log(`📊 Found ${users.length} users with gold balance\n`);

        let totalLotsCreated = 0;
        let usersWithTransactions = 0;
        let usersWithoutTransactions = 0;

        for (const user of users) {
            console.log(`\n👤 Processing user: ${user.email} (Balance: ${user.wallet.goldBalance}g)`);

            // Get all APPROVED BUY transactions for this user
            const transactions = await DigitalGoldTransaction.find({
                user: user._id,
                type: 'BUY',
                status: { $in: ['COMPLETED', 'APPROVED'] }
            }).sort({ createdAt: 1 });

            if (transactions.length > 0) {
                console.log(`   📝 Found ${transactions.length} purchase transactions`);
                usersWithTransactions++;

                // Create lot for each transaction
                for (const txn of transactions) {
                    // Skip if lot already created
                    if (txn.lotsCreated && txn.lotsCreated.length > 0) {
                        console.log(`   ⏭️  Lot already exists for transaction ${txn.transactionId}`);
                        continue;
                    }

                    const lot = await GoldLot.create({
                        user: user._id,
                        purchaseTransaction: txn._id,
                        purchaseDate: txn.createdAt,
                        goldGrams: txn.goldGrams,
                        remainingGrams: txn.goldGrams,
                        pricePerGram: txn.goldRateAtTime,
                        totalPaid: txn.amountPaid,
                        status: 'ACTIVE'
                    });

                    // Link lot to transaction
                    txn.lotsCreated = [lot._id];
                    await txn.save();

                    totalLotsCreated++;
                    console.log(`   ✅ Created lot: ${txn.goldGrams}g @ ₹${txn.goldRateAtTime}/g (${txn.transactionId})`);
                }
            } else {
                console.log(`   ⚠️  No transaction history found`);
                usersWithoutTransactions++;

                // Create single lot with current gold balance at current rate
                const currentRate = await getCurrentGoldRate();
                const totalPaid = user.wallet.goldBalance * currentRate;

                const lot = await GoldLot.create({
                    user: user._id,
                    purchaseTransaction: null, // Migration lot
                    purchaseDate: new Date(),
                    goldGrams: user.wallet.goldBalance,
                    remainingGrams: user.wallet.goldBalance,
                    pricePerGram: currentRate,
                    totalPaid: totalPaid,
                    status: 'ACTIVE'
                });

                totalLotsCreated++;
                console.log(`   ✅ Created migration lot: ${user.wallet.goldBalance}g @ ₹${currentRate}/g (current rate)`);
            }
        }

        console.log('\n\n📊 Migration Summary:');
        console.log(`   Total users processed: ${users.length}`);
        console.log(`   Users with transaction history: ${usersWithTransactions}`);
        console.log(`   Users without transaction history: ${usersWithoutTransactions}`);
        console.log(`   Total lots created: ${totalLotsCreated}`);
        console.log('\n✅ Migration completed successfully!\n');

        // Verification
        console.log('🔍 Verifying migration...');
        for (const user of users) {
            const lots = await GoldLot.find({ user: user._id, status: 'ACTIVE' });
            const totalFromLots = lots.reduce((sum, lot) => sum + lot.remainingGrams, 0);
            
            if (Math.abs(totalFromLots - user.wallet.goldBalance) > 0.0001) {
                console.log(`   ⚠️  Mismatch for ${user.email}: Wallet=${user.wallet.goldBalance}g, Lots=${totalFromLots}g`);
            } else {
                console.log(`   ✅ ${user.email}: ${totalFromLots}g (verified)`);
            }
        }

        console.log('\n✅ Verification complete!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    require('dotenv').config();
    
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB\n');
            return migrateToLotBased();
        })
        .then(() => {
            console.log('✅ Migration script completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateToLotBased };

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const RedemptionRequest = require('./src/models/RedemptionRequest');
        const User = require('./src/models/User');
        const DigitalGoldTransaction = require('./src/models/DigitalGoldTransaction');

        // Find a user
        const user = await User.findOne();
        if (!user) {
            console.log('No user found to assign redemption');
            process.exit();
        }

        const transaction = await DigitalGoldTransaction.create({
            user: user._id,
            type: 'REDEEM_GOLD',
            amountPaid: 0,
            goldRateAtTime: 15949,
            goldGrams: 5,
            status: 'PENDING'
        });

        await RedemptionRequest.create({
            user: user._id,
            transaction: transaction._id,
            redeemType: 'GOLD',
            goldGrams: 5,
            equivalentAmount: 15949 * 5,
            goldRateAtRedemption: 15949,
            deliveryAddress: {
                street: '123 Main St',
                city: 'Chennai',
                state: 'TN',
                zipCode: '600001',
                phoneNumber: '9876543210'
            },
            status: 'REQUESTED'
        });

        console.log('Successfully seeded a GOLD redemption request for testing!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();

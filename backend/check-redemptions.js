const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const RedemptionRequest = require('./src/models/RedemptionRequest');
        const redemptions = await RedemptionRequest.find();
        console.log(`Found ${redemptions.length} redemptions`);
        redemptions.forEach(r => {
            console.log(`- Type: ${r.redeemType}, Status: ${r.status}`);
        });
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();

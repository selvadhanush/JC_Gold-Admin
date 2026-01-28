const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://selvadhanushjc:6XSMtzPb0kU8dUoi@cluster0.vsfis.mongodb.net/JC-Gold?appName=Cluster0';

const kycSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'] },
    // Simplified schema for update purposes
}, { strict: false });

const Kyc = mongoose.model('Kyc', kycSchema);

const fixKycStatus = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const kycId = '697717844a8f0f4f11fef7d3';

        const result = await Kyc.updateOne(
            { _id: kycId },
            {
                $set: {
                    status: 'PENDING',
                    rejectionReason: undefined,
                    verifiedBy: undefined,
                    verifiedAt: undefined
                }
            }
        );

        console.log('Update Result:', result);
        console.log('KYC status reset to PENDING');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixKycStatus();

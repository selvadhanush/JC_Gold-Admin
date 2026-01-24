const Kyc = require('../models/Kyc');
const ErrorResponse = require('../utils/errorResponse');

// Middleware to require KYC approval for sensitive operations
exports.requireKycApproval = async (req, res, next) => {
    try {
        // Check if buyer is authenticated
        if (!req.buyer || !req.buyer._id) {
            return next(new ErrorResponse('Authentication required', 401));
        }

        // Find buyer's KYC record
        const kyc = await Kyc.findOne({ userId: req.buyer._id });

        // If no KYC record exists
        if (!kyc) {
            return res.status(403).json({
                success: false,
                message: 'KYC approval required to perform this action. Please submit your KYC details.',
                kycStatus: 'NOT_SUBMITTED'
            });
        }

        // Check KYC status
        if (kyc.status !== 'APPROVED') {
            const messages = {
                'PENDING': 'Your KYC is under review. Please wait for admin approval.',
                'REJECTED': `Your KYC was rejected. Reason: ${kyc.rejectionReason || 'N/A'}. Please resubmit with correct information.`,
                'NOT_SUBMITTED': 'Please submit your KYC details to perform this action.'
            };

            return res.status(403).json({
                success: false,
                message: messages[kyc.status] || 'KYC approval required to perform this action.',
                kycStatus: kyc.status,
                rejectionReason: kyc.status === 'REJECTED' ? kyc.rejectionReason : undefined
            });
        }

        // KYC is approved, proceed
        next();
    } catch (err) {
        next(err);
    }
};

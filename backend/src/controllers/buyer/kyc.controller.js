const Kyc = require('../../models/Kyc');
const User = require('../../models/User');
const ErrorResponse = require('../../utils/errorResponse');
const { notifyAdmins } = require('../../utils/notification');

// @desc    Submit KYC
// @route   POST /api/v1/buyer/kyc/submit
// @access  Private (Buyer)
exports.submitKyc = async (req, res, next) => {
    try {
        const { personalDetails, document, address } = req.body;

        // Check if KYC already exists
        const existingKyc = await Kyc.findOne({ userId: req.buyer._id });

        if (existingKyc && existingKyc.status !== 'REJECTED') {
            return next(new ErrorResponse(
                `KYC already ${existingKyc.status}. Cannot submit again.`,
                400
            ));
        }

        // If exists and rejected, we'll update it instead
        if (existingKyc && existingKyc.status === 'REJECTED') {
            return next(new ErrorResponse(
                'Please use the resubmit endpoint to update rejected KYC',
                400
            ));
        }

        // Create new KYC record
        const kyc = await Kyc.create({
            userId: req.buyer._id,
            status: 'PENDING',
            personalDetails,
            document,
            address
        });

        // Notify admins
        await notifyAdmins(['FINANCE_ADMIN', 'SUPER_ADMIN'], {
            title: 'New KYC Submission',
            message: `${personalDetails.fullName} has submitted KYC for verification.`,
            type: 'KYC_SUBMISSION'
        });

        res.status(201).json({
            success: true,
            message: 'KYC submitted successfully. Awaiting admin verification.',
            data: {
                kycId: kyc._id,
                status: kyc.status,
                submittedAt: kyc.createdAt
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get KYC status
// @route   GET /api/v1/buyer/kyc/status
// @access  Private (Buyer)
exports.getKycStatus = async (req, res, next) => {
    try {
        const kyc = await Kyc.findOne({ userId: req.buyer._id })
            .select('-document.number') // Don't send actual document number
            .populate('verifiedBy', 'name email');

        if (!kyc) {
            return res.status(200).json({
                success: true,
                data: {
                    status: 'NOT_SUBMITTED',
                    message: 'KYC not yet submitted'
                }
            });
        }

        // Mask document number for display
        const kycData = kyc.toObject();
        kycData.document.maskedNumber = kyc.getMaskedDocumentNumber();

        res.status(200).json({
            success: true,
            data: kycData
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Resubmit KYC after rejection
// @route   PUT /api/v1/buyer/kyc/resubmit
// @access  Private (Buyer)
exports.resubmitKyc = async (req, res, next) => {
    try {
        const { personalDetails, document, address } = req.body;

        // Find existing KYC
        const kyc = await Kyc.findOne({ userId: req.buyer._id });

        if (!kyc) {
            return next(new ErrorResponse(
                'No KYC record found. Please use submit endpoint.',
                404
            ));
        }

        if (kyc.status !== 'REJECTED') {
            return next(new ErrorResponse(
                `Cannot resubmit KYC with status: ${kyc.status}`,
                400
            ));
        }

        // Update KYC with new details
        kyc.personalDetails = personalDetails;
        kyc.document = document;
        kyc.address = address;
        kyc.status = 'PENDING';
        kyc.rejectionReason = undefined; // Clear rejection reason
        kyc.verifiedBy = undefined;
        kyc.verifiedAt = undefined;

        await kyc.save();

        // Notify admins
        await notifyAdmins(['FINANCE_ADMIN', 'SUPER_ADMIN'], {
            title: 'KYC Resubmission',
            message: `${personalDetails.fullName} has resubmitted KYC after rejection.`,
            type: 'KYC_RESUBMISSION'
        });

        res.status(200).json({
            success: true,
            message: 'KYC resubmitted successfully. Awaiting admin verification.',
            data: {
                kycId: kyc._id,
                status: kyc.status,
                resubmittedAt: kyc.updatedAt
            }
        });
    } catch (err) {
        next(err);
    }
};

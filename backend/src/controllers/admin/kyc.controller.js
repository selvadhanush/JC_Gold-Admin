const Kyc = require('../../models/Kyc');
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');
const ErrorResponse = require('../../utils/errorResponse');
const { notifyRecipient } = require('../../utils/notification');

// @desc    Get all KYC requests
// @route   GET /api/v1/admin/kyc
// @access  Private (SUPER_ADMIN, FINANCE_ADMIN, PRODUCT_ADMIN)
exports.getAllKycRequests = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        // Build query
        const query = {};
        if (status) {
            query.status = status;
        }

        // Pagination
        const skip = (page - 1) * limit;

        const kycRequests = await Kyc.find(query)
            .populate('userId', 'name email phoneNumber')
            .populate('verifiedBy', 'name email')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Kyc.countDocuments(query);

        res.status(200).json({
            success: true,
            count: kycRequests.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: kycRequests
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single KYC by ID
// @route   GET /api/v1/admin/kyc/:id
// @access  Private (SUPER_ADMIN, FINANCE_ADMIN, PRODUCT_ADMIN)
exports.getKycById = async (req, res, next) => {
    try {
        const kyc = await Kyc.findById(req.params.id)
            .populate('userId', 'name email phoneNumber wallet')
            .populate('verifiedBy', 'name email role');

        if (!kyc) {
            return next(new ErrorResponse('KYC record not found', 404));
        }

        // For non-SUPER_ADMIN and non-FINANCE_ADMIN, mask document number
        const kycData = kyc.toObject();
        if (req.admin.role.name !== 'SUPER_ADMIN' && req.admin.role.name !== 'FINANCE_ADMIN') {
            kycData.document.number = kyc.getMaskedDocumentNumber();
        }

        res.status(200).json({
            success: true,
            data: kycData
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Approve KYC
// @route   PATCH /api/v1/admin/kyc/:id/approve
// @access  Private (SUPER_ADMIN, FINANCE_ADMIN)
exports.approveKyc = async (req, res, next) => {
    try {
        const kyc = await Kyc.findById(req.params.id).populate('userId', 'name email');

        if (!kyc) {
            return next(new ErrorResponse('KYC record not found', 404));
        }

        if (kyc.status !== 'PENDING') {
            return next(new ErrorResponse(
                `Cannot approve KYC with status: ${kyc.status}`,
                400
            ));
        }

        // Update KYC status
        kyc.status = 'APPROVED';
        kyc.verifiedBy = req.admin._id;
        kyc.verifiedAt = Date.now();
        kyc.rejectionReason = undefined; // Clear any previous rejection reason

        await kyc.save();

        // Create audit log
        await AuditLog.create({
            admin: req.admin._id,
            action: 'KYC_APPROVED',
            targetModel: 'Kyc',
            targetId: kyc._id,
            details: `Approved KYC for user: ${kyc.userId.name || kyc.userId.email}`
        });

        // Notify buyer
        await notifyRecipient(kyc.userId._id, 'User', {
            title: 'KYC Approved',
            message: 'Your KYC has been approved! You can now access all features including gold redemption and withdrawals.',
            type: 'KYC_APPROVAL'
        });

        res.status(200).json({
            success: true,
            message: 'KYC approved successfully',
            data: kyc
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Reject KYC
// @route   PATCH /api/v1/admin/kyc/:id/reject
// @access  Private (SUPER_ADMIN, FINANCE_ADMIN)
exports.rejectKyc = async (req, res, next) => {
    try {
        const { rejectionReason } = req.body;

        const kyc = await Kyc.findById(req.params.id).populate('userId', 'name email');

        if (!kyc) {
            return next(new ErrorResponse('KYC record not found', 404));
        }

        if (kyc.status !== 'PENDING') {
            return next(new ErrorResponse(
                `Cannot reject KYC with status: ${kyc.status}`,
                400
            ));
        }

        // Update KYC status
        kyc.status = 'REJECTED';
        kyc.verifiedBy = req.admin._id;
        kyc.verifiedAt = Date.now();
        kyc.rejectionReason = rejectionReason;

        await kyc.save();

        // Create audit log
        await AuditLog.create({
            admin: req.admin._id,
            action: 'KYC_REJECTED',
            targetModel: 'Kyc',
            targetId: kyc._id,
            details: `Rejected KYC for user: ${kyc.userId.name || kyc.userId.email}. Reason: ${rejectionReason}`
        });

        // Notify buyer
        await notifyRecipient(kyc.userId._id, 'User', {
            title: 'KYC Rejected',
            message: `Your KYC has been rejected. Reason: ${rejectionReason}. Please resubmit with correct information.`,
            type: 'KYC_REJECTION'
        });

        res.status(200).json({
            success: true,
            message: 'KYC rejected',
            data: kyc
        });
    } catch (err) {
        next(err);
    }
};

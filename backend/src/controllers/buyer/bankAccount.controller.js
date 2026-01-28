const BankAccount = require('../../models/BankAccount');
const ErrorResponse = require('../../utils/errorResponse');

// @desc    Get buyer bank account
// @route   GET /api/v1/buyer/profile/bank-account
// @access  Private (Buyer)
exports.getBankAccount = async (req, res, next) => {
    try {
        const bankAccount = await BankAccount.findOne({ userId: req.buyer._id });

        if (!bankAccount) {
            return res.status(200).json({
                success: true,
                data: null
            });
        }

        res.status(200).json({
            success: true,
            data: bankAccount
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Save/Update buyer bank account
// @route   POST /api/v1/buyer/profile/bank-account
// @access  Private (Buyer)
exports.saveBankAccount = async (req, res, next) => {
    try {
        const {
            accountHolderName,
            accountNumber,
            ifscCode,
            bankName,
            branchName,
            accountType
        } = req.body;

        let passbookImage = req.body.passbookImage;

        // If a file was uploaded, use its path (Cloudinary URL)
        if (req.file && req.file.path) {
            passbookImage = req.file.path;
        }

        if (!passbookImage) {
            return next(new ErrorResponse('Passbook image is required', 400));
        }

        const bankData = {
            userId: req.buyer._id,
            accountHolderName,
            accountNumber,
            ifscCode,
            bankName,
            branchName,
            accountType,
            passbookImage,
            status: 'PENDING' // Reset to pending on update
        };

        const bankAccount = await BankAccount.findOneAndUpdate(
            { userId: req.buyer._id },
            bankData,
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: bankAccount
        });
    } catch (error) {
        next(error);
    }
};

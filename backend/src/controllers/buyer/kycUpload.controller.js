const { uploadKycDocument } = require('../../utils/kycUpload');
const ErrorResponse = require('../../utils/errorResponse');

// @desc    Upload KYC document (optional helper endpoint)
// @route   POST /api/v1/buyer/kyc/upload-document
// @access  Private (Buyer)
exports.uploadDocument = async (req, res, next) => {
    try {
        // Use multer middleware
        uploadKycDocument.fields([
            { name: 'frontImage', maxCount: 1 },
            { name: 'backImage', maxCount: 1 }
        ])(req, res, async (err) => {
            if (err) {
                return next(new ErrorResponse(err.message, 400));
            }

            if (!req.files || (!req.files.frontImage && !req.files.backImage)) {
                return next(new ErrorResponse('Please upload at least one document image', 400));
            }

            const response = {};

            if (req.files.frontImage) {
                response.frontImage = req.files.frontImage[0].path;
            }

            if (req.files.backImage) {
                response.backImage = req.files.backImage[0].path;
            }

            res.status(200).json({
                success: true,
                message: 'Documents uploaded successfully',
                data: response
            });
        });
    } catch (err) {
        next(err);
    }
};

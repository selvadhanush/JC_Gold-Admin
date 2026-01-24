const express = require('express');
const {
    submitKyc,
    getKycStatus,
    resubmitKyc
} = require('../../controllers/buyer/kyc.controller');
const { uploadDocument } = require('../../controllers/buyer/kycUpload.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { kycSubmissionLimiter, kycStatusLimiter } = require('../../middlewares/kycRateLimit.middleware');
const validate = require('../../middlewares/validate.middleware');
const { submitKycValidation, resubmitKycValidation } = require('../../validations/buyer/kyc.validation');

const router = express.Router();

// All routes require buyer authentication
router.use(protectBuyer);

router.post('/submit', kycSubmissionLimiter, validate(submitKycValidation), submitKyc);
router.get('/status', kycStatusLimiter, getKycStatus);
router.put('/resubmit', validate(resubmitKycValidation), resubmitKyc);
router.post('/upload-document', uploadDocument); // Optional: Upload documents to Cloudinary

module.exports = router;

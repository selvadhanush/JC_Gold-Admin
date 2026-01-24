const express = require('express');
const router = express.Router();
const {
    getSchemes,
    getSchemeById,
    enrollInScheme,
    getMySchemes,
    payInstallment,
    getSchemeStatus,
} = require('../../controllers/buyer/scheme.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { requireMpinVerified } = require('../../middlewares/requireMpinVerified.middleware');
const validate = require('../../middlewares/validate.middleware');
const { enrollSchemeSchema, payInstallmentSchema } = require('../../validations/buyer/scheme.validation');

// Public routes (no auth required)
router.get('/', getSchemes);
router.get('/:id', getSchemeById);

// Protected routes require buyer authentication and MPIN verification
router.post('/:id/enroll', protectBuyer, requireMpinVerified, validate(enrollSchemeSchema), enrollInScheme);
router.get('/my/all', protectBuyer, requireMpinVerified, getMySchemes);
router.post('/my/:id/installment', protectBuyer, requireMpinVerified, validate(payInstallmentSchema), payInstallment);
router.get('/my/:id/status', protectBuyer, requireMpinVerified, getSchemeStatus);

module.exports = router;

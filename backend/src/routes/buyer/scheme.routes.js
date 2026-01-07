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
const validate = require('../../middlewares/validate.middleware');
const { enrollSchemeSchema, payInstallmentSchema } = require('../../validations/buyer/scheme.validation');

// Public routes
router.get('/', getSchemes);
router.get('/:id', getSchemeById);

// Protected routes
router.post('/:id/enroll', protectBuyer, validate(enrollSchemeSchema), enrollInScheme);
router.get('/my/all', protectBuyer, getMySchemes);
router.post('/my/:id/installment', protectBuyer, validate(payInstallmentSchema), payInstallment);
router.get('/my/:id/status', protectBuyer, getSchemeStatus);

module.exports = router;

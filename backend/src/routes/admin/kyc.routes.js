const express = require('express');
const {
    getAllKycRequests,
    getKycById,
    approveKyc,
    rejectKyc
} = require('../../controllers/admin/kyc.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const validate = require('../../middlewares/validate.middleware');
const { approveKycValidation, rejectKycValidation } = require('../../validations/adminKyc.validation');

const router = express.Router();

// All routes require admin authentication
router.use(protect);

// List and view - accessible to SUPER_ADMIN, FINANCE_ADMIN, PRODUCT_ADMIN
router.get('/', authorize('SUPER_ADMIN', 'FINANCE_ADMIN', 'PRODUCT_ADMIN'), getAllKycRequests);
router.get('/:id', authorize('SUPER_ADMIN', 'FINANCE_ADMIN', 'PRODUCT_ADMIN'), getKycById);

// Approve and reject - only SUPER_ADMIN and FINANCE_ADMIN
router.patch('/:id/approve', authorize('SUPER_ADMIN', 'FINANCE_ADMIN'), validate(approveKycValidation), approveKyc);
router.patch('/:id/reject', authorize('SUPER_ADMIN', 'FINANCE_ADMIN'), validate(rejectKycValidation), rejectKyc);

module.exports = router;

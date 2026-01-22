const express = require('express');
const {
    getSchemes,
    createScheme,
    updateScheme,
    deleteScheme,
    enrollUser,
    payInstallment,
    getEnrollment,
    getEnrollments,
    getInstallments,
} = require('../controllers/scheme.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createSchemeValidation, enrollSchemeValidation } = require('../validations/scheme.validation');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getSchemes)
    .post(authorize('FINANCE_ADMIN'), validate(createSchemeValidation), createScheme);

router.route('/:id')
    .put(authorize('FINANCE_ADMIN'), validate(createSchemeValidation), updateScheme)
    .delete(authorize('FINANCE_ADMIN'), deleteScheme);

router.post('/enroll', authorize('FINANCE_ADMIN'), validate(enrollSchemeValidation), enrollUser);
router.get('/enrollments', authorize('FINANCE_ADMIN'), getEnrollments);
router.get('/enrollments/:id', getEnrollment);
router.get('/installments', authorize('FINANCE_ADMIN'), getInstallments);
router.patch('/installments/:id/pay', authorize('FINANCE_ADMIN'), payInstallment);

module.exports = router;

const express = require('express');
const {
    getSchemes,
    createScheme,
    enrollUser,
    payInstallment,
    getEnrollment,
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

router.post('/enroll', authorize('FINANCE_ADMIN'), validate(enrollSchemeValidation), enrollUser);
router.patch('/installments/:id/pay', authorize('FINANCE_ADMIN'), payInstallment);
router.get('/enrollments/:id', getEnrollment);

module.exports = router;

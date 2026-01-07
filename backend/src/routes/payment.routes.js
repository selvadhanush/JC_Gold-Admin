const express = require('express');
const {
    getPayments,
    getPayment,
    processRefund,
} = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const { logAction } = require('../middlewares/audit.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getPayments);

router.route('/:id')
    .get(getPayment);

router.post('/:id/refund', authorize('FINANCE_ADMIN'), logAction('PROCESS_REFUND', 'PAYMENT'), processRefund);

module.exports = router;

const express = require('express');
const {
    getPayments,
    getPayment,
    processRefund,
    getRefunds,
    updatePaymentStatus,
} = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const { logAction } = require('../middlewares/audit.middleware');

const router = express.Router();

router.use(protect);

// Specific routes
router.get('/refunds', authorize('FINANCE_ADMIN'), getRefunds);

router.route('/')
    .get(getPayments);

router.get('/debug/:id', (req, res) => {
    const mongoose = require('mongoose');
    const Payment = mongoose.model('Payment');
    Payment.findById(req.params.id)
        .then(p => res.json({ id: req.params.id, found: !!p, data: p }))
        .catch(e => res.status(500).json({ error: e.message }));
});

router.put('/:id/status', authorize('FINANCE_ADMIN'), logAction('UPDATE_PAYMENT_STATUS', 'PAYMENT'), updatePaymentStatus);

router.post('/:id/refund', authorize('FINANCE_ADMIN'), logAction('PROCESS_REFUND', 'PAYMENT'), processRefund);

router.route('/:id')
    .get(getPayment);

module.exports = router;

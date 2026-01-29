const express = require('express');
console.log('--- MOUNTING ADMIN DIGITAL GOLD ROUTES ---');
const {
    setGoldRate,
    getGoldRates,
    getLatestDashboardRates,
    approveTransaction,
    approveRedemption,
    getRedemptions,
    getTransactions,
    markReadyForPickup,
    markAsCollected,
    adjustUserGold
} = require('../controllers/adminDigitalGold.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { logAction } = require('../middlewares/audit.middleware');
const {
    goldRateValidation,
    approveTransactionValidation,
    adjustVaultValidation
} = require('../validations/digitalGold.validation');

const router = express.Router();

router.get('/redemptions', getRedemptions);

router.get('/dashboard-rates', getLatestDashboardRates);
router.get('/gold-rate', getGoldRates);

router.use(protect);

router.route('/gold-rate')
    .post(authorize('SUPER_ADMIN', 'FINANCE_ADMIN'), validate(goldRateValidation), logAction('SET_GOLD_RATE', 'DIGITAL_GOLD'), setGoldRate);

router.put('/approve/:id', authorize('SUPER_ADMIN', 'FINANCE_ADMIN'), validate(approveTransactionValidation), logAction('APPROVE_GOLD_PURCHASE', 'DIGITAL_GOLD'), approveTransaction);
router.put('/redemption/approve/:id', authorize('SUPER_ADMIN', 'FINANCE_ADMIN', 'ORDER_ADMIN'), validate(approveTransactionValidation), logAction('APPROVE_GOLD_REDEMPTION', 'DIGITAL_GOLD'), approveRedemption);

router.get('/redemptions', authorize('SUPER_ADMIN', 'FINANCE_ADMIN', 'ORDER_ADMIN'), getRedemptions);
router.get('/transactions', authorize('SUPER_ADMIN', 'FINANCE_ADMIN', 'ORDER_ADMIN'), getTransactions);

// Physical gold workflow routes
router.put('/redemption/ready-for-pickup/:id', authorize('SUPER_ADMIN', 'FINANCE_ADMIN', 'ORDER_ADMIN'), logAction('MARK_GOLD_READY_FOR_PICKUP', 'DIGITAL_GOLD'), markReadyForPickup);
router.put('/redemption/mark-collected/:id', authorize('SUPER_ADMIN', 'FINANCE_ADMIN', 'ORDER_ADMIN'), logAction('MARK_GOLD_COLLECTED', 'DIGITAL_GOLD'), markAsCollected);

router.post('/adjust-vault', authorize('SUPER_ADMIN', 'ORDER_ADMIN'), validate(adjustVaultValidation), logAction('ADJUST_USER_GOLD_VAULT', 'DIGITAL_GOLD'), adjustUserGold);

module.exports = router;

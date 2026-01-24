const express = require('express');
const {
    setGoldRate,
    getGoldRates,
    approveTransaction,
    approveRedemption
} = require('../controllers/adminDigitalGold.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { logAction } = require('../middlewares/audit.middleware');
const { 
    goldRateValidation, 
    approveTransactionValidation 
} = require('../validations/digitalGold.validation');

const router = express.Router();

router.use(protect);

router.route('/gold-rate')
    .post(authorize('SUPER_ADMIN', 'FINANCE_ADMIN'), validate(goldRateValidation), logAction('SET_GOLD_RATE', 'DIGITAL_GOLD'), setGoldRate)
    .get(getGoldRates);

router.put('/approve/:id', authorize('SUPER_ADMIN', 'FINANCE_ADMIN'), validate(approveTransactionValidation), logAction('APPROVE_GOLD_PURCHASE', 'DIGITAL_GOLD'), approveTransaction);
router.put('/redemption/approve/:id', authorize('SUPER_ADMIN', 'FINANCE_ADMIN', 'ORDER_ADMIN'), validate(approveTransactionValidation), logAction('APPROVE_GOLD_REDEMPTION', 'DIGITAL_GOLD'), approveRedemption);

module.exports = router;

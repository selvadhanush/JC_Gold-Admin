const express = require('express');
const {
    buyDigitalGold,
    getWalletBalance,
    requestRedemption,
    getTransactions
} = require('../../controllers/buyer/digitalGold.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { requireKycApproval } = require('../../middlewares/requireKyc.middleware');
const validate = require('../../middlewares/validate.middleware');
const { buyGoldValidation, redeemGoldValidation } = require('../../validations/digitalGold.validation');

const router = express.Router();

router.use(protectBuyer);

router.post('/buy', validate(buyGoldValidation), buyDigitalGold);
router.get('/wallet', getWalletBalance);
router.post('/redeem', requireKycApproval, validate(redeemGoldValidation), requestRedemption);
router.get('/transactions', getTransactions);

module.exports = router;

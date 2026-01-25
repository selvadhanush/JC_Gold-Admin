const express = require('express');
const {
    buyDigitalGold,
    requestRedemption,
    getWalletBalance,
    getTransactions
} = require('../../controllers/buyer/digitalGold.controller');
const {
    getLots,
    getLotById,
    getRedemptionLots
} = require('../../controllers/buyer/goldLot.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { requireMpinVerified } = require('../../middlewares/requireMpinVerified.middleware');
const { requireKycApproval } = require('../../middlewares/requireKyc.middleware');

const router = express.Router();

// All routes require buyer authentication and MPIN verification
router.use(protectBuyer);
router.use(requireMpinVerified);

router.post('/buy', buyDigitalGold);
router.post('/redeem', requireKycApproval, requestRedemption);
router.get('/wallet', getWalletBalance);
router.get('/transactions', getTransactions);

// LOT-BASED endpoints
router.get('/lots', getLots);
router.get('/lots/:id', getLotById);
router.get('/redemptions/:id/lots', getRedemptionLots);

module.exports = router;

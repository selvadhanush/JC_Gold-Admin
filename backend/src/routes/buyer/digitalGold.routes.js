const express = require('express');
const {
    buyDigitalGold,
    requestRedemption,
    getWalletBalance,
    getTransactions,
    getRedemptionRequests,
    getShopAddress
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

// Routes that require buyer authentication but NOT necessarily MPIN/KYC for basic info
router.use(protectBuyer);
router.get('/shop-address', getShopAddress);

// Routes that require MPIN verification
router.use(requireMpinVerified);

router.post('/buy', buyDigitalGold);
router.post('/redeem', requireKycApproval, requestRedemption);
router.get('/wallet', getWalletBalance);
router.get('/transactions', getTransactions);
router.get('/redemptions', getRedemptionRequests);

// LOT-BASED endpoints
router.get('/lots', getLots);
router.get('/lots/:id', getLotById);
router.get('/redemptions/:id/lots', getRedemptionLots);

module.exports = router;

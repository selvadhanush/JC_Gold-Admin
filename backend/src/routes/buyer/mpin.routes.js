const express = require('express');
const {
    setMpin,
    verifyMpin,
    changeMpin,
    getMpinStatus
} = require('../../controllers/buyer/mpin.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
    setMpinValidation,
    verifyMpinValidation,
    changeMpinValidation
} = require('../../validations/buyer/mpin.validation');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter for MPIN verification (5 attempts per 15 minutes)
const mpinVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        message: 'Too many MPIN verification attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// All routes require buyer authentication
router.use(protectBuyer);

router.post('/set', validate(setMpinValidation), setMpin);
router.post('/verify', mpinVerifyLimiter, validate(verifyMpinValidation), verifyMpin);
router.put('/change', validate(changeMpinValidation), changeMpin);
router.get('/status', getMpinStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../../controllers/buyer/profile.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { requireMpinVerified } = require('../../middlewares/requireMpinVerified.middleware');
const validate = require('../../middlewares/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../../validations/buyer/profile.validation');

// All routes require buyer authentication and MPIN verification
router.use(protectBuyer);
router.use(requireMpinVerified);

router.get('/', getProfile);
router.put('/', validate(updateProfileSchema), updateProfile);
router.put('/password', validate(changePasswordSchema), changePassword);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../../controllers/buyer/profile.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../../validations/buyer/profile.validation');

// All routes are protected
router.get('/', protectBuyer, getProfile);
router.put('/', protectBuyer, validate(updateProfileSchema), updateProfile);
router.put('/password', protectBuyer, validate(changePasswordSchema), changePassword);

module.exports = router;

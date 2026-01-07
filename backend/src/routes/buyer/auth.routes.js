const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../../controllers/buyer/auth.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { registerSchema, loginSchema } = require('../../validations/buyer/auth.validation');

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected routes
router.get('/me', protectBuyer, getMe);

module.exports = router;

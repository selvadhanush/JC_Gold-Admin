const jwt = require('jsonwebtoken');
const { BUYER_JWT_SECRET } = require('../config/env');

// @desc    Require MPIN verification to access buyer APIs
// @access  Middleware
exports.requireMpinVerified = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, BUYER_JWT_SECRET);

        // Check if MPIN is verified
        if (!decoded.mpinVerified) {
            return res.status(403).json({
                success: false,
                message: 'MPIN verification required',
                requireMpin: true
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

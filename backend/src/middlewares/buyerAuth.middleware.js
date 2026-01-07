const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protectBuyer = async (req, res, next) => {
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
            message: 'Not authorized to access this route',
        });
    }

    try {
        const BUYER_JWT_SECRET = process.env.BUYER_JWT_SECRET;
        
        if (!BUYER_JWT_SECRET) {
            throw new Error('BUYER_JWT_SECRET is not defined');
        }

        const decoded = jwt.verify(token, BUYER_JWT_SECRET);
        req.buyer = await User.findById(decoded.id);
        
        if (!req.buyer || req.buyer.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'User account is no longer active or does not exist',
            });
        }
        
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
};

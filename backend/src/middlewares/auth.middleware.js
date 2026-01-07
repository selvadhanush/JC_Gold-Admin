const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { JWT_SECRET } = require('../config/env');

exports.protect = async (req, res, next) => {
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
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = await Admin.findById(decoded.id).populate('role');
        
        if (!req.admin || !req.admin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Admin account is no longer active or does not exist',
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

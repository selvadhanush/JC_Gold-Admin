const Admin = require('../models/Admin');
const Role = require('../models/Role');
const ErrorResponse = require('../utils/errorResponse');
const generateToken = require('../utils/generateToken');

// @desc    Admin login
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return next(new ErrorResponse('Please provide an email and password', 400));
        }

        // Check for user
        const admin = await Admin.findOne({ email }).select('+password').populate('role');

        if (!admin) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        // Check if password matches
        const isMatch = await admin.matchPassword(password);

        if (!isMatch) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        // Check if active
        if (!admin.isActive) {
            return next(new ErrorResponse('Account is deactivated', 401));
        }

        // Update last login
        admin.lastLogin = Date.now();
        await admin.save();

        const token = generateToken(admin._id);

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role.name,
            },
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in admin
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            admin: req.admin,
        });
    } catch (err) {
        next(err);
    }
};

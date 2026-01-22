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
        console.log('🔐 Login attempt for:', email);

        // Validate email & password
        if (!email || !password) {
            console.log('❌ Missing credentials');
            return next(new ErrorResponse('Please provide an email and password', 400));
        }

        // Check for user
        const admin = await Admin.findOne({ email }).select('+password').populate('role');
        console.log('👤 Admin found:', admin ? 'YES' : 'NO');

        if (!admin) {
            console.log('❌ Admin not found in database');
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        console.log('🔑 Admin details:', {
            name: admin.name,
            email: admin.email,
            role: admin.role?.name,
            isActive: admin.isActive
        });

        // Check if password matches
        const isMatch = await admin.matchPassword(password);
        console.log('🔒 Password match:', isMatch ? 'YES' : 'NO');

        if (!isMatch) {
            console.log('❌ Password mismatch');
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        // Check if active
        if (!admin.isActive) {
            console.log('❌ Account is deactivated');
            return next(new ErrorResponse('Account is deactivated', 401));
        }

        // Update last login
        admin.lastLogin = Date.now();
        await admin.save();

        const token = generateToken(admin._id);
        console.log('✅ Login successful, token generated');

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
        console.error('💥 Login error:', err);
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

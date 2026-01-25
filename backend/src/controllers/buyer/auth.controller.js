const User = require('../../models/User');
const ErrorResponse = require('../../utils/errorResponse');
const jwt = require('jsonwebtoken');

// @desc    Register a new buyer
// @route   POST /api/v1/buyer/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            phoneNumber: phone,
        });

        // Generate token
        const token = generateBuyerToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                },
                token,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Login buyer
// @route   POST /api/v1/buyer/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated',
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Generate token (basic JWT without mpinVerified flag)
        const token = generateBuyerToken(user._id);
        
        // Check MPIN status
        const mpinSet = user.mpin?.isSet || false;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                },
                token,
                mpinRequired: !mpinSet,  // Frontend knows to show set/verify screen
                mpinSet: mpinSet
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Get current buyer profile
// @route   GET /api/v1/buyer/auth/me
// @access  Private (Buyer)
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.buyer._id);

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                address: user.address,
                wallet: user.wallet,
                isActive: user.isActive,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// Helper function to generate buyer JWT token
const generateBuyerToken = (id) => {
    const BUYER_JWT_SECRET = process.env.BUYER_JWT_SECRET;
    const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
    
    return jwt.sign({ id }, BUYER_JWT_SECRET, {
        expiresIn: JWT_EXPIRE,
    });
};

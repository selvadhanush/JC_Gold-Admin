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

        // Generate tokens
        const token = generateBuyerToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Store refresh token in DB
        user.refreshToken = refreshToken;
        await user.save();

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
                refreshToken,
                mpinRequired: !mpinSet,
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

// @desc    Refresh token
// @route   POST /api/v1/buyer/auth/refresh
// @access  Public
exports.refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token required' });
        }

        // Verify refresh token
        const BUYER_JWT_SECRET = process.env.BUYER_JWT_SECRET;
        const decoded = jwt.verify(refreshToken, BUYER_JWT_SECRET);

        // Find user and verify stored refresh token
        const user = await User.findById(decoded.id).select('+refreshToken');

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        // Generate new tokens preserving the claims from the old refresh token
        const extraClaims = { mpinVerified: decoded.mpinVerified || false };
        const newToken = generateBuyerToken(user._id, extraClaims);
        const newRefreshToken = generateRefreshToken(user._id, extraClaims);

        // Update stored refresh token
        user.refreshToken = newRefreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            token: newToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
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
const generateBuyerToken = (id, extraClaims = {}) => {
    const BUYER_JWT_SECRET = process.env.BUYER_JWT_SECRET;
    const JWT_EXPIRE = process.env.ACCESS_TOKEN_EXPIRE || '30m';

    return jwt.sign({ id, ...extraClaims }, BUYER_JWT_SECRET, {
        expiresIn: JWT_EXPIRE,
    });
};

const generateRefreshToken = (id, extraClaims = {}) => {
    const BUYER_JWT_SECRET = process.env.BUYER_JWT_SECRET;
    const REFRESH_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '30d';

    return jwt.sign({ id, ...extraClaims }, BUYER_JWT_SECRET, {
        expiresIn: REFRESH_EXPIRE,
    });
};

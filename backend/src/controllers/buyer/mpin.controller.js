const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { BUYER_JWT_SECRET } = require('../../config/env');

// @desc    Set MPIN (first time only)
// @route   POST /api/v1/buyer/mpin/set
// @access  Private (Buyer)
exports.setMpin = async (req, res, next) => {
    try {
        const { mpin } = req.body;

        // Get user with MPIN fields
        const user = await User.findById(req.buyer._id).select('+mpin.hash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if MPIN is already set
        if (user.mpin && user.mpin.isSet) {
            return res.status(400).json({
                success: false,
                message: 'MPIN is already set. Use change MPIN to update.'
            });
        }

        // Hash MPIN
        const salt = await bcrypt.genSalt(10);
        const hashedMpin = await bcrypt.hash(mpin, salt);

        // Set MPIN
        user.mpin = {
            hash: hashedMpin,
            isSet: true,
            attempts: 0,
            lockedUntil: null
        };

        await user.save();

        res.status(201).json({
            success: true,
            message: 'MPIN set successfully. Please verify to continue.'
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Verify MPIN (app entry)
// @route   POST /api/v1/buyer/mpin/verify
// @access  Private (Buyer)
exports.verifyMpin = async (req, res, next) => {
    try {
        const { mpin } = req.body;

        // Get user with MPIN hash
        const user = await User.findById(req.buyer._id).select('+mpin.hash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if MPIN is set
        if (!user.mpin || !user.mpin.isSet) {
            return res.status(400).json({
                success: false,
                message: 'MPIN not set. Please set MPIN first.'
            });
        }

        // Check if MPIN is locked
        if (user.mpin.lockedUntil && user.mpin.lockedUntil > new Date()) {
            const remainingTime = Math.ceil((user.mpin.lockedUntil - new Date()) / 60000);
            return res.status(403).json({
                success: false,
                message: `MPIN is locked. Please try again after ${remainingTime} minutes.`,
                locked: true,
                lockedUntil: user.mpin.lockedUntil
            });
        }

        // Verify MPIN
        const isMatch = await user.matchMpin(mpin);

        if (!isMatch) {
            // Increment attempts
            user.mpin.attempts = (user.mpin.attempts || 0) + 1;

            // Lock after 3 failed attempts
            if (user.mpin.attempts >= 3) {
                user.mpin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                await user.save();

                return res.status(403).json({
                    success: false,
                    message: 'MPIN is locked due to multiple failed attempts. Please try again after 15 minutes.',
                    locked: true,
                    lockedUntil: user.mpin.lockedUntil
                });
            }

            await user.save();

            return res.status(401).json({
                success: false,
                message: 'Invalid MPIN. Please try again.'
            });
        }

        // Success - Reset attempts and clear lock
        user.mpin.attempts = 0;
        user.mpin.lockedUntil = null;
        await user.save();

        // Success - Reset attempts and clear lock
        user.mpin.attempts = 0;
        user.mpin.lockedUntil = null;
        await user.save();

        // Generate MPIN-verified JWTs
        const token = jwt.sign(
            { id: user._id, mpinVerified: true },
            BUYER_JWT_SECRET,
            { expiresIn: '30m' }
        );

        const refreshToken = jwt.sign(
            { id: user._id, mpinVerified: true },
            BUYER_JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Store refresh token
        user.refreshToken = refreshToken;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'MPIN verified successfully',
            token,
            refreshToken,
            expiresIn: 1800
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Change MPIN
// @route   PUT /api/v1/buyer/mpin/change
// @access  Private (Buyer)
exports.changeMpin = async (req, res, next) => {
    try {
        const { oldMpin, newMpin } = req.body;

        // Get user with MPIN hash
        const user = await User.findById(req.buyer._id).select('+mpin.hash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if MPIN is set
        if (!user.mpin || !user.mpin.isSet) {
            return res.status(400).json({
                success: false,
                message: 'MPIN not set. Please set MPIN first.'
            });
        }

        // Verify old MPIN
        const isMatch = await user.matchMpin(oldMpin);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid old MPIN'
            });
        }

        // Check if new MPIN is same as old
        const isSame = await bcrypt.compare(newMpin, user.mpin.hash);
        if (isSame) {
            return res.status(400).json({
                success: false,
                message: 'New MPIN cannot be the same as old MPIN'
            });
        }

        // Hash new MPIN
        const salt = await bcrypt.genSalt(10);
        const hashedMpin = await bcrypt.hash(newMpin, salt);

        // Update MPIN
        user.mpin.hash = hashedMpin;
        user.mpin.attempts = 0;
        user.mpin.lockedUntil = null;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'MPIN changed successfully. Please verify again to continue.',
            requireReVerification: true
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Get MPIN status
// @route   GET /api/v1/buyer/mpin/status
// @access  Private (Buyer)
exports.getMpinStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.buyer._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isLocked = user.mpin?.lockedUntil && user.mpin.lockedUntil > new Date();

        res.status(200).json({
            success: true,
            data: {
                isSet: user.mpin?.isSet || false,
                locked: isLocked,
                lockedUntil: isLocked ? user.mpin.lockedUntil : null
            }
        });

    } catch (err) {
        next(err);
    }
};

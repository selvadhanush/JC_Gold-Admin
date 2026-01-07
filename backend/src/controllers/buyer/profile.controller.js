const User = require('../../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get buyer profile
// @route   GET /api/v1/buyer/profile
// @access  Private (Buyer)
exports.getProfile = async (req, res) => {
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
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Update buyer profile
// @route   PUT /api/v1/buyer/profile
// @access  Private (Buyer)
exports.updateProfile = async (req, res) => {
    try {
        const { name, phoneNumber, address } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (address) updateData.address = address;

        const user = await User.findByIdAndUpdate(
            req.buyer._id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                address: user.address,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Change buyer password
// @route   PUT /api/v1/buyer/profile/password
// @access  Private (Buyer)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.buyer._id).select('+password');

        // Check current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

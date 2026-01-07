const User = require('../models/User');
const Order = require('../models/Order');
const UserScheme = require('../models/UserScheme');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-wallet');
        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private (Admin)
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return next(new ErrorResponse('User not found', 404));
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Block / Unblock user
// @route   PATCH /api/v1/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { isActive }, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return next(new ErrorResponse('User not found', 404));
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user order history
// @route   GET /api/v1/users/:id/orders
// @access  Private (Admin)
exports.getUserOrderHistory = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.params.id }).sort('-createdAt');
        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get user scheme participation
// @route   GET /api/v1/users/:id/schemes
// @access  Private (Admin)
exports.getUserSchemeParticipation = async (req, res, next) => {
    try {
        const schemes = await UserScheme.find({ user: req.params.id }).populate('scheme');
        res.status(200).json({
            success: true,
            count: schemes.length,
            data: schemes,
        });
    } catch (err) {
        next(err);
    }
};

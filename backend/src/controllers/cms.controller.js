const Banner = require('../models/Banner');
const CMS = require('../models/CMS');
const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');

// --- Banner Management ---

// @desc    Get all banners
// @route   GET /api/v1/cms/banners
// @access  Public
exports.getBanners = async (req, res, next) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort('order');
        res.status(200).json({
            success: true,
            data: banners,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create banner
// @route   POST /api/v1/cms/banners
// @access  Private (Admin)
exports.createBanner = async (req, res, next) => {
    try {
        const banner = await Banner.create(req.body);
        res.status(201).json({
            success: true,
            data: banner,
        });
    } catch (err) {
        next(err);
    }
};

// --- FAQ & Terms Management ---

// @desc    Get CMS content by type (FAQ / TERMS)
// @route   GET /api/v1/cms/content/:type
// @access  Public
exports.getContent = async (req, res, next) => {
    try {
        const { type } = req.params;
        const items = await CMS.find({ type, isActive: true });
        res.status(200).json({
            success: true,
            data: items,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create/Update CMS content
// @route   POST /api/v1/cms/content
// @access  Private (Admin)
exports.upsertContent = async (req, res, next) => {
    try {
        const { type, title, content } = req.body;
        const item = await CMS.findOneAndUpdate(
            { type, title },
            { content, isActive: true },
            { upsert: true, new: true }
        );
        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (err) {
        next(err);
    }
};

// --- Notifications ---

// @desc    Trigger notification (Mocked)
// @route   POST /api/v1/cms/notify
// @access  Private (Admin)
exports.triggerNotification = async (req, res, next) => {
    try {
        const { userId, title, message, type } = req.body;
        
        // Mock email trigger
        console.log(`[MOCK EMAIL] To: User(${userId}), Subject: ${title}, Body: ${message}`);

        // Store in DB
        const notification = await Notification.create({
            recipient: userId,
            title,
            message,
            type
        });

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notification triggered and stored'
        });
    } catch (err) {
        next(err);
    }
};

const CMS = require('../models/CMS');
const Notification = require('../models/Notification');
const Newsletter = require('../models/Newsletter');
const ErrorResponse = require('../utils/errorResponse');

// --- Banner Management ---

// @desc    Get all banners
// @route   GET /api/v1/cms/banners
// @access  Public
exports.getBanners = async (req, res, next) => {
    try {
        const banners = await CMS.find({ type: 'BANNER', isActive: true }).sort('order');
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
        const banner = await CMS.create({ ...req.body, type: 'BANNER' });
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

// @desc    Trigger individual notification (Mocked)
// @route   POST /api/v1/cms/notify
// @access  Private (Admin)
exports.triggerNotification = async (req, res, next) => {
    try {
        const { userId, title, message, type } = req.body;

        // Mock email/push trigger
        console.log(`[MOCK NOTIFY] To: User(${userId}), Subject: ${title}, Body: ${message}`);

        // Store in DB
        const notification = await Notification.create({
            recipient: userId,
            title,
            message,
            type: type || 'INFO'
        });

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Individual notification triggered'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Broadcast to all users
// @route   POST /api/v1/cms/broadcast
// @access  Private (Admin)
exports.broadcastNotification = async (req, res, next) => {
    try {
        const { title, message, type } = req.body;

        // Mock global trigger
        console.log(`[GLOBAL BROADCAST] Title: ${title}, Body: ${message}`);

        const notification = await Notification.create({
            recipient: null,
            title,
            message,
            type: type || 'ANNOUNCEMENT',
            isRead: false
        });

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Broadcast payload delivered to all nodes'
        });
    } catch (err) {
        next(err);
    }
};

// --- Newsletter Management ---

// @desc    Get all newsletters
// @route   GET /api/v1/cms/newsletters
// @access  Private (Admin)
exports.getNewsletters = async (req, res, next) => {
    try {
        const newsletters = await Newsletter.find().sort('-createdAt');
        res.status(200).json({
            success: true,
            data: newsletters
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create newsletter draft
// @route   POST /api/v1/cms/newsletters
// @access  Private (Admin)
exports.createNewsletter = async (req, res, next) => {
    try {
        const newsletter = await Newsletter.create({
            ...req.body,
            createdBy: req.user.id
        });
        res.status(201).json({
            success: true,
            data: newsletter
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Send newsletter
// @route   POST /api/v1/cms/newsletters/:id/send
// @access  Private (Admin)
exports.sendNewsletter = async (req, res, next) => {
    try {
        const newsletter = await Newsletter.findById(req.params.id);
        if (!newsletter) {
            return next(new ErrorResponse('Newsletter not found', 404));
        }

        // Mock sending bulk email
        console.log(`[BULK EMAIL] Sending Newsletter: ${newsletter.subject}`);

        newsletter.status = 'SENT';
        newsletter.sentAt = Date.now();
        await newsletter.save();

        res.status(200).json({
            success: true,
            message: 'Newsletter dispatched to all subscribers'
        });
    } catch (err) {
        next(err);
    }
};
// @desc    Seed initial legal content
// @route   POST /api/v1/cms/seed
// @access  Private (Admin)
exports.seedLegalContent = async (req, res, next) => {
    try {
        const initialContent = [
            {
                type: 'TERMS',
                title: 'Terms of Service',
                content: `1. ACCEPTANCE OF TERMS\nBy accessing JC Gold, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.\n\n2. GOLD TRANSACTIONS\nAll digital gold purchases are finalized at the current market rate plus applicable taxes. Once confirmed, transactions cannot be reversed except as per our refund policy.\n\n3. USER RESPONSIBILITIES\nYou are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.`
            },
            {
                type: 'PRIVACY',
                title: 'Privacy Policy',
                content: `1. DATA COLLECTION\nWe collect your personal information primarily for KYC compliance, transaction security, and improving your user experience.\n\n2. DATA USAGE\nYour data is never sold to third parties. We use industry-standard encryption to protect your sensitive information while it is in transit and at rest.\n\n3. YOUR RIGHTS\nYou have the right to access, correct, or request deletion of your personal data at any time through the app settings or support.`
            },
            {
                type: 'REFUND',
                title: 'Refund Architecture',
                content: `1. CANCELLATION\nOrders for digital gold can be cancelled within 15 minutes of placement if they have not yet been processed by our vault partners.\n\n2. REFUND TIMELINE\nApproved refunds will be processed back to your original payment source within 5-7 business days. Please note that bank processing times may vary.\n\n3. NON-REFUNDABLE ASSETS\nPhysical gold delivery orders are non-refundable once they have been picked up for shipping.`
            },
            {
                type: 'FAQ',
                title: 'Technical FAQ',
                content: `Q: How is the gold rate determined?\nA: Rates are updated live based on global market indices and local market taxes.\n\nQ: Is my digital gold safe?\nA: Yes, it is insured and held in secure, world-class vaults (Brink's/Sequel).\n\nQ: What are the minimum purchase limits?\nA: You can start building your wealth with as little as 1mg of 24K gold.`
            }
        ];

        for (const item of initialContent) {
            await CMS.findOneAndUpdate(
                { type: item.type, title: item.title },
                { content: item.content, isActive: true },
                { upsert: true }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Legal content seeded successfully'
        });
    } catch (err) {
        next(err);
    }
};

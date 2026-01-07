const Notification = require('../../models/Notification');

// @desc    Get buyer's notifications
// @route   GET /api/v1/buyer/notifications
// @access  Private (Buyer)
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.buyer._id })
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/v1/buyer/notifications/:id/read
// @access  Private (Buyer)
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        // Verify ownership
        if (notification.recipient.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

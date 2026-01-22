const Notification = require('../../models/Notification');

// @desc    Get admin's notifications
// @route   GET /api/v1/admin/notifications
// @access  Private (Admin)
exports.getAdminNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id,
            recipientType: 'Admin'
        }).sort('-createdAt');

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

// @desc    Mark admin notification as read
// @route   PATCH /api/v1/admin/notifications/:id/read
// @access  Private (Admin)
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
        if (notification.recipient.toString() !== req.user._id.toString() || notification.recipientType !== 'Admin') {
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

// @desc    Mark all admin notifications as read
// @route   PATCH /api/v1/admin/notifications/read-all
// @access  Private (Admin)
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, recipientType: 'Admin', isRead: false },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

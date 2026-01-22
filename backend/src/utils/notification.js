const Notification = require('../models/Notification');
const Admin = require('../models/Admin');
const Role = require('../models/Role');

/**
 * Send notification to all admins with specific roles
 * @param {Array} roles - Array of role names (e.g., ['ORDER_ADMIN', 'SUPER_ADMIN'])
 * @param {Object} data - Notification data {title, message, type, link}
 */
const notifyAdmins = async (roles, data) => {
    try {
        const roleDocs = await Role.find({ name: { $in: roles } });
        const roleIds = roleDocs.map(r => r._id);

        const admins = await Admin.find({ role: { $in: roleIds }, isActive: true });

        const notifications = admins.map(admin => ({
            recipient: admin._id,
            recipientType: 'Admin',
            title: data.title,
            message: data.message,
            type: data.type || 'SYSTEM',
            link: data.link
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error('Error sending admin notifications:', error);
    }
};

/**
 * Send notification to a specific user or admin
 * @param {String} recipientId - ID of the recipient
 * @param {String} recipientType - 'User' or 'Admin'
 * @param {Object} data - Notification data {title, message, type, link}
 */
const notifyRecipient = async (recipientId, recipientType, data) => {
    try {
        await Notification.create({
            recipient: recipientId,
            recipientType,
            title: data.title,
            message: data.message,
            type: data.type || 'SYSTEM',
            link: data.link
        });
    } catch (error) {
        console.error('Error sending recipient notification:', error);
    }
};

module.exports = { notifyAdmins, notifyRecipient };

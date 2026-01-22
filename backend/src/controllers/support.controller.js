const Support = require('../models/Support');
const Order = require('../models/Order');

// @desc    Create support ticket
// @route   POST /api/v1/buyer/support
// @access  Private (Buyer)
exports.createTicket = async (req, res) => {
    try {
        const { orderId, category, subject, message } = req.body;

        // Verify order exists and belongs to user
        const order = await Order.findOne({ _id: orderId, user: req.buyer._id });
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or access denied'
            });
        }

        const ticket = await Support.create({
            user: req.buyer._id,
            order: orderId,
            category,
            subject,
            message
        });

        res.status(201).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get buyer tickets
// @route   GET /api/v1/buyer/support
// @access  Private (Buyer)
exports.getBuyerTickets = async (req, res) => {
    try {
        const tickets = await Support.find({ user: req.buyer._id })
            .populate('order', 'orderNumber orderStatus')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get admin tickets
// @route   GET /api/v1/support
// @access  Private (Admin)
exports.getAdminTickets = async (req, res) => {
    try {
        let query = {};

        // Role-based filtering
        if (req.admin.role.name === 'PRODUCT_ADMIN') {
            query.category = 'PRODUCT';
        } else if (req.admin.role.name === 'FINANCE_ADMIN') {
            query.category = 'PAYMENT';
        }

        // Order-based filtering (for Order Admin or specific lookups)
        if (req.query.orderId) {
            query.order = req.query.orderId;
        }

        const tickets = await Support.find(query)
            .populate('user', 'name email')
            .populate('order', 'orderNumber orderStatus totalAmount')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update ticket (Admin Response)
// @route   PUT /api/v1/support/:id
// @access  Private (Admin)
exports.updateTicket = async (req, res) => {
    try {
        const { status, adminResponse } = req.body;

        const ticket = await Support.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.status = status || ticket.status;
        if (adminResponse) {
            ticket.adminResponse = adminResponse;
            ticket.respondedBy = req.admin._id;
            ticket.respondedAt = Date.now();
            if (ticket.status === 'OPEN') {
                ticket.status = 'RESOLVED';
            }
        }

        await ticket.save();

        res.status(200).json({
            success: true,
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

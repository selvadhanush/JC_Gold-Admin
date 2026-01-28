const GeneralTicket = require('../models/GeneralTicket');

// @desc    Create general ticket
// @route   POST /api/v1/general-tickets
// @access  Private (Buyer)
exports.createTicket = async (req, res) => {
    try {
        const { subject, message } = req.body;

        const ticket = await GeneralTicket.create({
            user: req.buyer._id, // Assumes buyer auth middleware sets req.buyer
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

// @desc    Get buyer general tickets
// @route   GET /api/v1/general-tickets/my
// @access  Private (Buyer)
exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await GeneralTicket.find({ user: req.buyer._id })
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

// @desc    Get all general tickets (Super Admin)
// @route   GET /api/v1/general-tickets/admin
// @access  Private (Admin - Super Admin Only)
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await GeneralTicket.find({})
            .populate('user', 'name email')
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

// @desc    Update general ticket (Admin Response)
// @route   PUT/PATCH /api/v1/general-tickets/:id
// @access  Private (Admin)
exports.updateTicket = async (req, res) => {
    try {
        const { status, adminResponse } = req.body;
        const ticket = await GeneralTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        if (status) ticket.status = status;
        if (adminResponse) {
            ticket.adminResponse = adminResponse;
            ticket.respondedBy = req.admin._id; // Assumes admin auth middleware sets req.admin
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

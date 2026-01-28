const express = require('express');
const router = express.Router();
const {
    createTicket,
    getMyTickets,
    getAllTickets,
    updateTicket
} = require('../controllers/generalTicket.controller');

// Middleware
const { protectBuyer } = require('../middlewares/buyerAuth.middleware'); // Buyer auth
const { protect } = require('../middlewares/auth.middleware'); // Admin auth
const { authorize } = require('../middlewares/role.middleware'); // Role auth

// Buyer Routes
router.post('/', protectBuyer, createTicket);
router.get('/my', protectBuyer, getMyTickets);

// Admin Routes (Super Admin Only)
router.get('/admin', protect, authorize('SUPER_ADMIN'), getAllTickets);
router.put('/:id', protect, updateTicket);
router.patch('/:id', protect, updateTicket); // Support both PUT and PATCH

module.exports = router;

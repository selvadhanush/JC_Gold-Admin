const express = require('express');
const router = express.Router();
const {
    createTicket,
    getBuyerTickets,
    getAdminTickets,
    updateTicket
} = require('../controllers/support.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { protectBuyer } = require('../middlewares/buyerAuth.middleware');

// Buyer Routes
router.post('/buyer', protectBuyer, createTicket);
router.get('/buyer', protectBuyer, getBuyerTickets);

// Admin Routes
router.get('/admin', protect, getAdminTickets);
router.put('/admin/:id', protect, updateTicket);

module.exports = router;

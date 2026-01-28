const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { NODE_ENV } = require('./config/env');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
});
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/categories', require('./routes/category.routes'));
app.use('/api/v1/products', require('./routes/product.routes'));
app.use('/api/v1/inventory', require('./routes/inventory.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/orders', require('./routes/order.routes'));
app.use('/api/v1/schemes', require('./routes/scheme.routes'));
app.use('/api/v1/payments', require('./routes/payment.routes'));
app.use('/api/v1/dashboard', require('./routes/dashboard.routes'));
app.use('/api/v1/cms', require('./routes/cms.routes'));
app.use('/api/v1/audit', require('./routes/audit.routes'));
app.use('/api/v1/admin-management', require('./routes/admin_management.routes'));
app.use('/api/v1/super-admin', require('./routes/super_admin.routes'));
app.use('/api/v1/admin/notifications', require('./routes/admin_notification.routes'));
app.use('/api/v1/support', require('./routes/support.routes'));
app.use('/api/v1/general-tickets', require('./routes/generalTicket.routes'));
app.use('/api/v1/maintenance', require('./routes/maintenance.routes'));

// Buyer Routes - Apply maintenance middleware
const { checkMaintenance } = require('./middlewares/maintenance.middleware');

// Auth routes don't need maintenance check (buyers need to login to see maintenance status)
app.use('/api/v1/buyer/auth', require('./routes/buyer/auth.routes'));
// All other buyer routes with maintenance check
app.use('/api/v1/buyer/profile', checkMaintenance, require('./routes/buyer/profile.routes'));
app.use('/api/v1/buyer/addresses', checkMaintenance, require('./routes/buyer/address.routes'));
app.use('/api/v1/buyer/products', checkMaintenance, require('./routes/buyer/product.routes'));
app.use('/api/v1/buyer/wishlist', checkMaintenance, require('./routes/buyer/wishlist.routes'));
app.use('/api/v1/buyer/cart', checkMaintenance, require('./routes/buyer/cart.routes'));
app.use('/api/v1/buyer/orders', checkMaintenance, require('./routes/buyer/order.routes'));
app.use('/api/v1/buyer/payments', checkMaintenance, require('./routes/buyer/payment.routes'));
app.use('/api/v1/buyer/schemes', checkMaintenance, require('./routes/buyer/scheme.routes'));
app.use('/api/v1/buyer/notifications', checkMaintenance, require('./routes/buyer/notification.routes'));
app.use('/api/v1/buyer/digital-gold', checkMaintenance, require('./routes/buyer/digitalGold.routes'));
app.use('/api/v1/buyer/kyc', checkMaintenance, require('./routes/buyer/kyc.routes'));
app.use('/api/v1/buyer/mpin', checkMaintenance, require('./routes/buyer/mpin.routes'));
app.use('/api/v1/buyer/bank-account', checkMaintenance, require('./routes/buyer/bankAccount.routes'));

// Admin Digital Gold routes
console.log('--- ATTEMPTING TO MOUNT ADMIN DIGITAL GOLD ROUTES ---');
app.use('/api/v1/admin/digital-gold', require('./routes/adminDigitalGold.routes'));
console.log('--- ADMIN DIGITAL GOLD ROUTES MOUNTED ---');

// Admin KYC routes
app.use('/api/v1/admin/kyc', require('./routes/admin/kyc.routes'));




app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Jewellery Admin Backend API' });
});

// API 404 Handler
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API Route ${req.originalUrl} not found on this server`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    console.error('SERVER ERROR:', err);
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: NODE_ENV === 'development' ? err.stack : undefined,
    });
});

module.exports = app;

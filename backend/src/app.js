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

// Buyer Routes
app.use('/api/v1/buyer/auth', require('./routes/buyer/auth.routes'));
app.use('/api/v1/buyer/profile', require('./routes/buyer/profile.routes'));
app.use('/api/v1/buyer/addresses', require('./routes/buyer/address.routes'));
app.use('/api/v1/buyer/products', require('./routes/buyer/product.routes'));
app.use('/api/v1/buyer/wishlist', require('./routes/buyer/wishlist.routes'));
app.use('/api/v1/buyer/cart', require('./routes/buyer/cart.routes'));
app.use('/api/v1/buyer/orders', require('./routes/buyer/order.routes'));
app.use('/api/v1/buyer/payments', require('./routes/buyer/payment.routes'));
app.use('/api/v1/buyer/schemes', require('./routes/buyer/scheme.routes'));
app.use('/api/v1/buyer/notifications', require('./routes/buyer/notification.routes'));




app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Jewellery Admin Backend API' });
});

// Global Error Handler (to be expanded later)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: NODE_ENV === 'development' ? err.stack : undefined,
    });
});

module.exports = app;

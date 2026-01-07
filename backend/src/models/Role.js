const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['SUPER_ADMIN', 'PRODUCT_ADMIN', 'ORDER_ADMIN', 'FINANCE_ADMIN'],
    },
    permissions: [{
        type: String,
    }],
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);

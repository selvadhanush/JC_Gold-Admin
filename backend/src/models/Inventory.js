const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        unique: true,
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0,
    },
    lowStockThreshold: {
        type: Number,
        default: 5,
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);

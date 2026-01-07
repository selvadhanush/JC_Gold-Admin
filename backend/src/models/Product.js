const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a product name'],
        trim: true,
    },
    sku: {
        type: String,
        required: [true, 'Please provide a SKU'],
        unique: true,
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    images: [{
        type: String,
    }],
    specifications: {
        metalType: { type: String, enum: ['GOLD', 'SILVER', 'PLATINUM', 'OTHER'] },
        purity: { type: String },
        weight: { type: Number }, // in grams
        size: { type: String },
    },
    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'],
        default: 'ACTIVE',
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Indexing for search
productSchema.index({ name: 'text', description: 'text', sku: 'text' });

module.exports = mongoose.model('Product', productSchema);

const Product = require('../models/Product');
const Category = require('../models/Category');
const Inventory = require('../models/Inventory');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private (SUPER_ADMIN, PRODUCT_ADMIN)
exports.createProduct = async (req, res, next) => {
    try {
        // Handle uploaded images
        let images = [];
        if (req.files) {
            images = req.files.map(file => `/uploads/products/${file.filename}`);
        }

        const product = await Product.create({
            ...req.body,
            images,
        });

        // Auto-initialize inventory
        await Inventory.create({
            product: product._id,
            quantity: req.body.initialStock || 0,
            lastUpdatedBy: req.admin._id,
        });

        res.status(201).json({
            success: true,
            data: product,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Private
exports.getProducts = async (req, res, next) => {
    try {
        const products = await Product.find().populate('category');

        // Fetch inventory for each product
        const productIds = products.map(p => p._id);
        const inventories = await Inventory.find({ product: { $in: productIds } });

        const data = products.map(product => {
            const inv = inventories.find(i => i.product.toString() === product._id.toString());
            return {
                ...product._doc,
                stock: inv ? inv.quantity : 0,
            };
        });

        res.status(200).json({
            success: true,
            count: data.length,
            data,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            return next(new ErrorResponse('Product not found', 404));
        }

        const inv = await Inventory.findOne({ product: product._id });

        res.status(200).json({
            success: true,
            data: {
                ...product._doc,
                stock: inv ? inv.quantity : 0,
            },
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private (SUPER_ADMIN, PRODUCT_ADMIN)
exports.updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) {
            return next(new ErrorResponse('Product not found', 404));
        }

        // Handle new images if uploaded
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
            req.body.images = [...(product.images || []), ...newImages];
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        // Handle stock update if provided
        if (req.body.initialStock !== undefined) {
            await Inventory.findOneAndUpdate(
                { product: req.params.id },
                { quantity: req.body.initialStock, lastUpdatedBy: req.admin._id },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update product status
// @route   PATCH /api/v1/products/:id/status
// @access  Private (SUPER_ADMIN, PRODUCT_ADMIN)
exports.updateProductStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'].includes(status)) {
            return next(new ErrorResponse('Invalid status', 400));
        }

        const product = await Product.findByIdAndUpdate(req.params.id, { status }, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update product stock
// @route   PATCH /api/v1/products/:id/stock
// @access  Private (SUPER_ADMIN, PRODUCT_ADMIN)
exports.updateProductStock = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        if (typeof quantity !== 'number' || quantity < 0) {
            return next(new ErrorResponse('Invalid quantity', 400));
        }

        const inv = await Inventory.findOneAndUpdate(
            { product: req.params.id },
            { quantity, lastUpdatedBy: req.admin._id },
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: inv,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private (SUPER_ADMIN, PRODUCT_ADMIN)
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return next(new ErrorResponse('Product not found', 404));
        }

        await Product.deleteOne({ _id: req.params.id });
        await Inventory.deleteOne({ product: req.params.id });

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (err) {
        next(err);
    }
};

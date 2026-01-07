const Product = require('../../models/Product');
const Category = require('../../models/Category');

// @desc    Get all products (with filters)
// @route   GET /api/v1/buyer/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, metal, purity, status } = req.query;

        // Build query
        let query = { status: 'active' }; // Only show active products to buyers

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (metal) {
            query.metal = metal;
        }

        if (purity) {
            query.purity = purity;
        }

        const products = await Product.find(query)
            .populate('category', 'name')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Get single product by ID
// @route   GET /api/v1/buyer/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name description');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Only show active products
        if (product.status !== 'active') {
            return res.status(404).json({
                success: false,
                message: 'Product not available',
            });
        }

        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Get all categories
// @route   GET /api/v1/buyer/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ status: 'active' }).sort('name');

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

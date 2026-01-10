const Product = require('../../models/Product');
const Category = require('../../models/Category');

// @desc    Get all products (with filters)
// @route   GET /api/v1/buyer/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        console.log('=== GET PRODUCTS API CALLED ===');
        const { category, search, minPrice, maxPrice, metal, purity, isFeatured, limit } = req.query;
        console.log('Query params:', { category, search, minPrice, maxPrice, metal, purity, isFeatured, limit });

        // Build query
        let query = { status: 'ACTIVE' }; // Only show active products to buyers
        console.log('Initial query:', query);

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
            query['specifications.metalType'] = metal;
        }

        if (purity) {
            query['specifications.purity'] = purity;
        }

        if (isFeatured === 'true') {
            query.isFeatured = true;
        }

        console.log('Final query:', JSON.stringify(query, null, 2));

        let productQuery = Product.find(query)
            .populate('category', 'name')
            .sort('-createdAt');

        if (limit) {
            productQuery = productQuery.limit(Number(limit));
        }

        const products = await productQuery;
        console.log(`Found ${products.length} products`);
        if (products.length > 0) {
            console.log('First product:', products[0].name, 'Status:', products[0].status, 'Featured:', products[0].isFeatured);
        }

        res.status(200).json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        console.error('Error in getProducts:', error);
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
        if (product.status !== 'ACTIVE') {
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
        const categories = await Category.find({ isActive: true }).sort('name');

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

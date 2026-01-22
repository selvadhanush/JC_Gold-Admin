const Category = require('../models/Category');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find();
        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
        }

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new category
// @route   POST /api/v1/categories
// @access  Private (Admin)
exports.createCategory = async (req, res, next) => {
    try {
        // Add image path if file was uploaded (Cloudinary returns full URL)
        if (req.file) {
            console.log('req.file:', JSON.stringify(req.file, null, 2));
            // Cloudinary stores the full URL in req.file.path or req.file.url
            req.body.image = req.file.url || req.file.path;
            console.log('Saving image URL:', req.body.image);
        }

        const category = await Category.create(req.body);
        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res, next) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
        }

        // Add image path if file was uploaded (Cloudinary returns full URL)
        if (req.file) {
            console.log('req.file:', JSON.stringify(req.file, null, 2));
            // Cloudinary stores the full URL in req.file.path or req.file.url
            req.body.image = req.file.url || req.file.path;
            console.log('Saving image URL:', req.body.image);
        }

        category = await Category.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
        }

        await category.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Toggle category status (enable/disable)
// @route   PATCH /api/v1/categories/:id/status
// @access  Private (Admin)
exports.toggleCategoryStatus = async (req, res, next) => {
    try {
        let category = await Category.findById(req.params.id);

        if (!category) {
            return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
        }

        // Toggle the isActive status
        category.isActive = !category.isActive;
        await category.save();

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (err) {
        next(err);
    }
};

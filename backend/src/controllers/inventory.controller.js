const Inventory = require('../models/Inventory');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all inventory items
// @route   GET /api/v1/inventory
// @access  Private (Admin)
exports.getInventory = async (req, res, next) => {
    try {
        const inventory = await Inventory.find().populate('product', 'name sku');
        res.status(200).json({
            success: true,
            count: inventory.length,
            data: inventory,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update inventory quantity
// @route   PUT /api/v1/inventory/:id
// @access  Private (Admin)
exports.updateInventory = async (req, res, next) => {
    try {
        let inventory = await Inventory.findById(req.params.id);

        if (!inventory) {
            return next(new ErrorResponse(`Inventory record not found with id of ${req.params.id}`, 404));
        }

        // Add lastUpdatedBy
        req.body.lastUpdatedBy = req.admin.id;

        inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: inventory,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get inventory for a specific product
// @route   GET /api/v1/inventory/product/:productId
// @access  Private (Admin)
exports.getProductInventory = async (req, res, next) => {
    try {
        const inventory = await Inventory.findOne({ product: req.params.productId }).populate('product', 'name sku');

        if (!inventory) {
            return next(new ErrorResponse(`Inventory record not found for product id ${req.params.productId}`, 404));
        }

        res.status(200).json({
            success: true,
            data: inventory,
        });
    } catch (err) {
        next(err);
    }
};

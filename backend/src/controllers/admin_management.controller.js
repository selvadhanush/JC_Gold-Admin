const Admin = require('../models/Admin');
const Role = require('../models/Role');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all admins
// @route   GET /api/v1/admin-management
// @access  Private (Super Admin)
exports.getAdmins = async (req, res, next) => {
    try {
        const admins = await Admin.find().populate('role');
        res.status(200).json({
            success: true,
            count: admins.length,
            data: admins,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create an admin
// @route   POST /api/v1/admin-management
// @access  Private (Super Admin)
exports.createAdmin = async (req, res, next) => {
    try {
        const { name, email, password, roleName } = req.body;

        // Find role
        const role = await Role.findOne({ name: roleName });
        if (!role) {
            return next(new ErrorResponse('Role not found', 404));
        }

        const admin = await Admin.create({
            name,
            email,
            password,
            role: role._id,
        });

        res.status(201).json({
            success: true,
            data: admin,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update admin
// @route   PUT /api/v1/admin-management/:id
// @access  Private (Super Admin)
exports.updateAdmin = async (req, res, next) => {
    try {
        const { name, email, roleName, isActive } = req.body;
        let updateData = { name, email, isActive };

        if (roleName) {
            const role = await Role.findOne({ name: roleName });
            if (!role) {
                return next(new ErrorResponse('Role not found', 404));
            }
            updateData.role = role._id;
        }

        const admin = await Admin.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!admin) {
            return next(new ErrorResponse('Admin not found', 404));
        }

        res.status(200).json({
            success: true,
            data: admin,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete admin
// @route   DELETE /api/v1/admin-management/:id
// @access  Private (Super Admin)
exports.deleteAdmin = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.params.id);

        if (!admin) {
            return next(new ErrorResponse('Admin not found', 404));
        }

        // Prevent deleting yourself
        if (admin._id.toString() === req.admin.id.toString()) {
            return next(new ErrorResponse('You cannot delete your own account', 400));
        }

        await admin.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all roles
// @route   GET /api/v1/admin-management/roles
// @access  Private (Super Admin)
exports.getRoles = async (req, res, next) => {
    try {
        const roles = await Role.find();
        res.status(200).json({
            success: true,
            data: roles,
        });
    } catch (err) {
        next(err);
    }
};

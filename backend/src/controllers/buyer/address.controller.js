const Address = require('../../models/Address');

// @desc    Get all addresses for buyer
// @route   GET /api/v1/buyer/addresses
// @access  Private (Buyer)
exports.getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.buyer._id }).sort('-isDefault -createdAt');

        res.status(200).json({
            success: true,
            count: addresses.length,
            data: addresses,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Add new address
// @route   POST /api/v1/buyer/addresses
// @access  Private (Buyer)
exports.addAddress = async (req, res) => {
    try {
        const { fullName, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

        const address = await Address.create({
            user: req.buyer._id,
            fullName,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            isDefault: isDefault || false,
        });

        res.status(201).json({
            success: true,
            message: 'Address added successfully',
            data: address,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Update address
// @route   PUT /api/v1/buyer/addresses/:id
// @access  Private (Buyer)
exports.updateAddress = async (req, res) => {
    try {
        let address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // Check ownership
        if (address.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this address',
            });
        }

        address = await Address.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: address,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Delete address
// @route   DELETE /api/v1/buyer/addresses/:id
// @access  Private (Buyer)
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // Check ownership
        if (address.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this address',
            });
        }

        await address.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Set default address
// @route   PATCH /api/v1/buyer/addresses/:id/default
// @access  Private (Buyer)
exports.setDefaultAddress = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // Check ownership
        if (address.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this address',
            });
        }

        // Set this address as default (pre-save hook will unset others)
        address.isDefault = true;
        await address.save();

        res.status(200).json({
            success: true,
            message: 'Default address updated successfully',
            data: address,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

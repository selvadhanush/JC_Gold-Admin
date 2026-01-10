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
        console.error('Error in getAddresses:', error);
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

        console.log('=== ADD ADDRESS ===');
        console.log('User ID:', req.buyer._id);

        // If this is the first address or explicitly set as default, 
        // clear other default addresses manually since we removed the model hook
        if (isDefault) {
            await Address.updateMany(
                { user: req.buyer._id },
                { isDefault: false }
            );
        }

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
        console.error('Error in addAddress:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages[0] || 'Validation Error',
            });
        }

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
        const { isDefault } = req.body;
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

        // Handle default address logic
        if (isDefault && !address.isDefault) {
            await Address.updateMany(
                { user: req.buyer._id },
                { isDefault: false }
            );
        }

        // Update fields
        const fields = ['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode', 'isDefault'];
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                address[field] = req.body[field];
            }
        });

        await address.save();

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: address,
        });
    } catch (error) {
        console.error('Error in updateAddress:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages[0] || 'Validation Error',
            });
        }

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

        if (address.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
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

        if (address.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        // Clear other defaults
        await Address.updateMany(
            { user: req.buyer._id },
            { isDefault: false }
        );

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

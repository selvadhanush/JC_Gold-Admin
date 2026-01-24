const Joi = require('joi');

// Validate MPIN pattern (no sequential or repeating)
const validateMpinPattern = (value, helpers) => {
    const mpin = value.toString();
    
    // Check for sequential patterns
    const sequential = [
        '012345', '123456', '234567', '345678', '456789', '567890',
        '098765', '987654', '876543', '765432', '654321', '543210'
    ];
    
    if (sequential.includes(mpin)) {
        return helpers.error('any.invalid', { message: 'Sequential patterns are not allowed' });
    }
    
    // Check for repeating digits (e.g., 111111, 000000)
    if (/^(\d)\1{5}$/.test(mpin)) {
        return helpers.error('any.invalid', { message: 'Repeating digits are not allowed' });
    }
    
    return value;
};

// Set MPIN Validation
exports.setMpinValidation = Joi.object({
    mpin: Joi.string()
        .pattern(/^\d{6}$/)
        .required()
        .custom(validateMpinPattern)
        .messages({
            'string.pattern.base': 'MPIN must be exactly 6 digits',
            'any.required': 'MPIN is required'
        })
});

// Verify MPIN Validation
exports.verifyMpinValidation = Joi.object({
    mpin: Joi.string()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            'string.pattern.base': 'MPIN must be exactly 6 digits',
            'any.required': 'MPIN is required'
        })
});

// Change MPIN Validation
exports.changeMpinValidation = Joi.object({
    oldMpin: Joi.string()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            'string.pattern.base': 'Old MPIN must be exactly 6 digits',
            'any.required': 'Old MPIN is required'
        }),
    newMpin: Joi.string()
        .pattern(/^\d{6}$/)
        .required()
        .custom(validateMpinPattern)
        .messages({
            'string.pattern.base': 'New MPIN must be exactly 6 digits',
            'any.required': 'New MPIN is required'
        })
});

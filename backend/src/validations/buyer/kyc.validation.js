const Joi = require('joi');

// Validate age is 18+
const validateAge = (value, helpers) => {
    const today = new Date();
    const birthDate = new Date(value);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    if (age < 18) {
        return helpers.error('any.invalid');
    }
    
    return value;
};

// Submit KYC Validation
exports.submitKycValidation = Joi.object({
    personalDetails: Joi.object({
        fullName: Joi.string().trim().min(3).max(100).required()
            .messages({
                'string.min': 'Full name must be at least 3 characters',
                'string.max': 'Full name cannot exceed 100 characters',
                'any.required': 'Full name is required'
            }),
        dob: Joi.date().max('now').required().custom(validateAge)
            .messages({
                'date.max': 'Date of birth cannot be in the future',
                'any.invalid': 'You must be at least 18 years old',
                'any.required': 'Date of birth is required'
            })
    }).required(),
    
    document: Joi.object({
        type: Joi.string().valid('AADHAAR', 'PAN', 'PASSPORT').required()
            .messages({
                'any.only': 'Document type must be AADHAAR, PAN, or PASSPORT',
                'any.required': 'Document type is required'
            }),
        number: Joi.string().trim().required()
            .messages({
                'any.required': 'Document number is required'
            }),
        frontImage: Joi.string().uri().required()
            .messages({
                'string.uri': 'Front image must be a valid URL',
                'any.required': 'Front image is required'
            }),
        backImage: Joi.string().uri().optional()
            .messages({
                'string.uri': 'Back image must be a valid URL'
            })
    }).required(),
    
    address: Joi.object({
        line1: Joi.string().trim().min(5).max(200).required()
            .messages({
                'string.min': 'Address must be at least 5 characters',
                'any.required': 'Address line 1 is required'
            }),
        city: Joi.string().trim().min(2).max(100).required()
            .messages({
                'any.required': 'City is required'
            }),
        state: Joi.string().trim().min(2).max(100).required()
            .messages({
                'any.required': 'State is required'
            }),
        pincode: Joi.string().trim().pattern(/^[0-9]{6}$/).required()
            .messages({
                'string.pattern.base': 'Pincode must be a 6-digit number',
                'any.required': 'Pincode is required'
            }),
        country: Joi.string().trim().default('India')
    }).required()
});

// Resubmit KYC Validation (same as submit)
exports.resubmitKycValidation = exports.submitKycValidation;

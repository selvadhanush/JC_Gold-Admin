const Joi = require('joi');

// Approve KYC Validation
exports.approveKycValidation = Joi.object({
    // No body needed, just ID in params
});

// Reject KYC Validation
exports.rejectKycValidation = Joi.object({
    rejectionReason: Joi.string().trim().min(10).max(500).required()
        .messages({
            'string.min': 'Rejection reason must be at least 10 characters',
            'string.max': 'Rejection reason cannot exceed 500 characters',
            'any.required': 'Rejection reason is required'
        })
});

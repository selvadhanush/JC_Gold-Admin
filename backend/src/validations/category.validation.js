const Joi = require('joi');

// Schema for creating/updating a category
exports.createCategorySchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Category name is required',
        'string.empty': 'Category name cannot be empty'
    }),
    description: Joi.string().allow('', null).optional(),
    isActive: Joi.boolean().optional(),
});

// Schema for updating a category (all fields optional)
exports.updateCategorySchema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().allow('', null).optional(),
    isActive: Joi.boolean().optional(),
});

// Legacy function for backward compatibility
exports.validateCategory = (data) => {
    return exports.createCategorySchema.validate(data);
};

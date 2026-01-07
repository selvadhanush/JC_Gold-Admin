const Joi = require('joi');

exports.validateCategory = (data) => {
    const schema = Joi.object({
        name: Joi.string().required().messages({
            'any.required': 'Category name is required',
            'string.empty': 'Category name cannot be empty'
        }),
        description: Joi.string().allow('', null),
        isActive: Joi.boolean(),
    });

    return schema.validate(data);
};

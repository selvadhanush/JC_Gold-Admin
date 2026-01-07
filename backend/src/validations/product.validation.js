const Joi = require('joi');

exports.validateProduct = (data) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        sku: Joi.string().required(),
        description: Joi.string().required(),
        price: Joi.number().min(0).required(),
        category: Joi.string().required(), // Category ID
        specifications: Joi.object({
            metalType: Joi.string().valid('GOLD', 'SILVER', 'PLATINUM', 'OTHER'),
            purity: Joi.string(),
            weight: Joi.number().min(0),
            size: Joi.string(),
        }),
        status: Joi.string().valid('DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'),
        isFeatured: Joi.boolean(),
        initialStock: Joi.number().min(0),
    });

    return schema.validate(data);
};

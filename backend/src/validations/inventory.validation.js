const Joi = require('joi');

exports.validateInventoryUpdate = (data) => {
    const schema = Joi.object({
        quantity: Joi.number().integer().min(0),
        lowStockThreshold: Joi.number().integer().min(0),
    });

    return schema.validate(data);
};

const Joi = require('joi');

exports.createOrderValidation = (data) => {
    const schema = Joi.object({
        user: Joi.string().required(),
        orderItems: Joi.array().items(
            Joi.object({
                product: Joi.string().required(),
                quantity: Joi.number().integer().min(1).required(),
            })
        ).min(1).required(),
        shippingAddress: Joi.object({
            street: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            zipCode: Joi.string().required(),
            country: Joi.string().required(),
            phoneNumber: Joi.string().required(),
        }).required(),
        paymentMethod: Joi.string().valid('WALLET', 'ONLINE', 'COD').required(),
    });
    return schema.validate(data);
};

exports.updateOrderStatusValidation = (data) => {
    const schema = Joi.object({
        status: Joi.string().valid('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED').required(),
    });
    return schema.validate(data);
};

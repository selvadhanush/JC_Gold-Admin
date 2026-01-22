const Joi = require('joi');

exports.createOrderValidation = Joi.object({
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

exports.updateOrderStatusValidation = Joi.object({
    status: Joi.string().valid('PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED').required(),
});

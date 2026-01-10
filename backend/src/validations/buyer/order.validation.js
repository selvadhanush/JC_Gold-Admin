const Joi = require('joi');

exports.placeOrderSchema = Joi.object({
    addressId: Joi.string().hex().length(24).required(),
    paymentMethod: Joi.string().valid('WALLET', 'ONLINE', 'COD').required(),
});

exports.placeDirectOrderSchema = Joi.object({
    productId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().min(1).required(),
    addressId: Joi.string().hex().length(24).required(),
    paymentMethod: Joi.string().valid('WALLET', 'ONLINE', 'COD').required(),
});

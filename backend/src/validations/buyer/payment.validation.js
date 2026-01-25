const Joi = require('joi');

const createPaymentSchema = Joi.object({
    orderId: Joi.string().required().messages({
        'string.empty': 'Order ID is required',
        'any.required': 'Order ID is required'
    }),
    amount: Joi.number().required().min(1).messages({
        'number.base': 'Amount must be a number',
        'number.min': 'Amount must be at least 1',
        'any.required': 'Amount is required'
    }),
    method: Joi.string().required().valid('UPI', 'CARD', 'NET_BANKING', 'WALLET').messages({
        'string.empty': 'Payment method is required',
        'any.only': 'Invalid payment method',
        'any.required': 'Payment method is required'
    })
});

module.exports = {
    createPaymentSchema
};

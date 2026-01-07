const Joi = require('joi');

exports.validatePaymentStatus = (data) => {
    const schema = Joi.object({
        status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED').required(),
    });

    return schema.validate(data);
};

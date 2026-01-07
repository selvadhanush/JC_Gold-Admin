const Joi = require('joi');

exports.enrollSchemeSchema = Joi.object({
    monthlyInstallment: Joi.number().min(100).required(),
});

exports.payInstallmentSchema = Joi.object({
    amount: Joi.number().min(100).required(),
});

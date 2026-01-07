const Joi = require('joi');

exports.createSchemeValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        durationMonths: Joi.number().integer().min(1).required(),
        minMonthlyAmount: Joi.number().min(0).required(),
        benefitPercentage: Joi.number().min(0),
        isActive: Joi.boolean(),
    });
    return schema.validate(data);
};

exports.enrollSchemeValidation = (data) => {
    const schema = Joi.object({
        user: Joi.string().required(),
        scheme: Joi.string().required(),
        monthlyInstallment: Joi.number().min(0).required(),
    });
    return schema.validate(data);
};

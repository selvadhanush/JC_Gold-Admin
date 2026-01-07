const Joi = require('joi');

exports.updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(100),
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/),
    address: Joi.object({
        street: Joi.string().max(200),
        city: Joi.string().max(100),
        state: Joi.string().max(100),
        zipCode: Joi.string().max(20),
        country: Joi.string().max(100),
    }),
});

exports.changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(100).required(),
});

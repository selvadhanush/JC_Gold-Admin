const Joi = require('joi');

exports.addAddressSchema = Joi.object({
    fullName: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
    addressLine1: Joi.string().min(5).max(200).required(),
    addressLine2: Joi.string().max(200),
    city: Joi.string().min(2).max(100).required(),
    state: Joi.string().min(2).max(100).required(),
    pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),
    isDefault: Joi.boolean(),
});

exports.updateAddressSchema = Joi.object({
    fullName: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    addressLine1: Joi.string().min(5).max(200),
    addressLine2: Joi.string().max(200),
    city: Joi.string().min(2).max(100),
    state: Joi.string().min(2).max(100),
    pincode: Joi.string().pattern(/^[0-9]{6}$/),
    isDefault: Joi.boolean(),
});

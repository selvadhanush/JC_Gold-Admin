const Joi = require('joi');

exports.updateUserStatusValidation = (data) => {
    const schema = Joi.object({
        isActive: Joi.boolean().required(),
    });
    return schema.validate(data);
};

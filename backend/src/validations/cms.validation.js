const Joi = require('joi');

exports.createBannerValidation = (data) => {
    const schema = Joi.object({
        title: Joi.string().required(),
        imageUrl: Joi.string().required(),
        linkUrl: Joi.string().allow('', null),
        type: Joi.string().valid('HOME_MAIN', 'OFFER', 'CATEGORY_AD'),
        isActive: Joi.boolean(),
        order: Joi.number().integer(),
    });
    return schema.validate(data);
};

const Joi = require('joi');

exports.addToWishlistSchema = Joi.object({
    productId: Joi.string().hex().length(24).required(),
});

const Joi = require('joi');

// Admin: Gold Rate Validation
exports.goldRateValidation = Joi.object({
    date: Joi.date().required(),
    metalType: Joi.string().valid('GOLD', 'SILVER').default('GOLD'),
    purity: Joi.string().optional(),
    ratePerGram: Joi.number().positive().required(),
    source: Joi.string().valid('MANUAL', 'API').default('MANUAL'),
});

// Buyer: Buy Gold Validation
exports.buyGoldValidation = Joi.object({
    amount: Joi.number().positive().min(10).required(), // Min purchase 10 INR
    paymentMethod: Joi.string().valid('ONLINE', 'OFFLINE').required(),
    transactionId: Joi.string().when('paymentMethod', {
        is: 'OFFLINE',
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});

// Buyer: Redemption Validation
exports.redeemGoldValidation = Joi.object({
    redeemType: Joi.string().valid('CASH', 'GOLD', 'ACCESSORY').required(),
    goldGrams: Joi.number().positive().min(0.001).required(),
    productId: Joi.string().when('redeemType', {
        is: 'ACCESSORY',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    deliveryAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        phoneNumber: Joi.string().required(),
    }).when('redeemType', {
        is: Joi.valid('GOLD', 'ACCESSORY'),
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});

// Admin: Approval Validation
exports.approveTransactionValidation = Joi.object({
    status: Joi.string().valid('APPROVED', 'REJECTED', 'COMPLETED').required(),
    rejectionReason: Joi.string().when('status', {
        is: 'REJECTED',
        then: Joi.required(),
        otherwise: Joi.optional()
    })
});

// Admin: Adjust Vault Validation
exports.adjustVaultValidation = Joi.object({
    userId: Joi.string().required(),
    type: Joi.string().valid('ADD', 'DEDUCT').required(),
    goldGrams: Joi.number().positive().required(),
    goldRateAtTime: Joi.number().positive().required(),
    notes: Joi.string().optional().allow(''),
});

const ErrorResponse = require('../utils/errorResponse');

const validate = (schema) => (req, res, next) => {
    // Call the validator function if it's a function, otherwise use it directly
    const validationResult = typeof schema === 'function' ? schema(req.body) : schema.validate(req.body);

    // Check if we got a validation result (has error property)
    const { error } = validationResult;

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    }
    next();
};

module.exports = validate;

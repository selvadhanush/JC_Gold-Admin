const rateLimit = require('express-rate-limit');

// Rate limiter for KYC submission
// Limits: 3 submissions per day per IP
const kycSubmissionLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3, // Limit each IP to 3 requests per windowMs
    message: {
        success: false,
        message: 'Too many KYC submission attempts. Please try again after 24 hours.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Skip rate limiting for resubmissions (different endpoint)
        return req.path.includes('/resubmit');
    }
});

// Rate limiter for KYC status checks
// More lenient - 30 requests per hour
const kycStatusLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    message: {
        success: false,
        message: 'Too many status check requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    kycSubmissionLimiter,
    kycStatusLimiter
};

const Scheme = require('../../models/Scheme');
const UserScheme = require('../../models/UserScheme');
const Installment = require('../../models/Installment');
const Payment = require('../../models/Payment');

// @desc    Get all available schemes
// @route   GET /api/v1/buyer/schemes
// @access  Public
exports.getSchemes = async (req, res) => {
    try {
        const schemes = await Scheme.find({ isActive: true }).sort('name');

        res.status(200).json({
            success: true,
            count: schemes.length,
            data: schemes,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Get scheme details
// @route   GET /api/v1/buyer/schemes/:id
// @access  Public
exports.getSchemeById = async (req, res) => {
    try {
        const scheme = await Scheme.findById(req.params.id);

        if (!scheme || !scheme.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Scheme not found',
            });
        }

        res.status(200).json({
            success: true,
            data: scheme,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Enroll in a scheme
// @route   POST /api/v1/buyer/schemes/:id/enroll
// @access  Private (Buyer)
exports.enrollInScheme = async (req, res) => {
    try {
        const { monthlyInstallment } = req.body;
        const schemeId = req.params.id;

        const scheme = await Scheme.findById(schemeId);
        if (!scheme || !scheme.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Scheme not found or not active',
            });
        }

        // Validate monthly installment
        if (monthlyInstallment < scheme.minMonthlyAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum monthly installment is ₹${scheme.minMonthlyAmount}`,
            });
        }

        // Check if already enrolled
        const existing = await UserScheme.findOne({
            user: req.buyer._id,
            scheme: schemeId,
            status: 'ACTIVE',
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this scheme',
            });
        }

        // Calculate maturity date
        const startDate = new Date();
        const maturityDate = new Date(startDate);
        maturityDate.setMonth(maturityDate.getMonth() + scheme.durationMonths);

        // Create user scheme enrollment
        const userScheme = await UserScheme.create({
            user: req.buyer._id,
            scheme: schemeId,
            startDate,
            maturityDate,
            monthlyInstallment,
            totalInstallments: scheme.durationMonths,
            status: 'ACTIVE',
        });

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in scheme',
            data: userScheme,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Get buyer's enrolled schemes
// @route   GET /api/v1/buyer/my-schemes
// @access  Private (Buyer)
exports.getMySchemes = async (req, res) => {
    try {
        const userSchemes = await UserScheme.find({ user: req.buyer._id })
            .populate('scheme')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: userSchemes.length,
            data: userSchemes,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Pay installment
// @route   POST /api/v1/buyer/my-schemes/:id/installment
// @access  Private (Buyer)
exports.payInstallment = async (req, res) => {
    try {
        const { amount, paymentMethod } = req.body;
        const userSchemeId = req.params.id;

        if (paymentMethod !== 'ONLINE') {
            return res.status(400).json({ success: false, message: 'Scheme installments can only be paid ONLINE.' });
        }

        const userScheme = await UserScheme.findById(userSchemeId).populate('scheme');

        if (!userScheme) {
            return res.status(404).json({
                success: false,
                message: 'Scheme enrollment not found',
            });
        }

        // Verify ownership
        if (userScheme.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        if (userScheme.status !== 'ACTIVE') {
            return res.status(400).json({
                success: false,
                message: 'Scheme is not active',
            });
        }

        // Create payment
        const transactionId = 'INST' + Date.now() + Math.random().toString(36).substr(2, 9);
        const payment = await Payment.create({
            user: req.buyer._id,
            scheme: userScheme.scheme._id,
            amount,
            paymentMethod: 'ONLINE',
            transactionId,
            status: 'COMPLETED',
            paymentType: 'SCHEME_INSTALMENT',
        });

        // Create installment record
        const installment = await Installment.create({
            userScheme: userSchemeId,
            user: req.buyer._id,
            amount,
            dueDate: new Date(),
            paymentDate: new Date(),
            payment: payment._id,
            status: 'PAID',
        });

        // Update user scheme
        userScheme.paidInstallments += 1;
        userScheme.totalAmountPaid += amount;

        // Calculate benefits
        const benefitAmount = (amount * userScheme.scheme.benefitPercentage) / 100;
        userScheme.benefitsEarned += benefitAmount;

        // Check if completed
        if (userScheme.paidInstallments >= userScheme.totalInstallments) {
            userScheme.status = 'COMPLETED';
        }

        await userScheme.save();

        res.status(200).json({
            success: true,
            message: 'Installment paid successfully',
            data: {
                installment,
                userScheme,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

// @desc    Get scheme status and details
// @route   GET /api/v1/buyer/my-schemes/:id/status
// @access  Private (Buyer)
exports.getSchemeStatus = async (req, res) => {
    try {
        const userScheme = await UserScheme.findById(req.params.id)
            .populate('scheme');

        if (!userScheme) {
            return res.status(404).json({
                success: false,
                message: 'Scheme enrollment not found',
            });
        }

        // Verify ownership
        if (userScheme.user.toString() !== req.buyer._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        // Get installment history
        const installments = await Installment.find({ userScheme: userScheme._id })
            .populate('payment')
            .sort('dueDate');

        const remainingInstallments = userScheme.totalInstallments - userScheme.paidInstallments;
        const remainingAmount = remainingInstallments * userScheme.monthlyInstallment;

        res.status(200).json({
            success: true,
            data: {
                userScheme,
                installments,
                summary: {
                    totalInstallments: userScheme.totalInstallments,
                    paidInstallments: userScheme.paidInstallments,
                    remainingInstallments,
                    totalAmountPaid: userScheme.totalAmountPaid,
                    remainingAmount,
                    benefitsEarned: userScheme.benefitsEarned,
                    maturityDate: userScheme.maturityDate,
                    status: userScheme.status,
                },
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
};

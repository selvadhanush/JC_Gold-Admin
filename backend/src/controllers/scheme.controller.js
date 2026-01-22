const Scheme = require('../models/Scheme');
const UserScheme = require('../models/UserScheme');
const Installment = require('../models/Installment');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all schemes
// @route   GET /api/v1/schemes
// @access  Public
exports.getSchemes = async (req, res, next) => {
    try {
        const schemes = await Scheme.find();
        res.status(200).json({
            success: true,
            data: schemes,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create scheme
// @route   POST /api/v1/schemes
// @access  Private (SUPER_ADMIN, FINANCE_ADMIN)
exports.createScheme = async (req, res, next) => {
    try {
        const scheme = await Scheme.create(req.body);
        res.status(201).json({
            success: true,
            data: scheme,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update scheme
// @route   PUT /api/v1/schemes/:id
// @access  Private (SUPER_ADMIN, FINANCE_ADMIN)
exports.updateScheme = async (req, res, next) => {
    try {
        const scheme = await Scheme.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!scheme) {
            return next(new ErrorResponse('Scheme not found', 404));
        }

        res.status(200).json({
            success: true,
            data: scheme,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete scheme
// @route   DELETE /api/v1/schemes/:id
// @access  Private (SUPER_ADMIN, FINANCE_ADMIN)
exports.deleteScheme = async (req, res, next) => {
    try {
        const scheme = await Scheme.findById(req.params.id);

        if (!scheme) {
            return next(new ErrorResponse('Scheme not found', 404));
        }

        // Check if scheme has any enrollments
        const enrollmentCount = await UserScheme.countDocuments({ scheme: req.params.id });
        if (enrollmentCount > 0) {
            return next(new ErrorResponse('Cannot delete scheme with active enrollments', 400));
        }

        await scheme.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Enroll user in scheme
// @route   POST /api/v1/schemes/enroll
// @access  Private (Admin)
exports.enrollUser = async (req, res, next) => {
    try {
        const { user, scheme, monthlyInstallment } = req.body;

        const schemeData = await Scheme.findById(scheme);
        if (!schemeData || !schemeData.isActive) {
            return next(new ErrorResponse('Scheme not found or inactive', 404));
        }

        const userData = await User.findById(user);
        if (!userData) {
            return next(new ErrorResponse('User not found', 404));
        }

        const maturityDate = new Date();
        maturityDate.setMonth(maturityDate.getMonth() + schemeData.durationMonths);

        const enrollment = await UserScheme.create({
            user,
            scheme,
            monthlyInstallment,
            totalInstallments: schemeData.durationMonths,
            maturityDate,
        });

        // Create first pending installment
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await Installment.create({
            userScheme: enrollment._id,
            user,
            amount: monthlyInstallment,
            dueDate: nextMonth,
        });

        res.status(201).json({
            success: true,
            data: enrollment,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Record installment payment
// @route   PATCH /api/v1/schemes/installments/:id/pay
// @access  Private (Admin, FINANCE_ADMIN)
exports.payInstallment = async (req, res, next) => {
    try {
        const installment = await Installment.findById(req.params.id);
        if (!installment) {
            return next(new ErrorResponse('Installment not found', 404));
        }

        if (installment.status === 'PAID') {
            return next(new ErrorResponse('Installment already paid', 400));
        }

        installment.status = 'PAID';
        installment.paymentDate = Date.now();
        await installment.save();

        const userScheme = await UserScheme.findById(installment.userScheme);
        userScheme.paidInstallments += 1;
        userScheme.totalAmountPaid += installment.amount;

        if (userScheme.paidInstallments === userScheme.totalInstallments) {
            userScheme.status = 'COMPLETED';
        } else {
            // Create next installment
            const nextMonth = new Date(installment.dueDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);

            await Installment.create({
                userScheme: userScheme._id,
                user: userScheme.user,
                amount: userScheme.monthlyInstallment,
                dueDate: nextMonth,
            });
        }

        await userScheme.save();

        res.status(200).json({
            success: true,
            data: installment,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get enrollment details
// @route   GET /api/v1/schemes/enrollments/:id
// @access  Private (Admin)
exports.getEnrollment = async (req, res, next) => {
    try {
        const enrollment = await UserScheme.findById(req.params.id).populate('scheme user');
        const installments = await Installment.find({ userScheme: req.params.id }).sort('dueDate');

        res.status(200).json({
            success: true,
            data: {
                enrollment,
                installments,
            },
        });
    } catch (err) {
        next(err);
    }
};
// @desc    Get all enrollments
// @route   GET /api/v1/schemes/enrollments
// @access  Private (Admin, FINANCE_ADMIN)
exports.getEnrollments = async (req, res, next) => {
    try {
        const enrollments = await UserScheme.find()
            .populate('user', 'name email')
            .populate('scheme', 'name durationMonths');

        res.status(200).json({
            success: true,
            count: enrollments.length,
            data: enrollments,
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all installments
// @route   GET /api/v1/schemes/installments
// @access  Private (Admin, FINANCE_ADMIN)
exports.getInstallments = async (req, res, next) => {
    try {
        const installments = await Installment.find()
            .populate({
                path: 'userScheme',
                populate: { path: 'scheme', select: 'name' }
            })
            .populate('user', 'name email');

        res.status(200).json({
            success: true,
            count: installments.length,
            data: installments,
        });
    } catch (err) {
        next(err);
    }
};

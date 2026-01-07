const express = require('express');
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/category.controller');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateCategory } = require('../validations/category.validation');

const router = express.Router();

router
    .route('/')
    .get(getCategories)
    .post(protect, authorize('SUPER_ADMIN', 'PRODUCT_ADMIN'), validate(validateCategory), createCategory);

router
    .route('/:id')
    .get(getCategory)
    .put(protect, authorize('SUPER_ADMIN', 'PRODUCT_ADMIN'), validate(validateCategory), updateCategory)
    .delete(protect, authorize('SUPER_ADMIN', 'PRODUCT_ADMIN'), deleteCategory);

module.exports = router;

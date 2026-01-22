const express = require('express');
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
} = require('../controllers/category.controller');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../utils/fileUpload');

const router = express.Router();

router
    .route('/')
    .get(getCategories)
    .post(protect, authorize('SUPER_ADMIN', 'PRODUCT_ADMIN'), upload.single('image'), createCategory);

router
    .route('/:id/status')
    .patch(protect, authorize('SUPER_ADMIN', 'PRODUCT_ADMIN'), toggleCategoryStatus);

router
    .route('/:id')
    .get(getCategory)
    .put(protect, authorize('SUPER_ADMIN', 'PRODUCT_ADMIN'), upload.single('image'), updateCategory)
    .delete(protect, authorize('SUPER_ADMIN', 'PRODUCT_ADMIN'), deleteCategory);

module.exports = router;

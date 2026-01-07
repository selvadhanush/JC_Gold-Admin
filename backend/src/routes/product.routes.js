const express = require('express');
const {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    updateProductStatus,
    updateProductStock,
    deleteProduct
} = require('../controllers/product.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateProduct } = require('../validations/product.validation');
const upload = require('../utils/fileUpload');

const { logAction } = require('../middlewares/audit.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getProducts)
    .post(authorize('PRODUCT_ADMIN'), upload.array('images', 5), validate(validateProduct), logAction('CREATE_PRODUCT', 'PRODUCT'), createProduct);

router.route('/:id')
    .get(getProduct)
    .put(authorize('PRODUCT_ADMIN'), upload.array('images', 5), validate(validateProduct), logAction('UPDATE_PRODUCT', 'PRODUCT'), updateProduct)
    .delete(authorize('PRODUCT_ADMIN'), logAction('DELETE_PRODUCT', 'PRODUCT'), deleteProduct);

router.patch('/:id/status', authorize('PRODUCT_ADMIN'), logAction('UPDATE_PRODUCT_STATUS', 'PRODUCT'), updateProductStatus);
router.patch('/:id/stock', authorize('PRODUCT_ADMIN'), logAction('UPDATE_PRODUCT_STOCK', 'PRODUCT'), updateProductStock);

module.exports = router;

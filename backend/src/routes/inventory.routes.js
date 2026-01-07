const express = require('express');
const {
    getInventory,
    updateInventory,
    getProductInventory,
} = require('../controllers/inventory.controller');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { validateInventoryUpdate } = require('../validations/inventory.validation');

const router = express.Router();

router.use(protect);
router.use(authorize('SUPER_ADMIN', 'PRODUCT_ADMIN'));

router.route('/').get(getInventory);
router.route('/:id').put(validate(validateInventoryUpdate), updateInventory);
router.route('/product/:productId').get(getProductInventory);

module.exports = router;

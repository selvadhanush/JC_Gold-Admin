const express = require('express');
const {
    getOrders,
    getOrder,
    updateOrderStatus,
    cancelOrder,
    generateInvoice,
} = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateOrderStatusValidation } = require('../validations/order.validation');

const { logAction } = require('../middlewares/audit.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getOrders);

router.route('/:id')
    .get(getOrder);

router.patch('/:id/status', authorize('ORDER_ADMIN'), validate(updateOrderStatusValidation), logAction('UPDATE_ORDER_STATUS', 'ORDER'), updateOrderStatus);
router.patch('/:id/cancel', authorize('ORDER_ADMIN'), logAction('CANCEL_ORDER', 'ORDER'), cancelOrder);
router.get('/:id/invoice', generateInvoice);

module.exports = router;

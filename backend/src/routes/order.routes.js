const express = require('express');
const {
    getOrders,
    getOrder,
    updateOrderStatus,
    bulkUpdateStatus,
    cancelOrder,
    generateInvoice,
    financeConfirmOrder,
    requestPriority,
} = require('../controllers/order.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateOrderStatusValidation } = require('../validations/order.validation');

const { logAction } = require('../middlewares/audit.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(authorize('ORDER_ADMIN', 'PRODUCT_ADMIN', 'FINANCE_ADMIN'), getOrders);

router.patch('/bulk-status', authorize('ORDER_ADMIN'), bulkUpdateStatus);

router.route('/:id')
    .get(authorize('ORDER_ADMIN'), getOrder);

router.patch('/:id/status', authorize('ORDER_ADMIN'), validate(updateOrderStatusValidation), logAction('UPDATE_ORDER_STATUS', 'ORDER'), updateOrderStatus);
router.patch('/:id/cancel', authorize('ORDER_ADMIN'), logAction('CANCEL_ORDER', 'ORDER'), cancelOrder);
router.get('/:id/invoice', authorize('ORDER_ADMIN'), generateInvoice);

// Finance gatekeeping routes
router.patch('/:id/finance-confirm', authorize('FINANCE_ADMIN', 'SUPER_ADMIN'), logAction('FINANCE_CONFIRM_ORDER', 'ORDER'), financeConfirmOrder);
router.patch('/:id/priority', authorize('ORDER_ADMIN', 'SUPER_ADMIN'), logAction('REQUEST_ORDER_PRIORITY', 'ORDER'), requestPriority);

module.exports = router;

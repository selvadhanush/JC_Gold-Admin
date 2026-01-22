const express = require('express');
const { getStats, exportSalesCSV } = require('../controllers/dashboard.controller');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

router.get('/stats', authorize('FINANCE_ADMIN', 'SUPER_ADMIN', 'ORDER_ADMIN', 'PRODUCT_ADMIN'), getStats);
router.get('/export/sales', authorize('FINANCE_ADMIN', 'SUPER_ADMIN'), exportSalesCSV);

module.exports = router;

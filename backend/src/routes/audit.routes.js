const express = require('express');
const { getAuditLogs } = require('../controllers/audit.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.get('/', getAuditLogs);

module.exports = router;

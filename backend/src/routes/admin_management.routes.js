const express = require('express');
const {
    getAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    getRoles
} = require('../controllers/admin_management.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('SUPER_ADMIN'));

router.route('/')
    .get(getAdmins)
    .post(createAdmin);

router.route('/roles')
    .get(getRoles);

router.route('/:id')
    .put(updateAdmin)
    .delete(deleteAdmin);

module.exports = router;

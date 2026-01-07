const express = require('express');
const {
    getUsers,
    getUser,
    updateUserStatus,
    getUserOrderHistory,
    getUserSchemeParticipation,
} = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { updateUserStatusValidation } = require('../validations/user.validation');

const { logAction } = require('../middlewares/audit.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getUsers);

router.route('/:id')
    .get(getUser);

router.patch('/:id/status', authorize('SUPER_ADMIN'), validate(updateUserStatusValidation), logAction('UPDATE_USER_STATUS', 'USER'), updateUserStatus);
router.get('/:id/orders', getUserOrderHistory);
router.get('/:id/schemes', getUserSchemeParticipation);

module.exports = router;

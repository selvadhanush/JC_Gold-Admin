const express = require('express');
const {
    getBanners,
    createBanner,
    getContent,
    upsertContent,
    triggerNotification,
} = require('../controllers/cms.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const { createBannerValidation } = require('../validations/cms.validation');

const router = express.Router();

// Public routes
router.get('/banners', getBanners);
router.get('/content/:type', getContent);

// Admin routes
router.use(protect);

router.post('/banners', authorize('SUPER_ADMIN'), validate(createBannerValidation), createBanner);
router.post('/content', authorize('SUPER_ADMIN'), upsertContent);
router.post('/notify', authorize('SUPER_ADMIN'), triggerNotification);

module.exports = router;

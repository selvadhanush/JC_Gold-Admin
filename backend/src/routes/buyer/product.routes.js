const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getCategories } = require('../../controllers/buyer/product.controller');

// Public routes - no authentication required for browsing
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

module.exports = router;

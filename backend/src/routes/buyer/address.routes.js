const express = require('express');
const router = express.Router();
const {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} = require('../../controllers/buyer/address.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { addAddressSchema, updateAddressSchema } = require('../../validations/buyer/address.validation');

// All routes are protected
router.get('/', protectBuyer, getAddresses);
router.post('/', protectBuyer, validate(addAddressSchema), addAddress);
router.put('/:id', protectBuyer, validate(updateAddressSchema), updateAddress);
router.delete('/:id', protectBuyer, deleteAddress);
router.patch('/:id/default', protectBuyer, setDefaultAddress);

module.exports = router;

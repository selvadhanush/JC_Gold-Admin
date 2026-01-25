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
const { requireMpinVerified } = require('../../middlewares/requireMpinVerified.middleware');
const validate = require('../../middlewares/validate.middleware');
const { addAddressSchema, updateAddressSchema } = require('../../validations/buyer/address.validation');

// All routes require buyer authentication and MPIN verification
router.use(protectBuyer);
router.use(requireMpinVerified);

router.get('/', getAddresses);
router.post('/', validate(addAddressSchema), addAddress);
router.put('/:id', validate(updateAddressSchema), updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

module.exports = router;

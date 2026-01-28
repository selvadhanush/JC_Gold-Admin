const express = require('express');
const router = express.Router();
const { getBankAccount, saveBankAccount } = require('../../controllers/buyer/bankAccount.controller');
const { protectBuyer } = require('../../middlewares/buyerAuth.middleware');
const { uploadKycDocument } = require('../../utils/kycUpload');

router.use(protectBuyer);

router.get('/', getBankAccount);
router.post('/', uploadKycDocument.single('passbookImage'), saveBankAccount);

module.exports = router;

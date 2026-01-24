const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cloudinary storage configuration for KYC documents
const kycStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'jc_gold/kyc-documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto',
        // No transformation - keep original quality for legal documents
    },
});

// Init upload with file size limit
const uploadKycDocument = multer({
    storage: kycStorage,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 2 // Max 2 files (front and back)
    },
    fileFilter: (req, file, cb) => {
        // Validate MIME types
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
        }
    }
});

module.exports = { uploadKycDocument };

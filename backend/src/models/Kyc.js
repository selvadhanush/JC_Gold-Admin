const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'],
        default: 'NOT_SUBMITTED'
    },
    personalDetails: {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true
        },
        dob: {
            type: Date,
            required: [true, 'Date of birth is required']
        }
    },
    document: {
        type: {
            type: String,
            enum: ['AADHAAR', 'PAN', 'PASSPORT'],
            required: [true, 'Document type is required']
        },
        number: {
            type: String,
            required: [true, 'Document number is required'],
            trim: true
        },
        frontImage: {
            type: String,
            required: [true, 'Front image is required']
        },
        backImage: {
            type: String
        }
    },
    address: {
        line1: {
            type: String,
            required: [true, 'Address line 1 is required'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true
        },
        pincode: {
            type: String,
            required: [true, 'Pincode is required'],
            trim: true
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            default: 'India',
            trim: true
        }
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    verifiedAt: {
        type: Date
    }
}, { timestamps: true });

// Index for faster queries
kycSchema.index({ status: 1, createdAt: -1 });
kycSchema.index({ userId: 1 });

// Method to mask document number for display
kycSchema.methods.getMaskedDocumentNumber = function() {
    const number = this.document.number;
    if (!number || number.length < 4) return 'XXXX';
    
    const lastFour = number.slice(-4);
    const masked = 'X'.repeat(number.length - 4) + lastFour;
    
    // Format based on document type
    if (this.document.type === 'AADHAAR' && number.length === 12) {
        return `${masked.slice(0, 4)}-${masked.slice(4, 8)}-${masked.slice(8)}`;
    } else if (this.document.type === 'PAN' && number.length === 10) {
        return `${masked.slice(0, 5)}-${masked.slice(5)}`;
    }
    
    return masked;
};

module.exports = mongoose.model('Kyc', kycSchema);

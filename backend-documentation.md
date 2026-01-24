# JC Gold - Complete Backend Documentation

> **Version:** 2.0  
> **Last Updated:** January 2026  
> **Status:** Production-Ready ✅

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication & Security](#authentication--security)
3. [Digital Gold System (LOT-BASED)](#digital-gold-system-lot-based)
4. [MPIN Security](#mpin-security)
5. [KYC Verification](#kyc-verification)
6. [Order Management](#order-management)
7. [API Reference](#api-reference)
8. [Database Models](#database-models)
9. [Frontend Integration](#frontend-integration)
10. [Deployment Guide](#deployment-guide)

---

## 🏗️ Architecture Overview

### Technology Stack
- **Framework:** Express.js (Node.js)
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** MPIN (6-digit PIN), KYC Verification, RBAC
- **File Storage:** Cloudinary
- **Rate Limiting:** express-rate-limit

### Directory Structure
```
backend/
├── src/
│   ├── models/          # Mongoose schemas
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints
│   ├── middlewares/     # Auth, validation, error handling
│   ├── utils/           # Helper functions
│   └── server.js        # Entry point
├── migrate-to-lot-based.js  # Migration script
└── .env                 # Environment variables
```

### Key Features
✅ **LOT-BASED Digital Gold** - Professional standard (AuraGold/SafeGold)  
✅ **MPIN Security** - Banking-level 6-digit PIN  
✅ **KYC Verification** - Regulatory compliance  
✅ **RBAC** - Role-based access control  
✅ **Audit Trails** - Complete transaction tracking  
✅ **Rate Limiting** - Abuse prevention  

---

## 🔐 Authentication & Security

### Security Layers

```
┌─────────────────────────────────────────┐
│  Layer 4: KYC Verification              │  ← Identity verification
├─────────────────────────────────────────┤
│  Layer 3: MPIN (6-digit PIN)            │  ← 30-min sessions
├─────────────────────────────────────────┤
│  Layer 2: JWT Authentication            │  ← Basic user verification
├─────────────────────────────────────────┤
│  Layer 1: RBAC (Admin only)             │  ← Role-based access
└─────────────────────────────────────────┘
```

### Authentication Flow

```
User Login (Email + Password)
        ↓
   Basic JWT Issued
        ↓
   Check MPIN Status
        ↓
┌──────────────────┬──────────────────┐
│ MPIN Not Set     │ MPIN Set         │
└────────┬─────────┴────────┬─────────┘
         ↓                  ↓
    Set MPIN Screen    Verify MPIN
         ↓                  ↓
         └────────┬─────────┘
                  ↓
      MPIN-Verified JWT (30 min)
                  ↓
         Access Granted to App
```

### Admin Authentication

**Endpoint:** `POST /api/v1/auth/login`

**Roles:**
- `SUPER_ADMIN` - Full access
- `FINANCE_ADMIN` - Gold, KYC, payments
- `PRODUCT_ADMIN` - Products, inventory
- `ORDER_ADMIN` - Orders, redemptions

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "admin": {
    "id": "...",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": {
      "name": "SUPER_ADMIN",
      "permissions": [...]
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Buyer Authentication

**Endpoint:** `POST /api/v1/buyer/auth/login`

**Request:**
```json
{
  "email": "buyer@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "buyer@example.com",
      "phoneNumber": "9876543210"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "mpinRequired": true,    // ⚠️ Check this
    "mpinSet": false         // true = verify, false = set
  }
}
```

---

## 💰 Digital Gold System (LOT-BASED)

### Architecture: LOT-BASED vs POOL-BASED

**Why LOT-BASED?**
- ✅ Matches professional standards (AuraGold, SafeGold, MMTC)
- ✅ Complete audit trail
- ✅ FIFO redemption (oldest first)
- ✅ Per-lot profit tracking
- ✅ Regulatory compliance

**How It Works:**

```
Purchase 1: 1g @ ₹6,800 (Jan 10)  →  Lot 1: 1g remaining
Purchase 2: 2g @ ₹7,000 (Jan 15)  →  Lot 2: 2g remaining
Purchase 3: 0.5g @ ₹7,200 (Jan 20) →  Lot 3: 0.5g remaining

Total: 3.5g (calculated from lots)

Redeem 2g (FIFO):
→ Take 1g from Lot 1 (oldest) → Lot 1 CLOSED
→ Take 1g from Lot 2          → Lot 2 has 1g left

Final State:
Lot 1: CLOSED (0g)
Lot 2: ACTIVE (1g)
Lot 3: ACTIVE (0.5g)
```

### API Endpoints

#### 1. Get Wallet Balance

**Endpoint:** `GET /api/v1/buyer/digital-gold/wallet`  
**Auth:** Bearer <mpin_verified_jwt>  
**MPIN Required:** ✅ Yes

**Response:**
```json
{
  "success": true,
  "data": {
    "totalGoldGrams": 3.5,
    "currentValue": 25200,
    "totalInvested": 24100,
    "totalProfit": 1100,
    "profitPercentage": 4.56,
    "currentGoldRate": 7200,
    "activeLots": [
      {
        "id": "lot_id_1",
        "purchaseDate": "2026-01-10T00:00:00.000Z",
        "goldGrams": 1,
        "remainingGrams": 1,
        "pricePerGram": 6800,
        "currentValue": 7200,
        "profit": 400,
        "profitPercentage": 5.88
      }
    ]
  }
}
```

#### 2. Buy Gold

**Endpoint:** `POST /api/v1/buyer/digital-gold/buy`  
**Auth:** Bearer <mpin_verified_jwt>  
**MPIN Required:** ✅ Yes

**Request:**
```json
{
  "amount": 7000,
  "paymentMethod": "ONLINE",
  "transactionId": "TXN123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gold purchase request submitted. Waiting for admin approval.",
  "data": {
    "transactionId": "DG-20260124-1234",
    "goldGrams": 1,
    "goldRateAtTime": 7000,
    "status": "PENDING"
  }
}
```

#### 3. Redeem Gold (FIFO)

**Endpoint:** `POST /api/v1/buyer/digital-gold/redeem`  
**Auth:** Bearer <mpin_verified_jwt>  
**MPIN Required:** ✅ Yes  
**KYC Required:** ✅ Yes

**Request:**
```json
{
  "goldGrams": 2,
  "redeemType": "CASH",  // or "GOLD", "ACCESSORY"
  "deliveryAddress": "address_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Redemption request submitted.",
  "data": {
    "redemption": {
      "id": "...",
      "goldGrams": 2,
      "equivalentAmount": 14400,
      "status": "REQUESTED"
    },
    "lotsUsed": 2,
    "totalProfit": 600
  }
}
```

#### 4. Get All Lots

**Endpoint:** `GET /api/v1/buyer/digital-gold/lots?status=ACTIVE`  
**Auth:** Bearer <mpin_verified_jwt>

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "...",
      "purchaseDate": "2026-01-10",
      "goldGrams": 1,
      "remainingGrams": 1,
      "pricePerGram": 6800,
      "status": "ACTIVE",
      "currentValue": 7200,
      "profit": 400
    }
  ]
}
```

#### 5. Get Redemption Breakdown

**Endpoint:** `GET /api/v1/buyer/digital-gold/redemptions/:id/lots`  
**Auth:** Bearer <mpin_verified_jwt>

**Response:**
```json
{
  "success": true,
  "data": {
    "redemptionId": "...",
    "totalGrams": 2,
    "totalProfit": 600,
    "lotsUsed": [
      {
        "lotId": "...",
        "purchaseDate": "2026-01-10",
        "gramsUsed": 1,
        "purchasePrice": 6800,
        "redemptionPrice": 7200,
        "profit": 400,
        "profitPercentage": 5.88
      }
    ]
  }
}
```

### Admin Endpoints

#### Approve Purchase (Creates Lot)

**Endpoint:** `PATCH /api/v1/admin/digital-gold/approve/:transactionId`  
**Auth:** Bearer <admin_jwt>  
**Roles:** SUPER_ADMIN, FINANCE_ADMIN

**Request:**
```json
{
  "status": "APPROVED"
}
```

**What Happens:**
1. ✅ Creates GoldLot with purchase details
2. ✅ Links lot to transaction
3. ✅ Updates user wallet balance
4. ✅ Notifies buyer

---

## 🔐 MPIN Security

### Overview

**MPIN (Mobile PIN)** is a 6-digit PIN required for all buyer operations after login.

**Security Features:**
- ✅ 6 digits, numeric only
- ✅ No sequential patterns (123456, 654321)
- ✅ No repeating digits (111111, 000000)
- ✅ Bcrypt hashing (salt 10)
- ✅ 3 failed attempts → 15-minute lock
- ✅ Rate limiting: 5 attempts per 15 minutes
- ✅ Token expires in 30 minutes

### API Endpoints

#### 1. Set MPIN (First Time)

**Endpoint:** `POST /api/v1/buyer/mpin/set`  
**Auth:** Bearer <basic_jwt>

**Request:**
```json
{
  "mpin": "123789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MPIN set successfully. Please verify to continue."
}
```

**Validation Rules:**
- ❌ `123456` - Sequential
- ❌ `654321` - Reverse sequential
- ❌ `111111` - Repeating
- ✅ `123789` - Valid

#### 2. Verify MPIN

**Endpoint:** `POST /api/v1/buyer/mpin/verify`  
**Auth:** Bearer <basic_jwt>  
**Rate Limit:** 5 attempts per 15 minutes

**Request:**
```json
{
  "mpin": "123789"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "MPIN verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 1800  // 30 minutes
}
```

**⚠️ IMPORTANT:** Replace old token with this new MPIN-verified token!

**Failed Response:**
```json
{
  "success": false,
  "message": "Invalid MPIN. Please try again."
}
```

**Locked Response:**
```json
{
  "success": false,
  "message": "MPIN is locked due to multiple failed attempts. Please try again after 15 minutes.",
  "locked": true,
  "lockedUntil": "2026-01-24T12:15:00.000Z"
}
```

#### 3. Change MPIN

**Endpoint:** `PUT /api/v1/buyer/mpin/change`  
**Auth:** Bearer <basic_jwt>

**Request:**
```json
{
  "oldMpin": "123789",
  "newMpin": "987654"
}
```

**Response:**
```json
{
  "success": true,
  "message": "MPIN changed successfully. Please verify again to continue.",
  "requireReVerification": true
}
```

#### 4. Get MPIN Status

**Endpoint:** `GET /api/v1/buyer/mpin/status`  
**Auth:** Bearer <basic_jwt>

**Response:**
```json
{
  "success": true,
  "data": {
    "isSet": true,
    "locked": false,
    "lockedUntil": null
  }
}
```

### MPIN Enforcement

**All buyer routes require MPIN verification:**
- ✅ Digital Gold (buy, redeem, wallet)
- ✅ Orders (list, create)
- ✅ Cart (add, view, update, remove)
- ✅ Profile (view, update)
- ✅ Wishlist, Schemes, Payments, Addresses

**Exceptions (No MPIN required):**
- `/api/v1/buyer/auth/login`
- `/api/v1/buyer/auth/register`
- `/api/v1/buyer/mpin/*` (MPIN management)

---

## 🆔 KYC Verification

### Overview

**KYC (Know Your Customer)** verification is required for:
- ⚠️ Gold redemption
- ⚠️ Direct orders (physical gold)

**Status Lifecycle:**
```
NOT_SUBMITTED → PENDING → APPROVED/REJECTED
```

### Buyer Endpoints

#### 1. Submit KYC

**Endpoint:** `POST /api/v1/buyer/kyc/submit`  
**Auth:** Bearer <mpin_verified_jwt>  
**Rate Limit:** 3 submissions per day

**Request:**
```json
{
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-01",
  "documentType": "AADHAAR",
  "documentNumber": "123456789012",
  "documentImage": "https://cloudinary.com/...",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

**Document Types:**
- `AADHAAR` - 12 digits
- `PAN` - 10 characters
- `PASSPORT` - 8-10 characters
- `VOTER_ID` - 10 characters

**Response:**
```json
{
  "success": true,
  "message": "KYC submitted successfully",
  "data": {
    "status": "PENDING",
    "submittedAt": "2026-01-24T12:00:00.000Z"
  }
}
```

#### 2. Get KYC Status

**Endpoint:** `GET /api/v1/buyer/kyc/status`  
**Auth:** Bearer <mpin_verified_jwt>  
**Rate Limit:** 30 requests per hour

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "APPROVED",
    "fullName": "John Doe",
    "documentType": "AADHAAR",
    "documentNumber": "********9012",  // Masked
    "submittedAt": "2026-01-20",
    "approvedAt": "2026-01-21"
  }
}
```

#### 3. Resubmit KYC (If Rejected)

**Endpoint:** `PUT /api/v1/buyer/kyc/resubmit`  
**Auth:** Bearer <mpin_verified_jwt>

**Request:** Same as submit

### Admin Endpoints

#### 1. List All KYC Requests

**Endpoint:** `GET /api/v1/admin/kyc?status=PENDING&page=1&limit=10`  
**Auth:** Bearer <admin_jwt>  
**Roles:** SUPER_ADMIN, FINANCE_ADMIN, PRODUCT_ADMIN

**Response:**
```json
{
  "success": true,
  "count": 25,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  },
  "data": [
    {
      "id": "...",
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "status": "PENDING",
      "submittedAt": "2026-01-20"
    }
  ]
}
```

#### 2. Approve KYC

**Endpoint:** `PATCH /api/v1/admin/kyc/:id/approve`  
**Auth:** Bearer <admin_jwt>  
**Roles:** SUPER_ADMIN, FINANCE_ADMIN

**Response:**
```json
{
  "success": true,
  "message": "KYC approved successfully"
}
```

**What Happens:**
1. ✅ KYC status → APPROVED
2. ✅ Audit log created
3. ✅ Buyer notified
4. ✅ User can now redeem gold

#### 3. Reject KYC

**Endpoint:** `PATCH /api/v1/admin/kyc/:id/reject`  
**Auth:** Bearer <admin_jwt>  
**Roles:** SUPER_ADMIN, FINANCE_ADMIN

**Request:**
```json
{
  "rejectionReason": "Document image unclear. Please resubmit."
}
```

---

## 📦 Order Management

### Buyer Endpoints

#### Get Orders

**Endpoint:** `GET /api/v1/buyer/orders`  
**Auth:** Bearer <mpin_verified_jwt>

**Response:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "...",
      "totalAmount": 15000,
      "orderStatus": "PENDING",
      "paymentStatus": "PENDING",
      "createdAt": "2026-01-20",
      "orderItems": [...]
    }
  ]
}
```

#### Place Direct Order

**Endpoint:** `POST /api/v1/buyer/orders/direct`  
**Auth:** Bearer <mpin_verified_jwt>  
**MPIN Required:** ✅ Yes  
**KYC Required:** ✅ Yes

**Request:**
```json
{
  "productId": "...",
  "quantity": 2,
  "addressId": "...",
  "paymentMethod": "ONLINE"
}
```

---

## 📚 API Reference

### Base URL
```
Development: http://localhost:5000
Production: https://api.jcgold.com
```

### Response Format

**Success:**
```json
{
  "success": true,
  "data": {...}
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden (MPIN/KYC required) |
| 404 | Not Found |
| 429 | Too Many Requests (Rate Limited) |
| 500 | Server Error |

### Complete Endpoint List

#### Authentication
- `POST /api/v1/auth/login` - Admin login
- `POST /api/v1/buyer/auth/register` - Buyer registration
- `POST /api/v1/buyer/auth/login` - Buyer login
- `GET /api/v1/buyer/auth/me` - Get current user

#### MPIN
- `POST /api/v1/buyer/mpin/set` - Set MPIN
- `POST /api/v1/buyer/mpin/verify` - Verify MPIN
- `PUT /api/v1/buyer/mpin/change` - Change MPIN
- `GET /api/v1/buyer/mpin/status` - Get MPIN status

#### Digital Gold (Buyer)
- `POST /api/v1/buyer/digital-gold/buy` - Buy gold
- `GET /api/v1/buyer/digital-gold/wallet` - Get wallet
- `POST /api/v1/buyer/digital-gold/redeem` - Redeem gold
- `GET /api/v1/buyer/digital-gold/transactions` - Get transactions
- `GET /api/v1/buyer/digital-gold/lots` - Get all lots
- `GET /api/v1/buyer/digital-gold/lots/:id` - Get single lot
- `GET /api/v1/buyer/digital-gold/redemptions/:id/lots` - Redemption breakdown

#### Digital Gold (Admin)
- `POST /api/v1/admin/digital-gold/gold-rate` - Set gold rate
- `PATCH /api/v1/admin/digital-gold/approve/:id` - Approve purchase
- `PATCH /api/v1/admin/digital-gold/redemption/approve/:id` - Approve redemption

#### KYC (Buyer)
- `POST /api/v1/buyer/kyc/submit` - Submit KYC
- `GET /api/v1/buyer/kyc/status` - Get KYC status
- `PUT /api/v1/buyer/kyc/resubmit` - Resubmit KYC
- `POST /api/v1/buyer/kyc/upload-document` - Upload document

#### KYC (Admin)
- `GET /api/v1/admin/kyc` - List all KYC
- `GET /api/v1/admin/kyc/:id` - Get single KYC
- `PATCH /api/v1/admin/kyc/:id/approve` - Approve KYC
- `PATCH /api/v1/admin/kyc/:id/reject` - Reject KYC

---

## 🗄️ Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phoneNumber: String,
  wallet: {
    goldBalance: Number,
    silverBalance: Number,
    cashBalance: Number
  },
  mpin: {
    hash: String (select: false),
    isSet: Boolean,
    attempts: Number,
    lockedUntil: Date
  },
  isActive: Boolean
}
```

### GoldLot Model (LOT-BASED)
```javascript
{
  user: ObjectId,
  purchaseTransaction: ObjectId,
  purchaseDate: Date,
  goldGrams: Number,
  remainingGrams: Number,
  pricePerGram: Number,
  totalPaid: Number,
  status: 'ACTIVE' | 'CLOSED'
}
```

### RedemptionLot Model
```javascript
{
  redemptionRequest: ObjectId,
  goldLot: ObjectId,
  gramsUsed: Number,
  pricePerGramAtPurchase: Number,
  pricePerGramAtRedemption: Number,
  profit: Number
}
```

### Kyc Model
```javascript
{
  user: ObjectId,
  fullName: String,
  dateOfBirth: Date,
  documentType: String,
  documentNumber: String,
  documentImage: String,
  address: Object,
  status: 'PENDING' | 'APPROVED' | 'REJECTED',
  rejectionReason: String
}
```

---

## 💻 Frontend Integration

### React Native Example

```javascript
// api.js
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://10.0.2.2:5000'; // Android emulator

export const getAuthHeaders = async () => {
  const token = await SecureStore.getItemAsync('userToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Login
export const login = async (email, password) => {
  const response = await fetch(`${BASE_URL}/api/v1/buyer/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// Verify MPIN
export const verifyMpin = async (mpin) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/v1/buyer/mpin/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mpin }),
  });
  return response.json();
};

// Get Wallet
export const getWallet = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${BASE_URL}/api/v1/buyer/digital-gold/wallet`, {
    method: 'GET',
    headers,
  });
  return response.json();
};
```

### Login Flow

```javascript
const handleLogin = async () => {
  try {
    const response = await login(email, password);
    
    if (response.success) {
      // Store basic token
      await SecureStore.setItemAsync('userToken', response.data.token);
      
      // Check MPIN status
      if (response.data.mpinRequired) {
        if (response.data.mpinSet) {
          navigation.navigate('VerifyMpin');
        } else {
          navigation.navigate('SetMpin');
        }
      }
    }
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

### Error Handling

```javascript
// Check for MPIN requirement
if (error.requireMpin) {
  navigation.navigate('VerifyMpin');
}

// Check for KYC requirement
if (error.requireKyc) {
  navigation.navigate('SubmitKyc');
}

// Handle MPIN lock
if (error.locked) {
  const unlockTime = new Date(error.lockedUntil);
  Alert.alert('MPIN Locked', `Try again after ${unlockTime.toLocaleTimeString()}`);
}
```

---

## 🚀 Deployment Guide

### Environment Variables

```env
# Database
MONGO_URI=mongodb+srv://...

# JWT Secrets
JWT_SECRET=your_admin_jwt_secret
BUYER_JWT_SECRET=your_buyer_jwt_secret
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_SECRET=your_api_secret

# Server
PORT=5000
NODE_ENV=production
```

### Migration (LOT-BASED)

**For existing systems with pool-based gold:**

```bash
# Backup database first
mongodump --uri="mongodb://..." --out=backup

# Run migration
node migrate-to-lot-based.js

# Verify
# Check that wallet balance matches lot totals
```

### Production Checklist

- [ ] Update environment variables
- [ ] Run migration script
- [ ] Test all endpoints
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure rate limiting
- [ ] Set up backup strategy
- [ ] Test error scenarios

---

## 📞 Support & Documentation

**Additional Resources:**
- `frontend_handover.md` - Complete frontend integration guide
- `testing_guide.md` - Comprehensive test cases
- `walkthrough.md` - LOT-BASED implementation details
- `verification_checklist.md` - Production readiness checklist

**Admin Test Account:**
- Email: adminEmail@gmail.com
- Password: superadmin123

**Status:** ✅ Production-Ready  
**Last Updated:** January 2026  
**Version:** 2.0

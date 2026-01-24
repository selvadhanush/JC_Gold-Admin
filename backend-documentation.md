# JC Gold Admin - Backend Documentation

This document provides a comprehensive overview of the backend architecture, API endpoints, and workflows for the JC Gold Admin system.

## 1. Architecture Overview
The backend is a Node.js/Express application utilizing a modular RESTful architecture.

- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)
- **File Storage:** Cloudinary (for product images, banners, etc.)
- **Security:** Helmet, CORS, and Express-level input validation.

### Directory Structure
- `/src/app.js`: Application entry point and middleware configuration.
- `/src/controllers/`: Business logic for various modules.
- `/src/models/`: Mongoose schemas for data entities.
- `/src/routes/`: API endpoint definitions (Categorized by module and user portal).
- `/src/middlewares/`: Auth protection, role verification, and error handling.
- `/src/utils/`: Helper functions (JWT generation, email, file upload).

---

## 2. Authentication Workflow
The system supports two distinct user portals: **Admin** (with various internal roles) and **Buyer**.

### Admin Auth (`/api/v1/auth`)
- **Login:** `POST /api/v1/auth/login`
- **Roles:** `SUPER_ADMIN`, `PRODUCT_ADMIN`, `ORDER_ADMIN`, `FINANCE_ADMIN`.
- **Logic:** Admins are stored in the `Admin` model. Each role has specific endpoint access handled via `middlewares/auth.middleware`.

### Buyer Auth (`/api/v1/buyer/auth`)
- **Register:** `POST /api/v1/buyer/auth/register`
- **Login:** `POST /api/v1/buyer/auth/login`
- **Logic:** Buyers are stored in the `User` model. This portal powers the mobile application.

---

## 3. Core API Endpoints

### 📦 Product Management (Admin)
- **Categories:** `GET/POST /api/v1/categories`
- **Products:** `GET/POST /api/v1/products`
- **Inventory:** `GET /api/v1/inventory`
- **Status Toggle:** `PATCH /api/v1/products/:id/status`

### 💰 Digital Gold System (LOT-BASED Architecture)

**Architecture:** LOT-BASED (Professional Standard - matches AuraGold, SafeGold, MMTC)

Each gold purchase creates a separate **GoldLot** that tracks:
- Purchase date and price
- Original and remaining grams
- Individual profit/loss
- FIFO redemption tracking

#### Admin Endpoints
- **Set Gold Rate:** `POST /api/v1/admin/digital-gold/gold-rate` (Updates current market rate)
- **Approve Purchase:** `PATCH /api/v1/admin/digital-gold/approve/:id` (Creates GoldLot)
- **Approve Redemption:** `PATCH /api/v1/admin/digital-gold/redemption/approve/:id`

#### Buyer Endpoints
- **Buy Gold:** `POST /api/v1/buyer/digital-gold/buy` (Creates pending transaction)
- **Get Wallet:** `GET /api/v1/buyer/digital-gold/wallet` (Shows lot breakdown, profit)
- **Redeem Gold:** `POST /api/v1/buyer/digital-gold/redeem` ⚠️ Requires KYC + MPIN
- **Get Transactions:** `GET /api/v1/buyer/digital-gold/transactions`

#### LOT-BASED Endpoints (New)
- **Get All Lots:** `GET /api/v1/buyer/digital-gold/lots?status=ACTIVE|CLOSED`
- **Get Single Lot:** `GET /api/v1/buyer/digital-gold/lots/:id`
- **Get Redemption Breakdown:** `GET /api/v1/buyer/digital-gold/redemptions/:id/lots`

#### Wallet Response (LOT-BASED)
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
        "id": "...",
        "purchaseDate": "2026-01-10",
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

#### FIFO Redemption Logic
When user redeems gold, the system:
1. Selects ACTIVE lots in FIFO order (oldest first)
2. Deducts from each lot sequentially
3. Closes lots when `remainingGrams` = 0
4. Creates `RedemptionLot` records for audit trail
5. Calculates profit per lot used

**Example:**
```
User has:
- Lot 1: 1g @ ₹6,800 (Jan 10)
- Lot 2: 2g @ ₹7,000 (Jan 15)

User redeems 1.5g:
→ Takes 1g from Lot 1 (Lot 1 CLOSED)
→ Takes 0.5g from Lot 2 (Lot 2 has 1.5g remaining)
```

### 🔐 MPIN (Mobile PIN) System

**Architecture:** Banking-level 6-digit PIN security

All buyer APIs require MPIN verification after login.

#### MPIN Endpoints
- **Set MPIN:** `POST /api/v1/buyer/mpin/set` (First-time setup)
- **Verify MPIN:** `POST /api/v1/buyer/mpin/verify` (App entry, issues 30-min JWT)
- **Change MPIN:** `PUT /api/v1/buyer/mpin/change` (Requires old MPIN)
- **Get Status:** `GET /api/v1/buyer/mpin/status`

#### MPIN Security Features
- ✅ 6 digits, numeric only
- ✅ No sequential patterns (123456, 654321)
- ✅ No repeating digits (111111, 000000)
- ✅ Bcrypt hashing (salt 10)
- ✅ 3 failed attempts → 15-minute lock
- ✅ Rate limiting: 5 attempts per 15 minutes
- ✅ Uniform error messages (no hint on correctness)

#### MPIN Flow
```
1. User logs in → Gets basic JWT
2. Response includes: mpinRequired: true/false, mpinSet: true/false
3. If mpinSet = false → User sets MPIN
4. User verifies MPIN → Gets MPIN-verified JWT (30 min expiry)
5. All buyer APIs require MPIN-verified JWT
```

#### MPIN Enforcement
All buyer routes require `requireMpinVerified` middleware:
- Digital Gold (buy, redeem, wallet)
- Orders (list, create)
- Cart, Profile, Wishlist
- Schemes, Payments, Addresses

**Exceptions (No MPIN required):**
- `/api/v1/buyer/auth/login`
- `/api/v1/buyer/auth/register`
- `/api/v1/buyer/mpin/*` (MPIN management endpoints)

### 📋 Order Management
- **Admin Orders:** `GET /api/v1/orders`
- **Buyer Orders:** `GET /api/v1/buyer/orders`
- **Direct Order:** `POST /api/v1/buyer/orders/direct` ⚠️ Requires KYC approval + MPIN

### 🆔 KYC (Know Your Customer)
- **Submit KYC (Buyer):** `POST /api/v1/buyer/kyc/submit` (Rate limited: 3/day)
- **Get Status (Buyer):** `GET /api/v1/buyer/kyc/status` (Rate limited: 30/hour)
- **Resubmit KYC (Buyer):** `PUT /api/v1/buyer/kyc/resubmit`
- **Upload Documents (Buyer):** `POST /api/v1/buyer/kyc/upload-document` (Optional)
- **List All KYC (Admin):** `GET /api/v1/admin/kyc` (SUPER_ADMIN, FINANCE_ADMIN, PRODUCT_ADMIN)
- **View KYC (Admin):** `GET /api/v1/admin/kyc/:id`
- **Approve KYC (Admin):** `PATCH /api/v1/admin/kyc/:id/approve` (SUPER_ADMIN, FINANCE_ADMIN only)
- **Reject KYC (Admin):** `PATCH /api/v1/admin/kyc/:id/reject` (SUPER_ADMIN, FINANCE_ADMIN only)

**KYC Enforcement:**
- Gold redemption (`POST /api/v1/buyer/digital-gold/redeem`) ⚠️ Requires KYC approval + MPIN
- Direct orders (`POST /api/v1/buyer/orders/direct`) ⚠️ Requires KYC approval + MPIN

**KYC Status Lifecycle:** NOT_SUBMITTED → PENDING → APPROVED/REJECTED


### 💳 Schemes & Installments
- **Create Scheme:** `POST /api/v1/schemes`
- **Enroll (Buyer):** `POST /api/v1/schemes/enroll` ⚠️ Requires MPIN
- **Pay Installment:** `POST /api/v1/schemes/installments/:id/pay` ⚠️ Requires MPIN

---

## 4. Database Models

### Core Models
- **User** - Buyer accounts with wallet, MPIN, KYC reference
- **Admin** - Admin accounts with role-based permissions
- **Product** - Product catalog
- **Order** - Order management
- **Kyc** - KYC verification records

### Digital Gold Models (LOT-BASED)
- **GoldLot** - Individual purchase lots (FIFO tracking)
- **RedemptionLot** - Redemption lot breakdown (audit trail)
- **DigitalGoldTransaction** - All gold transactions (links to lots)
- **RedemptionRequest** - Redemption requests
- **GoldRate** - Historical gold rates

### Key Relationships
```
User → GoldLot (one-to-many)
User → Kyc (one-to-one)
DigitalGoldTransaction → GoldLot (via lotsCreated/lotsUsed)
RedemptionRequest → RedemptionLot (one-to-many)
```

---

## 5. Frontend Integration Guide
To make frontend development easier, follow these standards:

### Global Configuration
Store your `BASE_URL` in a central `api.js` file:
```javascript
export const BASE_URL = 'http://10.0.2.2:5000'; // For Android Emulator
// export const BASE_URL = 'http://localhost:5000'; // For Web/iOS Simulator
```

### Authentication Headers
Use this helper to attach tokens stored via `expo-secure-store`:
```javascript
export const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};
```

### Response Pattern
- **Success:** `{ "success": true, "data": { ... } }` or `{ "success": true, "admin": { ... }, "token": "..." }`
- **Error:** `{ "success": false, "message": "Error description" }`

### MPIN Flow Integration
```javascript
// 1. After login, check MPIN status
const loginResponse = await login(email, password);
if (loginResponse.data.mpinRequired) {
  if (loginResponse.data.mpinSet) {
    navigate('/verify-mpin'); // User has MPIN, needs to verify
  } else {
    navigate('/set-mpin'); // First-time MPIN setup
  }
}

// 2. After MPIN verification, store new token
const mpinResponse = await verifyMpin(mpin);
await SecureStore.setItemAsync('userToken', mpinResponse.data.token);

// 3. Token expires in 30 minutes, prompt re-verification
```

### LOT-BASED Wallet Display
```javascript
// Display lot breakdown
const wallet = await getWallet();
wallet.data.activeLots.forEach(lot => {
  console.log(`${lot.purchaseDate}: ${lot.remainingGrams}g @ ₹${lot.pricePerGram}`);
  console.log(`Profit: ₹${lot.profit} (${lot.profitPercentage}%)`);
});
```

### Optimization Tips
1. **Network Timeout:** Increase `fetch` timeouts to **15 seconds** for mobile reliability.
2. **Error Catching:** Always wrap login/register calls in try-catch to handle `AbortError` or Network connectivity issues.
3. **Role Redirection:** After login, use the `role` field from the response to decide which dashboard route to navigate to.
4. **MPIN Token Refresh:** Implement automatic MPIN re-verification when token expires (30 min).
5. **Lot Caching:** Cache lot data locally to reduce API calls, refresh on pull-to-refresh.

---

## 6. Security Features

### Authentication Layers
1. **JWT Authentication** - Basic user/admin verification
2. **MPIN Verification** - Additional PIN layer for buyers (30-min sessions)
3. **KYC Verification** - Identity verification for sensitive operations
4. **RBAC** - Role-based access control for admins

### Rate Limiting
- KYC submission: 3 per day
- KYC status check: 30 per hour
- MPIN verification: 5 per 15 minutes

### Data Protection
- MPIN: Bcrypt hashed (salt 10), never exposed
- KYC documents: Masked in responses (last 4 digits only)
- Passwords: Bcrypt hashed
- File uploads: Validated and stored on Cloudinary

---

## 7. Migration & Deployment

### LOT-BASED Migration
For existing systems with pool-based gold balances:

```bash
# Run migration script
node migrate-to-lot-based.js
```

This creates GoldLot records from:
- Transaction history (if available)
- Current balance at current rate (fallback)

### Environment Variables
```env
MONGO_URI=mongodb://...
JWT_SECRET=...
BUYER_JWT_SECRET=...
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_SECRET=...
```

---

## 8. API Summary

**Total Endpoints:** 50+
- Admin: 20+ endpoints
- Buyer: 30+ endpoints

**Key Features:**
✅ LOT-BASED digital gold (FIFO redemption)
✅ MPIN security (banking-level)
✅ KYC verification (regulatory compliance)
✅ RBAC (role-based access)
✅ Rate limiting (abuse prevention)
✅ Audit trails (complete transparency)

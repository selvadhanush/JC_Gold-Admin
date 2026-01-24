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

### 💰 Digital Gold System
- **Gold Rate (Admin):** `POST /api/v1/admin/digital-gold/gold-rate` (Updates current market rate)
- **Buy Gold (Buyer):** `POST /api/v1/buyer/digital-gold/buy`
- **Redeem Gold (Buyer):** `POST /api/v1/buyer/digital-gold/redeem` (Transfer to bank or physical gold)
- **Wallet (Buyer):** `GET /api/v1/buyer/digital-gold/wallet`

### 💳 Schemes & Installments
- **Create Scheme:** `POST /api/v1/schemes`
- **Enroll (Buyer):** `POST /api/v1/schemes/enroll`
- **Pay Installment:** `POST /api/v1/schemes/installments/:id/pay`

### 📋 Order Management
- **Admin Orders:** `GET /api/v1/orders`
- **Buyer Orders:** `GET /api/v1/buyer/orders`
- **Direct Order:** `POST /api/v1/buyer/orders/direct` ⚠️ Requires KYC approval

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
- Gold redemption (`POST /api/v1/buyer/digital-gold/redeem`) ⚠️ Requires KYC approval
- Direct orders (`POST /api/v1/buyer/orders/direct`) ⚠️ Requires KYC approval

**KYC Status Lifecycle:** NOT_SUBMITTED → PENDING → APPROVED/REJECTED

---

## 4. Frontend Integration Guide
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

### Optimization Tips
1. **Network Timeout:** Increase `fetch` timeouts to **15 seconds** for mobile reliability.
2. **Error Catching:** Always wrap login/register calls in try-catch to handle `AbortError` or Network connectivity issues.
3. **Role Redirection:** After login, use the `role` field from the response to decide which dashboard route to navigate to.

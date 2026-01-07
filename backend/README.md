# JC Gold Admin & Buyer Backend - Production Ready

A comprehensive full-stack backend system for a jewellery e-commerce platform with **dual authentication systems**: one for **Admin management** and one for **Buyer (Customer) operations**. Manages products, inventory, orders, users, gold saving schemes, payments, CMS, shopping cart, wishlist, and complete e-commerce workflows.

## 🏗️ Architecture Overview

This is a **production-ready RESTful API** built with Node.js and Express.js, following MVC architecture with:
- **Dual Authentication Systems**: Separate JWT-based auth for Admin and Buyers
- **Role-Based Access Control (RBAC)**: 4 admin roles with granular permissions
- **Ownership Verification**: Buyers can only access their own data
- **Comprehensive Validation**: Joi schemas on all endpoints
- **Audit Logging**: Complete admin activity tracking
- **Stock Management**: Real-time inventory validation

### Project Structure
```
backend/
├── src/
│   ├── config/              # Database & environment configuration
│   ├── models/              # 22 Mongoose models (17 original + 5 buyer models)
│   │   ├── [Admin models: Admin, Role, AuditLog]
│   │   ├── [User models: User, Address]
│   │   ├── [Product models: Category, Product, Inventory]
│   │   ├── [Order models: Order, OrderItem, Payment, Refund]
│   │   ├── [Scheme models: Scheme, UserScheme, Installment]
│   │   ├── [Shopping models: Wishlist, Cart, CartItem]
│   │   └── [CMS models: Banner, CMS, Notification]
│   ├── controllers/         # 19 controllers (11 admin + 8 buyer)
│   │   ├── buyer/           # 8 buyer controllers
│   │   │   ├── auth.controller.js
│   │   │   ├── profile.controller.js
│   │   │   ├── address.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── wishlist.controller.js
│   │   │   ├── cart.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── payment.controller.js
│   │   │   ├── scheme.controller.js
│   │   │   └── notification.controller.js
│   │   └── [11 admin controllers]
│   ├── routes/              # 19 route modules (11 admin + 8 buyer)
│   │   ├── buyer/           # 8 buyer routes
│   │   └── [11 admin routes]
│   ├── middlewares/         # 5 middlewares
│   │   ├── auth.middleware.js        # Admin authentication
│   │   ├── buyerAuth.middleware.js   # Buyer authentication (separate JWT)
│   │   ├── role.middleware.js
│   │   ├── audit.middleware.js
│   │   └── validate.middleware.js
│   ├── validations/         # 16 Joi validation schemas (9 admin + 7 buyer)
│   │   ├── buyer/           # 7 buyer validations
│   │   └── [9 admin validations]
│   ├── utils/               # Helpers (JWT, file upload, stock alerts, seeding)
│   ├── app.js               # Express app configuration
│   └── server.js            # Server entry point
├── uploads/                 # Product image storage
├── .env                     # Environment variables
└── package.json
```

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5.2.1
- **Database**: MongoDB with Mongoose ODM v9.1.1
- **Authentication**: JWT (jsonwebtoken v9.0.3) + bcryptjs v3.0.3
- **Validation**: Joi v18.0.2
- **File Upload**: Multer v2.0.2
- **Security**: Helmet v8.1.0, CORS v2.8.5
- **Logging**: Morgan v1.10.1

## 📊 Database Models (22 Total)

### Admin Models
1. **Admin** - Admin user accounts with role assignments
2. **Role** - Role definitions for RBAC
3. **AuditLog** - Activity tracking for admins

### User & Customer Models
4. **User** - Customer/Buyer accounts
5. **Address** - Buyer shipping addresses

### Product Models
6. **Category** - Product categories
7. **Product** - Jewellery products with images and specifications
8. **Inventory** - Stock management for products

### Order Models
9. **Order** - Customer orders
10. **OrderItem** - Individual items within orders
11. **Payment** - Payment transactions
12. **Refund** - Refund records

### Scheme Models
13. **Scheme** - Gold saving scheme definitions
14. **UserScheme** - User enrollments in schemes
15. **Installment** - Installment payments for schemes

### Shopping Models
16. **Wishlist** - Buyer wishlist items
17. **Cart** - Buyer shopping cart
18. **CartItem** - Individual cart items

### CMS Models
19. **Banner** - Homepage/promotional banners
20. **CMS** - Content management (About, Terms, Privacy, etc.)
21. **Notification** - System notifications

## 🔐 Role-Based Access Control

### Admin Roles & Permissions
- **SUPER_ADMIN**: Complete system access including audit logs, user management, and all operations
- **PRODUCT_ADMIN**: Manage categories, products, and inventory
- **ORDER_ADMIN**: Process orders, update statuses, handle cancellations
- **FINANCE_ADMIN**: Manage schemes, payments, refunds, and financial reports

### Security Features
- JWT-based authentication with 7-day token expiry
- Password hashing with bcryptjs
- Role-based route protection
- Audit logging for all admin actions
- Request validation on all endpoints

### Buyer Authentication
- **Separate JWT System**: Buyers use `BUYER_JWT_SECRET` (completely isolated from admin)
- **Buyer Middleware**: `buyerAuth.middleware.js` for buyer-specific authentication
- **Ownership Verification**: Buyers can only access their own data
- **No Admin Access**: Buyer tokens cannot access admin routes
- **Stock Validation**: Real-time inventory checks on cart and order operations

## 🚀 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new admin (SUPER_ADMIN only)
- `POST /login` - Admin login
- `GET /me` - Get current admin profile
- `PUT /profile` - Update admin profile
- `PUT /password` - Change password

### Categories (`/api/v1/categories`)
- `GET /` - List all categories
- `POST /` - Create category (PRODUCT_ADMIN)
- `PUT /:id` - Update category (PRODUCT_ADMIN)
- `DELETE /:id` - Delete category (PRODUCT_ADMIN)
- `PATCH /:id/status` - Toggle category status (PRODUCT_ADMIN)

### Products (`/api/v1/products`)
- `GET /` - List products with filters (status, category, search)
- `GET /:id` - Get product details
- `POST /` - Create product with images (PRODUCT_ADMIN)
- `PUT /:id` - Update product (PRODUCT_ADMIN)
- `DELETE /:id` - Delete product (PRODUCT_ADMIN)
- `PATCH /:id/status` - Update product status (PRODUCT_ADMIN)
- `PATCH /:id/stock` - Update stock quantity (PRODUCT_ADMIN)

### Inventory (`/api/v1/inventory`)
- `GET /` - List inventory with low stock alerts
- `GET /low-stock` - Get low stock items
- `PATCH /:productId/adjust` - Adjust stock levels (PRODUCT_ADMIN)

### Users (`/api/v1/users`)
- `GET /` - List all users with filters
- `GET /:id` - Get user details
- `PATCH /:id/status` - Update user status (SUPER_ADMIN)
- `GET /:id/orders` - Get user's order history
- `GET /:id/schemes` - Get user's scheme enrollments

### Orders (`/api/v1/orders`)
- `GET /` - List orders with filters (status, date range, user)
- `GET /:id` - Get order details
- `PATCH /:id/status` - Update order status (ORDER_ADMIN)
- `PATCH /:id/cancel` - Cancel order (ORDER_ADMIN)
- `GET /:id/invoice` - Generate order invoice

### Schemes (`/api/v1/schemes`)
- `GET /` - List all schemes
- `GET /:id` - Get scheme details
- `POST /` - Create scheme (FINANCE_ADMIN)
- `PUT /:id` - Update scheme (FINANCE_ADMIN)
- `DELETE /:id` - Delete scheme (FINANCE_ADMIN)
- `POST /enroll` - Enroll user in scheme (FINANCE_ADMIN)
- `POST /installments/:id/pay` - Record installment payment (FINANCE_ADMIN)

### Payments (`/api/v1/payments`)
- `GET /` - List payments with filters (method, status, date range)
- `GET /:id` - Get payment details
- `POST /:id/refund` - Process refund (FINANCE_ADMIN)

### Dashboard (`/api/v1/dashboard`)
- `GET /stats` - Get dashboard statistics (revenue, orders, users)
- `GET /export/sales` - Export sales report (CSV/Excel)

### CMS (`/api/v1/cms`)
- `GET /banners` - List all banners
- `POST /banners` - Create banner (SUPER_ADMIN)
- `PUT /banners/:id` - Update banner (SUPER_ADMIN)
- `DELETE /banners/:id` - Delete banner (SUPER_ADMIN)
- `GET /content/:type` - Get content by type (about, terms, privacy, etc.)
- `PUT /content/:type` - Update content (SUPER_ADMIN)
- `POST /notify` - Send notification to users (SUPER_ADMIN)

### Audit Logs (`/api/v1/audit`)
- `GET /` - View audit logs with filters (SUPER_ADMIN only)

---

## 🛍️ Buyer API Endpoints

### Buyer Authentication (`/api/v1/buyer/auth`)
- `POST /register` - Register new buyer account
- `POST /login` - Buyer login
- `GET /me` - Get current buyer profile

### Buyer Profile (`/api/v1/buyer/profile`)
- `GET /` - View buyer profile
- `PUT /` - Update buyer profile
- `PUT /password` - Change password

### Address Management (`/api/v1/buyer/addresses`)
- `GET /` - List all addresses
- `POST /` - Add new address
- `PUT /:id` - Update address
- `DELETE /:id` - Delete address
- `PATCH /:id/default` - Set default address

### Product Browsing (`/api/v1/buyer/products`)
- `GET /` - Browse products with filters (category, search, price, metal, purity)
- `GET /categories` - Get all categories
- `GET /:id` - Get product details

### Wishlist (`/api/v1/buyer/wishlist`)
- `GET /` - View wishlist
- `POST /` - Add product to wishlist
- `DELETE /:productId` - Remove from wishlist

### Shopping Cart (`/api/v1/buyer/cart`)
- `GET /` - View cart
- `POST /` - Add product to cart (with stock validation)
- `PUT /:itemId` - Update cart item quantity
- `DELETE /:itemId` - Remove item from cart
- `DELETE /` - Clear entire cart

### Orders (`/api/v1/buyer/orders`)
- `POST /` - Place order from cart
- `GET /` - View order history
- `GET /:id` - Get order details

### Payments (`/api/v1/buyer/payments`)
- `POST /` - Create payment (mock gateway)
- `GET /` - View payment history
- `GET /:id` - Get payment details

### Gold Saving Schemes (`/api/v1/buyer/schemes`)
- `GET /` - Browse available schemes
- `GET /:id` - Get scheme details
- `POST /:id/enroll` - Enroll in scheme
- `GET /my/all` - View enrolled schemes
- `POST /my/:id/installment` - Pay installment
- `GET /my/:id/status` - Get scheme status and maturity details

### Notifications (`/api/v1/buyer/notifications`)
- `GET /` - View notifications
- `PATCH /:id/read` - Mark notification as read

---

## ✅ Request Validation

All endpoints are protected with **Joi validation schemas** ensuring:
- Required fields are present
- Data types are correct
- String lengths are within limits
- Email formats are valid
- Enum values are valid
- Numeric ranges are appropriate

### Admin Validation Modules (9)
- `auth.validation.js` - Admin login, registration, password updates
- `category.validation.js` - Category CRUD
- `product.validation.js` - Product CRUD with image validation
- `order.validation.js` - Order creation and status updates
- `scheme.validation.js` - Scheme management and enrollments
- `payment.validation.js` - Payment processing
- `user.validation.js` - User management
- `inventory.validation.js` - Stock adjustments
- `cms.validation.js` - CMS content management

### Buyer Validation Modules (7)
- `buyer/auth.validation.js` - Buyer registration and login
- `buyer/profile.validation.js` - Profile updates and password change
- `buyer/address.validation.js` - Address management
- `buyer/wishlist.validation.js` - Wishlist operations
- `buyer/cart.validation.js` - Cart operations
- `buyer/order.validation.js` - Order placement
- `buyer/scheme.validation.js` - Scheme enrollment and installments

## 🔧 Middleware Stack

### Admin Middlewares
1. **auth.middleware.js** - JWT verification for admin using `JWT_SECRET`
2. **role.middleware.js** - Role-based access control for admin operations
3. **audit.middleware.js** - Automatic audit log creation for admin actions

### Buyer Middlewares
4. **buyerAuth.middleware.js** - JWT verification for buyers using `BUYER_JWT_SECRET`

### Shared Middlewares
5. **validate.middleware.js** - Request validation using Joi schemas (used by both)

## 🛠️ Utility Functions

- **generateToken.js** - JWT token generation
- **fileUpload.js** - Multer configuration for product images
- **stockAlert.js** - Low stock detection and alerts
- **errorResponse.js** - Standardized error responses
- **seed.js** - Database seeding script for initial setup

## 📦 Setup Instructions

### Prerequisites
- Node.js v16+ installed
- MongoDB running locally or remote connection string

### Installation

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the backend root:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/jc_gold_admin
   
   # Admin JWT Secret
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Buyer JWT Secret (MUST be different from JWT_SECRET)
   BUYER_JWT_SECRET=your_buyer_jwt_secret_here
   
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```
   
   > [!IMPORTANT]
   > **BUYER_JWT_SECRET** must be different from **JWT_SECRET** to ensure complete isolation between admin and buyer authentication systems.

4. **Seed the database (optional)**
   ```bash
   node src/utils/seed.js
   ```
   This creates initial roles and a super admin account.

5. **Start the server**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

6. **Verify the server**
   
   Visit `http://localhost:5000` - you should see:
   ```json
   {
     "message": "Welcome to Jewellery Admin Backend API"
   }
   ```

## 🧪 Testing the API

### Sample Admin Login
```bash
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@jewellery.com",
  "password": "Admin@123"
}
```

### Using the JWT Token
After login, include the token in subsequent requests:
```bash
GET http://localhost:5000/api/v1/auth/me
Authorization: Bearer <your_jwt_token>
```

### Sample Buyer Registration
```bash
POST http://localhost:5000/api/v1/buyer/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "9876543210"
}
```

### Sample Buyer Login
```bash
POST http://localhost:5000/api/v1/buyer/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Buyer Authenticated Request Example
```bash
GET http://localhost:5000/api/v1/buyer/cart
Authorization: Bearer <buyer_jwt_token>
```

## 📁 File Upload

Product images are uploaded to the `uploads/` directory. The API supports:
- Multiple image uploads per product
- Automatic file validation (type, size)
- Unique filename generation
- Static file serving via Express

## 🔍 Key Features

### Admin Features
✅ **Complete CRUD operations** for all entities  
✅ **Role-based access control** with 4 admin roles  
✅ **Comprehensive validation** on all inputs  
✅ **Audit logging** for accountability  
✅ **JWT authentication** with secure password hashing  
✅ **File upload** support for product images  
✅ **Stock management** with low stock alerts  
✅ **Order processing** with status tracking  
✅ **Payment & refund** management  
✅ **Gold saving schemes** with installment tracking  
✅ **CMS** for dynamic content  
✅ **Dashboard analytics** and reporting  
✅ **Error handling** with detailed responses  
✅ **Security headers** with Helmet  
✅ **CORS enabled** for frontend integration  

### Buyer Features
✅ **Separate authentication** system with JWT isolation  
✅ **Profile management** with address book  
✅ **Product browsing** with advanced filters  
✅ **Wishlist** functionality  
✅ **Shopping cart** with real-time stock validation  
✅ **Order placement** with automatic inventory updates  
✅ **Payment processing** (mock gateway ready for integration)  
✅ **Scheme enrollment** and installment payments  
✅ **Notification** system  
✅ **Ownership verification** on all operations  
✅ **Read-only access** to products (buyers cannot modify)  

## 📝 Notes

### General
- All timestamps are automatically managed by Mongoose (`createdAt`, `updatedAt`)
- Soft delete is implemented for critical entities (products, categories)
- Pagination support is available on list endpoints
- Search and filtering capabilities on major endpoints
- Image uploads are stored locally (can be migrated to cloud storage)

### Admin System
- Admin routes use `/api/v1/` prefix
- Admin authentication uses `JWT_SECRET`
- 4 role levels with granular permissions
- Complete audit trail for all admin actions

### Buyer System
- Buyer routes use `/api/v1/buyer/` prefix
- Buyer authentication uses `BUYER_JWT_SECRET` (separate from admin)
- Buyers can only access their own data (enforced by middleware)
- Real-time stock validation on cart and order operations
- Automatic inventory updates on order placement

## 🚀 Production Deployment

Before deploying to production:
1. Set `NODE_ENV=production` in `.env`
2. Use strong, different secrets for `JWT_SECRET` and `BUYER_JWT_SECRET`
3. Configure MongoDB Atlas or production database
4. Set up proper CORS origins (separate for admin and buyer frontends if needed)
5. Configure file upload to cloud storage (AWS S3, Cloudinary)
6. Enable HTTPS
7. Set up monitoring and logging
8. Configure rate limiting (different limits for admin vs buyer endpoints)
9. Set up automated backups
10. Integrate real payment gateway (replace mock implementation)
11. Set up email service for notifications (order confirmations, scheme reminders)
12. Configure production error tracking (Sentry, etc.)

---

**Built with ❤️ for JC Gold Admin & Buyer Platform**

*A complete e-commerce backend solution with dual authentication systems for admin management and customer operations.*

// Main API configuration
// For Android Emulators use: http://10.0.2.2:5000
// For iOS Simulators use: http://localhost:5000
// For physical devices, use your computer's local IP address (e.g., http://192.168.1.10:5000)

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getBaseUrl = () => {
    // For Web, always use localhost
    if (Platform.OS === 'web') return 'http://10.105.228.96:5000';

    // For Physical Devices (Android/iOS) running via Expo Go
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
        const ip = hostUri.split(':')[0];
        return `http://${ip}:5000`;
    }

    // Fallback for Emulators
    if (Platform.OS === 'android') return 'http://10.0.2.2:5000';

    // Fallback for iOS Simulator
    return 'http://10.105.228.96:5000';
};

export const BASE_URL = 'http://10.105.228.96:5000'; // Local development IP

import * as SecureStore from 'expo-secure-store';

export const API_ENDPOINTS = {
    // Admin
    ADMIN_LOGIN: `${BASE_URL}/api/v1/auth/login`,
    ADMIN_MANAGEMENT: `${BASE_URL}/api/v1/admin-management`,
    USERS: `${BASE_URL}/api/v1/users`,
    AUDIT: `${BASE_URL}/api/v1/audit`,
    DASHBOARD: `${BASE_URL}/api/v1/dashboard`,

    // Super Admin Power Tools
    SUPER_STATS: `${BASE_URL}/api/v1/super-admin/dashboard-stats`,
    SUPER_SETTINGS: `${BASE_URL}/api/v1/super-admin/settings`,
    SUPER_AUDIT: `${BASE_URL}/api/v1/super-admin/audit`,
    SUPER_REPORTS: `${BASE_URL}/api/v1/super-admin/reports`,
    SUPER_RESET_PWD: (id) => `${BASE_URL}/api/v1/super-admin/admins/${id}/reset-password`,
    SUPER_CMS_BANNER: `${BASE_URL}/api/v1/cms/banners`,
    SUPER_CMS_CONTENT: `${BASE_URL}/api/v1/cms/content`,
    // Admin KYC Management
    ADMIN_KYC: `${BASE_URL}/api/v1/admin/kyc`,
    ADMIN_KYC_APPROVE: (id) => `${BASE_URL}/api/v1/admin/kyc/${id}/approve`,
    ADMIN_KYC_REJECT: (id) => `${BASE_URL}/api/v1/admin/kyc/${id}/reject`,

    // Product Admin - Categories
    PRODUCT_CATEGORIES: `${BASE_URL}/api/v1/categories`,
    PRODUCT_CATEGORY_BY_ID: (id) => `${BASE_URL}/api/v1/categories/${id}`,
    PRODUCT_CATEGORY_STATUS: (id) => `${BASE_URL}/api/v1/categories/${id}/status`,

    // Product Admin - Products
    PRODUCT_PRODUCTS: `${BASE_URL}/api/v1/products`,
    PRODUCT_PRODUCT_BY_ID: (id) => `${BASE_URL}/api/v1/products/${id}`,
    PRODUCT_PRODUCT_STATUS: (id) => `${BASE_URL}/api/v1/products/${id}/status`,
    PRODUCT_PRODUCT_STOCK: (id) => `${BASE_URL}/api/v1/products/${id}/stock`,

    // Product Admin - Inventory
    PRODUCT_INVENTORY: `${BASE_URL}/api/v1/inventory`,
    PRODUCT_INVENTORY_LOW_STOCK: `${BASE_URL}/api/v1/inventory/low-stock`,
    PRODUCT_INVENTORY_ADJUST: (productId) => `${BASE_URL}/api/v1/inventory/${productId}/adjust`,

    // Buyer Auth
    BUYER_LOGIN: `${BASE_URL}/api/v1/buyer/auth/login`,
    BUYER_REGISTER: `${BASE_URL}/api/v1/buyer/auth/register`,
    BUYER_PROFILE: `${BASE_URL}/api/v1/buyer/profile`,
    BUYER_ADDRESSES: `${BASE_URL}/api/v1/buyer/addresses`,

    // Products
    BUYER_PRODUCTS: `${BASE_URL}/api/v1/buyer/products`,
    BUYER_PRODUCT_CATEGORIES: `${BASE_URL}/api/v1/buyer/products/categories`,

    // Wishlist
    BUYER_WISHLIST: `${BASE_URL}/api/v1/buyer/wishlist`,

    // Cart
    BUYER_CART: `${BASE_URL}/api/v1/buyer/cart`,

    // Orders
    BUYER_ORDERS: `${BASE_URL}/api/v1/buyer/orders`,
    BUYER_DIRECT_ORDER: `${BASE_URL}/api/v1/buyer/orders/direct`,

    // Payments
    BUYER_PAYMENTS: `${BASE_URL}/api/v1/buyer/payments`,

    // Notifications
    BUYER_NOTIFICATIONS: `${BASE_URL}/api/v1/buyer/notifications`,

    // Support
    BUYER_SUPPORT: `${BASE_URL}/api/v1/support/buyer`,
    ADMIN_SUPPORT: `${BASE_URL}/api/v1/support/admin`,
    ADMIN_SUPPORT_UPDATE: (id) => `${BASE_URL}/api/v1/support/admin/${id}`,

    // Finance Admin - Schemes
    FINANCE_SCHEMES: `${BASE_URL}/api/v1/schemes`,
    FINANCE_SCHEME_BY_ID: (id) => `${BASE_URL}/api/v1/schemes/${id}`,
    FINANCE_SCHEME_ENROLL: `${BASE_URL}/api/v1/schemes/enroll`,
    FINANCE_USER_SCHEMES: (userId) => `${BASE_URL}/api/v1/users/${userId}/schemes`,

    // Finance Admin - Installments
    FINANCE_INSTALLMENT_PAY: (id) => `${BASE_URL}/api/v1/schemes/installments/${id}/pay`,
    FINANCE_INSTALLMENTS: `${BASE_URL}/api/v1/schemes/installments`,

    // Finance Admin - Payments
    FINANCE_PAYMENTS: `${BASE_URL}/api/v1/payments`,
    FINANCE_PAYMENT_BY_ID: (id) => `${BASE_URL}/api/v1/payments/${id}`,
    FINANCE_PAYMENT_REFUND: (id) => `${BASE_URL}/api/v1/payments/${id}/refund`,

    // Finance Admin - Dashboard & Reports
    FINANCE_DASHBOARD_STATS: `${BASE_URL}/api/v1/dashboard/stats`,
    FINANCE_EXPORT_SALES: `${BASE_URL}/api/v1/dashboard/export/sales`,

    // Digital Gold - Buyer
    BUYER_DIGITAL_GOLD_BUY: `${BASE_URL}/api/v1/buyer/digital-gold/buy`,
    BUYER_DIGITAL_GOLD_WALLET: `${BASE_URL}/api/v1/buyer/digital-gold/wallet`,
    BUYER_DIGITAL_GOLD_REDEEM: `${BASE_URL}/api/v1/buyer/digital-gold/redeem`,
    BUYER_DIGITAL_GOLD_TRANSACTIONS: `${BASE_URL}/api/v1/buyer/digital-gold/transactions`,
    BUYER_DIGITAL_GOLD_REDEMPTIONS: `${BASE_URL}/api/v1/buyer/digital-gold/redemptions`,

    // Digital Gold - Admin
    ADMIN_GOLD_RATE: `${BASE_URL}/api/v1/admin/digital-gold/gold-rate`,
    ADMIN_DIGITAL_GOLD_APPROVE: (id) => `${BASE_URL}/api/v1/admin/digital-gold/approve/${id}`,
    ADMIN_DIGITAL_GOLD_REDEMPTION_APPROVE: (id) => `${BASE_URL}/api/v1/admin/digital-gold/redemption/approve/${id}`,
    ADMIN_DIGITAL_GOLD_DASHBOARD_RATES: `${BASE_URL}/api/v1/admin/digital-gold/dashboard-rates`,

    // Razorpay
    BUYER_RAZORPAY_ORDER: `${BASE_URL}/api/v1/buyer/payments/razorpay-order`,
    BUYER_RAZORPAY_VERIFY: `${BASE_URL}/api/v1/buyer/payments/verify`,

    // Schemes - Buyer
    BUYER_SCHEMES: `${BASE_URL}/api/v1/buyer/schemes`,
    BUYER_SCHEME_ENROLL: (id) => `${BASE_URL}/api/v1/buyer/schemes/${id}/enroll`,
    BUYER_MY_SCHEMES: `${BASE_URL}/api/v1/buyer/schemes/my/all`,
    BUYER_SCHEME_INSTALLMENT: (id) => `${BASE_URL}/api/v1/buyer/schemes/my/${id}/installment`,
    BUYER_SCHEME_STATUS: (id) => `${BASE_URL}/api/v1/buyer/schemes/my/${id}/status`,
    // KYC - Buyer
    BUYER_KYC_STATUS: `${BASE_URL}/api/v1/buyer/kyc/status`,
    BUYER_KYC_SUBMIT: `${BASE_URL}/api/v1/buyer/kyc/submit`,
    BUYER_KYC_RESUBMIT: `${BASE_URL}/api/v1/buyer/kyc/resubmit`,
    BUYER_KYC_UPLOAD: `${BASE_URL}/api/v1/buyer/kyc/upload-document`,
    // MPIN - Buyer
    BUYER_MPIN_SET: `${BASE_URL}/api/v1/buyer/mpin/set`,
    BUYER_MPIN_VERIFY: `${BASE_URL}/api/v1/buyer/mpin/verify`,
    BUYER_MPIN_STATUS: `${BASE_URL}/api/v1/buyer/mpin/status`,
    BUYER_MPIN_CHANGE: `${BASE_URL}/api/v1/buyer/mpin/change`,

    // General Tickets
    GENERAL_TICKETS_CREATE: `${BASE_URL}/api/v1/general-tickets`,
    GENERAL_TICKETS_MY: `${BASE_URL}/api/v1/general-tickets/my`,
    GENERAL_TICKETS_ADMIN: `${BASE_URL}/api/v1/general-tickets/admin`,
    GENERAL_TICKETS_UPDATE: (id) => `${BASE_URL}/api/v1/general-tickets/${id}`,
    // Bank Account - Buyer
    BUYER_BANK_ACCOUNT: `${BASE_URL}/api/v1/buyer/bank-account`,

    // Maintenance Mode
    MAINTENANCE_STATUS: `${BASE_URL}/api/v1/maintenance/status`,
    MAINTENANCE_COUNTDOWN: `${BASE_URL}/api/v1/maintenance/countdown`,
    MAINTENANCE_ACTIVATE: `${BASE_URL}/api/v1/maintenance/activate`,
    MAINTENANCE_DEACTIVATE: `${BASE_URL}/api/v1/maintenance/deactivate`,
};

export const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

// Main API configuration
// For Android Emulators use: http://10.0.2.2:5000
// For iOS Simulators use: http://localhost:5000
// For physical devices, use your computer's local IP address (e.g., http://192.168.1.10:5000)

export const BASE_URL = 'http://192.168.29.63:5000'; // For Android Emulator

import * as SecureStore from 'expo-secure-store';

export const API_ENDPOINTS = {
    // Admin
    ADMIN_LOGIN: `${BASE_URL}/api/v1/auth/login`,

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
};

export const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};

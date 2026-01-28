const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.63:5000/api';

export const config = {
    apiUrl: API_URL,
    endpoints: {
        auth: {
            login: `${API_URL}/auth/login`,
            register: `${API_URL}/auth/register`,
            logout: `${API_URL}/auth/logout`,
        },
        products: {
            list: `${API_URL}/products`,
            create: `${API_URL}/products`,
            update: (id: string) => `${API_URL}/products/${id}`,
            delete: (id: string) => `${API_URL}/products/${id}`,
        },
        orders: {
            list: `${API_URL}/orders`,
            create: `${API_URL}/orders`,
            update: (id: string) => `${API_URL}/orders/${id}`,
        },
    },
};

export default config;

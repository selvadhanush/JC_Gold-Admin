import config from '../config/api';

interface FetchOptions extends RequestInit {
    headers?: HeadersInit;
}

class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.apiUrl;
    }

    private async request<T>(
        endpoint: string,
        options: FetchOptions = {}
    ): Promise<T> {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data as T;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put<T>(endpoint: string, data?: any, options?: FetchOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export const apiService = new ApiService();
export default apiService;

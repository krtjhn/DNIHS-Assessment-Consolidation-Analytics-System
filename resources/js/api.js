// + API Client Wrapper para sa Laravel Sanctum Token Authentication
const API_BASE = '/api';

export const api = {
    // + Kunin ang Sanctum Bearer token mula sa localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // + I-store ang authentication session
    setAuth(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    // + I-clear ang authentication session sa logout
    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // + Kunin ang active user profile
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // + Unified HTTP request handler na may Bearer Token headers
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        // + Kapag 401 Unauthorized (expired token), i-clear ang session
        if (response.status === 401) {
            this.clearAuth();
            window.dispatchEvent(new Event('auth:unauthorized'));
            throw new Error('Your session has expired. Please sign in again.');
        }

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const error = new Error(data?.message || 'A network error occurred.');
            error.errors = data?.errors || {};
            error.status = response.status;
            throw error;
        }

        return data;
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
};

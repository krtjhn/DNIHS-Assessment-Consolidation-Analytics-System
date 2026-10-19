// Centralized API client handling Laravel Sanctum Bearer token authentication
// Support external backend URL (e.g. Render) via VITE_API_BASE_URL, or relative /api in local dev
const BACKEND_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API_BASE = `${BACKEND_BASE}/api`;

// In-memory response cache for idempotent reference endpoints
const memoryCache = new Map();

// Active GET promises in-flight to deduplicate concurrent identical requests
const inFlightRequests = new Map();

// Active abort controllers to cancel in-flight requests on logout or session reset
const activeControllers = new Set();

// Clear cached endpoints when academic data changes or user logs out
export function clearApiCache(pattern) {
    if (!pattern) {
        memoryCache.clear();
        inFlightRequests.clear();
        return;
    }
    for (const key of memoryCache.keys()) {
        if (key.includes(pattern)) {
            memoryCache.delete(key);
        }
    }
}

// Invalidate reference cache whenever academic period is updated anywhere in the app
if (typeof window !== 'undefined') {
    window.addEventListener('academic-period:updated', () => clearApiCache());
}

export const api = {
    // Retrieve authentication token from browser storage
    getToken() {
        return localStorage.getItem('token');
    },

    // Save active token and user session to browser storage
    setAuth(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Clear authentication session upon logout or expiration
    clearAuth() {
        // Abort all in-flight requests from the previous session
        for (const controller of activeControllers) {
            try {
                controller.abort();
            } catch {
                // Ignore abort errors
            }
        }
        activeControllers.clear();
        memoryCache.clear();
        inFlightRequests.clear();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Retrieve active authenticated user object from storage
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Unified HTTP request handler with automatic Bearer token injection
    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        const controller = new AbortController();
        activeControllers.add(controller);
        const signal = options.signal || controller.signal;

        let response;
        try {
            response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers,
                signal,
            });
        } catch (fetchErr) {
            if (fetchErr.name === 'AbortError') {
                const err = new Error('Request was aborted.');
                err.name = 'AbortError';
                throw err;
            }
            throw fetchErr;
        } finally {
            activeControllers.delete(controller);
        }

        // Trigger session reset if API returns 401 Unauthorized
        // Safeguards:
        // 1. Never dispatch auth:unauthorized for auth endpoints (/auth/login, /auth/logout, /auth/register)
        // 2. Only dispatch if the request was sent with a token AND that token still matches the current active token
        if (response.status === 401) {
            const isAuthEndpoint = endpoint.startsWith('/auth/');
            const currentToken = this.getToken();

            if (!isAuthEndpoint && token && currentToken === token) {
                this.clearAuth();
                window.dispatchEvent(new Event('auth:unauthorized'));
            }
            throw new Error('Your session has expired. Please sign in again.');
        }

        const data = await response.json().catch(() => null);

        // Normalize backend error messages and validation bags
        if (!response.ok) {
            const error = new Error(data?.message || 'A network error occurred.');
            error.errors = data?.errors || {};
            error.status = response.status;
            throw error;
        }

        // Auto-invalidate reference cache on academic mutations
        if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
            if (
                endpoint.includes('/school-years') ||
                endpoint.includes('/terms') ||
                endpoint.includes('/sections') ||
                endpoint.includes('/assignments')
            ) {
                clearApiCache();
            }
        }

        return data;
    },

    // HTTP GET helper with smart in-memory reference caching and in-flight deduplication
    async get(endpoint, options = {}) {
        const isCacheable =
            endpoint.startsWith('/reference-data') ||
            endpoint.startsWith('/my-classes');

        if (isCacheable && !options.noCache && memoryCache.has(endpoint)) {
            const cached = memoryCache.get(endpoint);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
                return cached.data;
            }
        }

        // Deduplicate concurrent in-flight requests for identical endpoints
        if (isCacheable && !options.noCache && inFlightRequests.has(endpoint)) {
            return inFlightRequests.get(endpoint);
        }

        const requestPromise = (async () => {
            try {
                const data = await this.request(endpoint, { method: 'GET', ...options });
                if (isCacheable) {
                    memoryCache.set(endpoint, { data, timestamp: Date.now() });
                }
                return data;
            } finally {
                inFlightRequests.delete(endpoint);
            }
        })();

        if (isCacheable && !options.noCache) {
            inFlightRequests.set(endpoint, requestPromise);
        }

        return requestPromise;
    },

    // HTTP POST helper
    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    // HTTP PUT helper
    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    // HTTP PATCH helper
    patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
    },

    // HTTP DELETE helper
    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },
};

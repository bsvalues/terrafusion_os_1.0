import AppConfig from '../config/app-config';
import logger from './logger';

class SecurityManager {
    constructor() {
        this.token = null;
        this.user = null;
        this.permissions = new Set();
        this.initialize();
    }

    initialize() {
        this.loadStoredCredentials();
        this.setupSecurityHeaders();
        this.setupCSRFProtection();
    }

    loadStoredCredentials() {
        try {
            const storedToken = localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('user_data');
            if (storedToken && storedUser) {
                this.token = storedToken;
                this.user = JSON.parse(storedUser);
                this.validateToken();
            }
        } catch (error) {
            logger.error('Failed to load stored credentials', { error });
            this.clearCredentials();
        }
    }

    setupSecurityHeaders() {
        if (window.Headers) {
            const defaultHeaders = new Headers({
                'Content-Security-Policy': AppConfig.security.csp,
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block'
            });
            this.defaultHeaders = defaultHeaders;
        }
    }

    setupCSRFProtection() {
        this.csrfToken = this.generateCSRFToken();
        document.addEventListener('DOMContentLoaded', () => {
            const meta = document.createElement('meta');
            meta.name = 'csrf-token';
            meta.content = this.csrfToken;
            document.head.appendChild(meta);
        });
    }

    generateCSRFToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    async login(credentials) {
        try {
            const response = await fetch(`${AppConfig.api.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                throw new Error('Authentication failed');
            }

            const data = await response.json();
            this.setCredentials(data.token, data.user);
            logger.info('User logged in successfully', { userId: data.user.id });
            return true;
        } catch (error) {
            logger.error('Login failed', { error });
            throw error;
        }
    }

    async logout() {
        try {
            if (this.token) {
                await fetch(`${AppConfig.api.baseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'X-CSRF-Token': this.csrfToken
                    }
                });
            }
        } catch (error) {
            logger.error('Logout failed', { error });
        } finally {
            this.clearCredentials();
        }
    }

    setCredentials(token, user) {
        this.token = token;
        this.user = user;
        this.permissions = new Set(user.permissions || []);
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
    }

    clearCredentials() {
        this.token = null;
        this.user = null;
        this.permissions.clear();
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }

    async validateToken() {
        if (!this.token) return false;

        try {
            const response = await fetch(`${AppConfig.api.baseUrl}/auth/validate`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'X-CSRF-Token': this.csrfToken
                }
            });

            if (!response.ok) {
                this.clearCredentials();
                return false;
            }

            const data = await response.json();
            this.permissions = new Set(data.permissions || []);
            return true;
        } catch (error) {
            logger.error('Token validation failed', { error });
            this.clearCredentials();
            return false;
        }
    }

    hasPermission(permission) {
        return this.permissions.has(permission);
    }

    hasAnyPermission(permissions) {
        return permissions.some(permission => this.permissions.has(permission));
    }

    hasAllPermissions(permissions) {
        return permissions.every(permission => this.permissions.has(permission));
    }

    getAuthHeaders() {
        const headers = new Headers(this.defaultHeaders);
        if (this.token) {
            headers.append('Authorization', `Bearer ${this.token}`);
        }
        headers.append('X-CSRF-Token', this.csrfToken);
        return headers;
    }

    encryptData(data) {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            return btoa(String.fromCharCode(...new Uint8Array(dataBuffer)));
        } catch (error) {
            logger.error('Data encryption failed', { error });
            throw error;
        }
    }

    decryptData(encryptedData) {
        try {
            const binaryString = atob(encryptedData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(bytes));
        } catch (error) {
            logger.error('Data decryption failed', { error });
            throw error;
        }
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

const security = new SecurityManager();
export default security; 
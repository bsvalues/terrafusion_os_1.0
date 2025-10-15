const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { promisify } = require('util');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

class SecurityManager {
    constructor(config) {
        this.config = {
            jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
            jwtExpiration: '24h',
            bcryptRounds: 10,
            rateLimitWindow: 15 * 60 * 1000, // 15 minutes
            rateLimitMax: 100,
            ...config
        };

        this.users = new Map();
        this.blacklistedTokens = new Set();
        this.initialized = false;
    }

    async initialize() {
        try {
            await this.setupSecurityMiddleware();
            await this.loadUsers();
            this.initialized = true;
        } catch (error) {
            throw new Error(`Failed to initialize SecurityManager: ${error.message}`);
        }
    }

    async setupSecurityMiddleware() {
        this.middleware = {
            helmet: helmet(),
            cors: cors({
                origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                allowedHeaders: ['Content-Type', 'Authorization']
            }),
            rateLimiter: rateLimit({
                windowMs: this.config.rateLimitWindow,
                max: this.config.rateLimitMax,
                message: 'Too many requests from this IP, please try again later.'
            })
        };
    }

    async loadUsers() {
        // Load users from database or file
        // This is a placeholder for actual user loading logic
        const defaultUser = {
            id: 'admin',
            password: await this.hashPassword('admin'),
            role: 'admin',
            permissions: ['read', 'write', 'execute']
        };
        this.users.set(defaultUser.id, defaultUser);
    }

    async authenticate(username, password) {
        const user = this.users.get(username);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        return this.generateToken(user);
    }

    async validateToken(token) {
        if (this.blacklistedTokens.has(token)) {
            throw new Error('Token has been revoked');
        }

        try {
            const decoded = await promisify(jwt.verify)(token, this.config.jwtSecret);
            return decoded;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    async revokeToken(token) {
        this.blacklistedTokens.add(token);
    }

    async hashPassword(password) {
        return bcrypt.hash(password, this.config.bcryptRounds);
    }

    generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                role: user.role,
                permissions: user.permissions
            },
            this.config.jwtSecret,
            { expiresIn: this.config.jwtExpiration }
        );
    }

    async validateRequest(req, res, next) {
        try {
            const token = this.extractToken(req);
            if (!token) {
                throw new Error('No token provided');
            }

            const decoded = await this.validateToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: error.message });
        }
    }

    extractToken(req) {
        const authHeader = req.headers.authorization;
        if (!authHeader) return null;

        const [bearer, token] = authHeader.split(' ');
        return bearer === 'Bearer' ? token : null;
    }

    async checkPermission(user, requiredPermission) {
        return user.permissions.includes(requiredPermission);
    }

    async createUser(userData) {
        const { username, password, role, permissions } = userData;

        if (this.users.has(username)) {
            throw new Error('User already exists');
        }

        const hashedPassword = await this.hashPassword(password);
        const user = {
            id: username,
            password: hashedPassword,
            role,
            permissions
        };

        this.users.set(username, user);
        return { id: username, role, permissions };
    }

    async updateUser(username, updates) {
        const user = this.users.get(username);
        if (!user) {
            throw new Error('User not found');
        }

        if (updates.password) {
            updates.password = await this.hashPassword(updates.password);
        }

        const updatedUser = { ...user, ...updates };
        this.users.set(username, updatedUser);

        return {
            id: updatedUser.id,
            role: updatedUser.role,
            permissions: updatedUser.permissions
        };
    }

    async deleteUser(username) {
        if (!this.users.has(username)) {
            throw new Error('User not found');
        }

        this.users.delete(username);
    }

    getMiddleware() {
        return this.middleware;
    }

    async cleanup() {
        // Clear blacklisted tokens
        this.blacklistedTokens.clear();
    }
}

module.exports = SecurityManager; 
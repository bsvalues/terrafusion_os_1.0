/**
 * Terrafusion Market - Backend Server
 * Node.js/Express API Server with WebSocket Support
 * Squad Beta Implementation - 150 AI Agents
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// Import routes
const assessmentRoutes = require('./routes/assessment');
const authRoutes = require('./routes/auth');
const geoRoutes = require('./routes/geo');
const marketRoutes = require('./routes/market');
const contactRoutes = require('./routes/contact');
const adminRoutes = require('./routes/admin');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import services
const DatabaseService = require('./services/database');
const CacheService = require('./services/cache');
const AIService = require('./services/ai');
const WebSocketService = require('./services/websocket');

class TerraFusionServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: process.env.CLIENT_URL || "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.PORT || 3001;
        this.env = process.env.NODE_ENV || 'development';
        
        this.initializeServices();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupErrorHandling();
    }

    /**
     * Initialize core services
     */
    async initializeServices() {
        try {
            // Database
            this.db = new DatabaseService();
            await this.db.connect();
            
            // Cache
            this.cache = new CacheService();
            await this.cache.connect();
            
            // AI Service
            this.ai = new AIService();
            await this.ai.initialize();
            
            // WebSocket Service
            this.wsService = new WebSocketService(this.io);
            
            logger.info('✅ All services initialized successfully');
        } catch (error) {
            logger.error('❌ Service initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup middleware
     */
    setupMiddleware() {
        // Security
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "wss:", "ws:"]
                }
            }
        }));

        // CORS
        this.app.use(cors({
            origin: process.env.CLIENT_URL || true,
            credentials: true
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: this.env === 'production' ? 100 : 1000, // requests per window
            message: {
                error: 'Too many requests from this IP, please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
            }
        });
        this.app.use('/api', limiter);

        // Compression
        this.app.use(compression());

        // Logging
        this.app.use(morgan(this.env === 'production' ? 'combined' : 'dev'));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Static files
        this.app.use(express.static(path.join(__dirname, '../')));

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });
    }

    /**
     * Setup routes
     */
    setupRoutes() {
        // API routes
        this.app.use('/api/assessment', assessmentRoutes);
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/geo', geoRoutes);
        this.app.use('/api/market', marketRoutes);
        this.app.use('/api/contact', contactRoutes);
        this.app.use('/api/admin', authMiddleware, adminRoutes);

        // Configuration endpoint
        this.app.get('/api/config', (req, res) => {
            res.json({
                success: true,
                data: {
                    maxAssessments: parseInt(process.env.MAX_ASSESSMENTS) || 1000,
                    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT) || 300000,
                    animationSpeed: parseInt(process.env.ANIMATION_SPEED) || 1000,
                    quantumEnabled: process.env.QUANTUM_ENABLED === 'true',
                    environment: this.env,
                    version: process.env.npm_package_version || '1.0.0'
                }
            });
        });

        // Counties endpoint
        this.app.get('/api/counties', async (req, res) => {
            try {
                const counties = await this.db.getCounties();
                res.json({
                    success: true,
                    data: counties
                });
            } catch (error) {
                logger.error('Failed to fetch counties:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch counties'
                });
            }
        });

        // Serve frontend for all other routes
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../index.html'));
        });
    }

    /**
     * Setup WebSocket connections
     */
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            logger.info(`🔗 Client connected: ${socket.id}`);

            // Join assessment room
            socket.on('join_assessment', (assessmentId) => {
                socket.join(`assessment_${assessmentId}`);
                logger.info(`📊 Client ${socket.id} joined assessment ${assessmentId}`);
            });

            // Handle real-time updates
            socket.on('request_market_data', async (county) => {
                try {
                    const marketData = await this.ai.getMarketData(county);
                    socket.emit('market_data', {
                        type: 'market_data',
                        payload: marketData
                    });
                } catch (error) {
                    logger.error('Failed to get market data:', error);
                    socket.emit('error', {
                        type: 'market_data_error',
                        message: 'Failed to fetch market data'
                    });
                }
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                logger.info(`🔌 Client disconnected: ${socket.id}`);
            });
        });

        // Periodic market data broadcast
        setInterval(async () => {
            try {
                const globalMarketData = await this.ai.getGlobalMarketTrends();
                this.io.emit('market_update', {
                    type: 'market_update',
                    payload: globalMarketData
                });
            } catch (error) {
                logger.error('Failed to broadcast market data:', error);
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                code: 'NOT_FOUND'
            });
        });

        // Global error handler
        this.app.use(errorHandler);

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
            this.gracefulShutdown();
        });

        // Handle unhandled rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.gracefulShutdown();
        });

        // Handle SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            logger.info('Received SIGINT, starting graceful shutdown...');
            this.gracefulShutdown();
        });

        // Handle SIGTERM
        process.on('SIGTERM', () => {
            logger.info('Received SIGTERM, starting graceful shutdown...');
            this.gracefulShutdown();
        });
    }

    /**
     * Start the server
     */
    async start() {
        try {
            await this.initializeServices();
            
            this.server.listen(this.port, () => {
                logger.info(`🚀 Terrafusion Market server running on port ${this.port}`);
                logger.info(`🌍 Environment: ${this.env}`);
                logger.info(`📊 Health check: http://localhost:${this.port}/health`);
                
                if (this.env === 'development') {
                    logger.info(`🔗 WebSocket: ws://localhost:${this.port}`);
                    logger.info(`📱 Frontend: http://localhost:${this.port}`);
                }
            });
        } catch (error) {
            logger.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    /**
     * Graceful shutdown
     */
    async gracefulShutdown() {
        logger.info('🛑 Starting graceful shutdown...');

        // Close HTTP server
        this.server.close(async () => {
            logger.info('📡 HTTP server closed');

            try {
                // Close database connections
                if (this.db) {
                    await this.db.disconnect();
                    logger.info('🗄️ Database disconnected');
                }

                // Close cache connections
                if (this.cache) {
                    await this.cache.disconnect();
                    logger.info('💾 Cache disconnected');
                }

                // Cleanup AI service
                if (this.ai) {
                    await this.ai.cleanup();
                    logger.info('🤖 AI service cleaned up');
                }

                logger.info('✅ Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                logger.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        });

        // Force exit after 30 seconds
        setTimeout(() => {
            logger.error('⏰ Forceful shutdown after timeout');
            process.exit(1);
        }, 30000);
    }
}

// Create and start server
const server = new TerraFusionServer();

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    server.start().catch((error) => {
        logger.error('❌ Server startup failed:', error);
        process.exit(1);
    });
}

module.exports = server;
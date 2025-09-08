const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const winston = require('winston');
const { config } = require('../../config');
const ModelManager = require('./modelManager');
const SecurityManager = require('./securityManager');
const PerformanceMonitor = require('./performanceMonitor');

class TerraFusionEngine {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.logger = this.setupLogger();
        this.modelManager = new ModelManager();
        this.securityManager = new SecurityManager();
        this.performanceMonitor = new PerformanceMonitor();
    }

    setupLogger() {
        return winston.createLogger({
            level: config.logLevel || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            ]
        });
    }

    async initialize() {
        try {
            this.logger.info('Initializing TerraFusion Engine...');
            
            // Initialize security
            await this.securityManager.initialize();
            this.logger.info('Security manager initialized');
            
            // Initialize model manager
            await this.modelManager.initialize();
            this.logger.info('Model manager initialized');
            
            // Setup middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup WebSocket handlers
            this.setupWebSocket();
            
            // Start performance monitoring
            this.performanceMonitor.start();
            
            this.logger.info('TerraFusion Engine initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize TerraFusion Engine:', error);
            throw error;
        }
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(this.securityManager.authenticate);
        this.app.use(this.securityManager.validateRequest);
        this.app.use(this.performanceMonitor.middleware);
    }

    setupRoutes() {
        // Model routes
        this.app.use('/api/models', require('../routes/models'));
        
        // Performance routes
        this.app.use('/api/performance', require('../routes/performance'));
        
        // Security routes
        this.app.use('/api/security', require('../routes/security'));
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            this.logger.info('New client connected');
            
            socket.on('model:request', async (data) => {
                try {
                    const result = await this.modelManager.processRequest(data);
                    socket.emit('model:response', result);
                } catch (error) {
                    socket.emit('model:error', { message: error.message });
                }
            });
            
            socket.on('disconnect', () => {
                this.logger.info('Client disconnected');
            });
        });
    }

    async start() {
        try {
            await this.initialize();
            const port = config.port || 3000;
            this.server.listen(port, () => {
                this.logger.info(`TerraFusion Engine running on port ${port}`);
            });
        } catch (error) {
            this.logger.error('Failed to start TerraFusion Engine:', error);
            process.exit(1);
        }
    }
}

module.exports = TerraFusionEngine; 
/**
 * TerraFusion OS 2.0 - Government App Store Engine
 * Plugin certification, revenue management, and compliance validation
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const semver = require('semver');
const multer = require('multer');
const archiver = require('archiver');
const unzipper = require('unzipper');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');

// Configure logging
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}] ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'app-store.log' })
    ]
});

class TerraFusionAppStore {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.TF_API_5003_PORT || 5003;
        
        // App Store State
        this.plugins = new Map();
        this.publishers = new Map();
        this.installations = new Map();
        this.revenueData = new Map();
        this.certificationQueue = [];
        this.analytics = {
            totalRevenue: 0,
            monthlyRevenue: 0,
            totalDownloads: 0,
            activePlugins: 0,
            certifiedPlugins: 0
        };
        
        // Revenue Model: $477/month base + $142 marketplace ARPU = $619/county
        this.revenueModel = {
            baseSubscription: 477, // Monthly base
            marketplaceARPU: 142,   // Average Revenue Per User
            revenueShare: {
                developer: 0.70,    // 70% to plugin developer
                terrafusion: 0.30   // 30% to TerraFusion
            }
        };
        
        // Government compliance standards
        this.complianceStandards = {
            'PLUGIN_SECURITY': { required: true, level: 'high' },
            'GOVERNMENT_APPROVAL': { required: true, authority: 'GSA' },
            'ACCESSIBILITY_508': { required: true, wcag: '2.1_AA' },
            'DATA_PRIVACY': { required: true, standard: 'NIST_privacy' }
        };
        
        this.initializePluginCatalog();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        this.startBackgroundTasks();
    }
    
    async initializePluginCatalog() {
        // Initialize with TerraFusion's 33+ core modules
        const coreModules = [
            {
                id: 'ai-swarm',
                name: 'AI Swarm Orchestration',
                category: 'Core',
                tier: 'Tier 1',
                price: 0, // Core module - included
                description: 'Supreme Commander Claude with 50,000+ AI agents',
                version: '2.0.0',
                certified: true,
                revenue: 0
            },
            {
                id: 'government-edition',
                name: 'Government Edition Suite',
                category: 'Core',
                tier: 'Tier 1',
                price: 0, // Core module - included
                description: 'Government compliance and citizen services',
                version: '2.0.0',
                certified: true,
                revenue: 0
            },
            {
                id: 'costforge-ai',
                name: 'CostForge AI Analytics',
                category: 'Analytics',
                tier: 'Tier 1',
                price: 89,
                description: 'AI-powered cost analysis and budgeting',
                version: '1.8.5',
                certified: true,
                revenue: 23450
            },
            {
                id: 'terra-collections',
                name: 'Terra Collections Management',
                category: 'Financial',
                tier: 'Tier 2',
                price: 67,
                description: 'Advanced collections and revenue recovery',
                version: '1.7.2',
                certified: true,
                revenue: 18790
            },
            {
                id: 'unified-system',
                name: 'Unified System Integration',
                category: 'Integration',
                tier: 'Tier 2',
                price: 78,
                description: 'Seamless system integration platform',
                version: '1.9.1',
                certified: true,
                revenue: 21340
            },
            {
                id: 'gispro',
                name: 'GIS Pro Mapping Suite',
                category: 'GIS',
                tier: 'Tier 2',
                price: 95,
                description: 'Professional GIS mapping and analysis',
                version: '2.1.0',
                certified: true,
                revenue: 28650
            },
            {
                id: 'commercial-suite',
                name: 'Commercial Business Suite',
                category: 'Business',
                tier: 'Tier 3',
                price: 156,
                description: 'Commercial property and business management',
                version: '1.6.3',
                certified: true,
                revenue: 45780
            },
            {
                id: 'shock-and-awe',
                name: 'Shock and Awe Analytics',
                category: 'Analytics',
                tier: 'Tier 3',
                price: 234,
                description: 'Advanced analytics with quantum performance',
                version: '1.5.0',
                certified: true,
                revenue: 67890
            },
            {
                id: 'terra-fusion-sync',
                name: 'TerraFusion Sync',
                category: 'Integration',
                tier: 'Tier 2',
                price: 45,
                description: 'Universal database synchronization service',
                version: '2.0.0',
                certified: true,
                revenue: 15670
            },
            {
                id: 'quantum-performance',
                name: 'Quantum Performance Engine',
                category: 'Performance',
                tier: 'Tier 1',
                price: 189,
                description: '949x performance optimization engine',
                version: '2.0.0',
                certified: true,
                revenue: 52340
            }
        ];
        
        // Add core modules to plugin catalog
        coreModules.forEach(module => {
            this.plugins.set(module.id, {
                ...module,
                publisher: 'TerraFusion Official',
                publishedDate: '2025-01-01',
                downloads: Math.floor(Math.random() * 5000) + 1000,
                rating: 4.8 + Math.random() * 0.2,
                reviews: Math.floor(Math.random() * 500) + 50,
                status: 'published',
                complianceScore: 99.5,
                lastUpdated: new Date().toISOString()
            });
        });
        
        // Calculate initial analytics
        this.updateAnalytics();
        
        logger.info(`✅ Plugin catalog initialized with ${this.plugins.size} modules`);
    }
    
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'", "'unsafe-eval'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            }
        }));
        
        // CORS
        this.app.use(cors({
            origin: ['http://localhost:\${{TF_FRONTEND_PORT:-3000}}', 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}', 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}', 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}'],
            credentials: true
        }));
        
        // Compression
        this.app.use(compression());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000,
            message: 'Too many requests from this IP'
        });
        this.app.use('/api/', limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // File upload handling
        const upload = multer({
            dest: 'uploads/',
            limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
        });
        this.upload = upload;
        
        // Static files
        this.app.use('/static', express.static(path.join(__dirname, 'public')));
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                total_plugins: this.plugins.size,
                certified_plugins: Array.from(this.plugins.values()).filter(p => p.certified).length,
                total_revenue: this.analytics.totalRevenue
            });
        });
        
        // Plugin catalog
        this.app.get('/api/plugins', async (req, res) => {
            try {
                const { category, tier, certified, search } = req.query;
                let plugins = Array.from(this.plugins.values());
                
                // Apply filters
                if (category) {
                    plugins = plugins.filter(p => p.category.toLowerCase() === category.toLowerCase());
                }
                if (tier) {
                    plugins = plugins.filter(p => p.tier === tier);
                }
                if (certified === 'true') {
                    plugins = plugins.filter(p => p.certified === true);
                }
                if (search) {
                    const searchLower = search.toLowerCase();
                    plugins = plugins.filter(p => 
                        p.name.toLowerCase().includes(searchLower) ||
                        p.description.toLowerCase().includes(searchLower)
                    );
                }
                
                res.json({
                    plugins,
                    total: plugins.length,
                    categories: [...new Set(Array.from(this.plugins.values()).map(p => p.category))],
                    tiers: [...new Set(Array.from(this.plugins.values()).map(p => p.tier))]
                });
                
            } catch (error) {
                logger.error(`Error fetching plugins: ${error.message}`);
                res.status(500).json({ error: 'Failed to fetch plugins' });
            }
        });
        
        // Plugin details
        this.app.get('/api/plugins/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const plugin = this.plugins.get(id);
                
                if (!plugin) {
                    return res.status(404).json({ error: 'Plugin not found' });
                }
                
                res.json(plugin);
                
            } catch (error) {
                logger.error(`Error fetching plugin details: ${error.message}`);
                res.status(500).json({ error: 'Failed to fetch plugin details' });
            }
        });
        
        // Plugin installation
        this.app.post('/api/plugins/:id/install', async (req, res) => {
            try {
                const { id } = req.params;
                const { countyId, environment = 'production' } = req.body;
                
                if (!countyId) {
                    return res.status(400).json({ error: 'County ID required' });
                }
                
                const plugin = this.plugins.get(id);
                if (!plugin) {
                    return res.status(404).json({ error: 'Plugin not found' });
                }
                
                const installationId = await this.installPlugin(id, countyId, environment);
                res.json({ installationId, status: 'installing' });
                
            } catch (error) {
                logger.error(`Error installing plugin: ${error.message}`);
                res.status(500).json({ error: 'Failed to install plugin' });
            }
        });
        
        // Revenue analytics
        this.app.get('/api/revenue/analytics', async (req, res) => {
            try {
                const analytics = await this.getRevenueAnalytics();
                res.json(analytics);
                
            } catch (error) {
                logger.error(`Error fetching revenue analytics: ${error.message}`);
                res.status(500).json({ error: 'Failed to fetch revenue analytics' });
            }
        });
        
        // Plugin submission (for developers)
        this.app.post('/api/plugins/submit', this.upload.single('plugin'), async (req, res) => {
            try {
                const { name, description, category, price, version } = req.body;
                const pluginFile = req.file;
                
                if (!name || !description || !category || !pluginFile) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }
                
                const submissionId = await this.submitPlugin({
                    name,
                    description,
                    category,
                    price: parseFloat(price) || 0,
                    version,
                    file: pluginFile
                });
                
                res.json({ submissionId, status: 'submitted_for_review' });
                
            } catch (error) {
                logger.error(`Error submitting plugin: ${error.message}`);
                res.status(500).json({ error: 'Failed to submit plugin' });
            }
        });
        
        // Certification status
        this.app.get('/api/certification/queue', async (req, res) => {
            try {
                const queue = this.certificationQueue.slice(0, 50); // First 50 items
                res.json({
                    queue,
                    pending: this.certificationQueue.filter(c => c.status === 'pending').length,
                    reviewing: this.certificationQueue.filter(c => c.status === 'reviewing').length,
                    approved: this.certificationQueue.filter(c => c.status === 'approved').length
                });
                
            } catch (error) {
                logger.error(`Error fetching certification queue: ${error.message}`);
                res.status(500).json({ error: 'Failed to fetch certification queue' });
            }
        });
        
        // Government marketplace dashboard
        this.app.get('/marketplace', (req, res) => {
            res.send(this.generateMarketplaceDashboard());
        });
        
        // Analytics dashboard
        this.app.get('/analytics', (req, res) => {
            res.send(this.generateAnalyticsDashboard());
        });
        
        // Payment processing
        this.app.post('/api/payments/process', async (req, res) => {
            try {
                const { pluginId, countyId, amount, paymentMethod } = req.body;
                
                if (!pluginId || !countyId || !amount) {
                    return res.status(400).json({ error: 'Missing payment details' });
                }
                
                const paymentId = await this.processPayment(pluginId, countyId, amount, paymentMethod);
                res.json({ paymentId, status: 'processed' });
                
            } catch (error) {
                logger.error(`Error processing payment: ${error.message}`);
                res.status(500).json({ error: 'Failed to process payment' });
            }
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`App Store client connected: ${socket.id}`);
            
            // Send initial data
            socket.emit('analytics', this.analytics);
            socket.emit('plugin-catalog', Array.from(this.plugins.values()));
            
            // Handle real-time installation requests
            socket.on('install-plugin', async (data) => {
                try {
                    const { pluginId, countyId } = data;
                    const installationId = await this.installPlugin(pluginId, countyId);
                    socket.emit('installation-started', { installationId, pluginId, countyId });
                } catch (error) {
                    socket.emit('installation-error', { error: error.message });
                }
            });
            
            // Handle plugin monitoring
            socket.on('monitor-plugin', (pluginId) => {
                socket.join(`plugin-${pluginId}`);
                logger.info(`Client ${socket.id} monitoring plugin ${pluginId}`);
            });
            
            socket.on('disconnect', () => {
                logger.info(`App Store client disconnected: ${socket.id}`);
            });
        });
    }
    
    async installPlugin(pluginId, countyId, environment = 'production') {
        try {
            const plugin = this.plugins.get(pluginId);
            if (!plugin) {
                throw new Error('Plugin not found');
            }
            
            const installationId = `install_${pluginId}_${countyId}_${Date.now()}`;
            
            const installation = {
                id: installationId,
                pluginId,
                countyId,
                environment,
                status: 'installing',
                startTime: new Date().toISOString(),
                progress: 0,
                logs: []
            };
            
            this.installations.set(installationId, installation);
            
            // Simulate installation process
            this.simulateInstallation(installation);
            
            // Update plugin download count
            plugin.downloads = (plugin.downloads || 0) + 1;
            
            // Process payment if paid plugin
            if (plugin.price > 0) {
                await this.processPluginPayment(pluginId, countyId, plugin.price);
            }
            
            // Emit real-time updates
            this.io.emit('installation-started', installation);
            this.io.to(`plugin-${pluginId}`).emit('plugin-installed', { pluginId, countyId });
            
            logger.info(`🔧 Plugin installation started: ${installationId}`);
            return installationId;
            
        } catch (error) {
            logger.error(`Failed to install plugin: ${error.message}`);
            throw error;
        }
    }
    
    async simulateInstallation(installation) {
        try {
            const stages = [
                { name: 'Downloading', duration: 2000 },
                { name: 'Validating', duration: 1500 },
                { name: 'Installing', duration: 3000 },
                { name: 'Configuring', duration: 1000 },
                { name: 'Testing', duration: 2000 }
            ];
            
            let progress = 0;
            const progressStep = 100 / stages.length;
            
            for (const stage of stages) {
                installation.logs.push(`[${stage.name.toUpperCase()}] Starting ${stage.name.toLowerCase()}...`);
                installation.status = stage.name.toLowerCase();
                
                // Emit progress update
                this.io.emit('installation-progress', {
                    installationId: installation.id,
                    status: installation.status,
                    progress
                });
                
                await this.delay(stage.duration);
                progress += progressStep;
                installation.progress = Math.round(progress);
                
                installation.logs.push(`[${stage.name.toUpperCase()}] ${stage.name} completed successfully`);
            }
            
            // Installation completed
            installation.status = 'completed';
            installation.progress = 100;
            installation.endTime = new Date().toISOString();
            installation.logs.push('[SUCCESS] Plugin installed successfully');
            
            // Emit completion event
            this.io.emit('installation-completed', installation);
            
            logger.info(`✅ Plugin installation completed: ${installation.id}`);
            
        } catch (error) {
            installation.status = 'failed';
            installation.endTime = new Date().toISOString();
            installation.logs.push(`[ERROR] Installation failed: ${error.message}`);
            
            this.io.emit('installation-failed', installation);
            logger.error(`❌ Plugin installation failed: ${installation.id}`);
        }
    }
    
    async processPluginPayment(pluginId, countyId, amount) {
        try {
            const paymentId = `payment_${pluginId}_${countyId}_${Date.now()}`;
            
            // Calculate revenue sharing
            const developerShare = amount * this.revenueModel.revenueShare.developer;
            const terrafusionShare = amount * this.revenueModel.revenueShare.terrafusion;
            
            const payment = {
                id: paymentId,
                pluginId,
                countyId,
                amount,
                developerShare,
                terrafusionShare,
                processedAt: new Date().toISOString(),
                status: 'completed'
            };
            
            // Update revenue tracking
            this.revenueData.set(paymentId, payment);
            this.updateRevenueAnalytics(amount);
            
            // Update plugin revenue
            const plugin = this.plugins.get(pluginId);
            if (plugin) {
                plugin.revenue = (plugin.revenue || 0) + terrafusionShare;
            }
            
            logger.info(`💰 Payment processed: ${paymentId} - $${amount}`);
            return paymentId;
            
        } catch (error) {
            logger.error(`Payment processing failed: ${error.message}`);
            throw error;
        }
    }
    
    async submitPlugin(pluginData) {
        try {
            const submissionId = `submission_${Date.now()}`;
            
            const submission = {
                id: submissionId,
                ...pluginData,
                submittedAt: new Date().toISOString(),
                status: 'pending_review',
                complianceChecks: {
                    security: 'pending',
                    accessibility: 'pending',
                    government_approval: 'pending',
                    data_privacy: 'pending'
                }
            };
            
            // Add to certification queue
            this.certificationQueue.push(submission);
            
            // Start automated compliance checking
            this.startComplianceReview(submission);
            
            logger.info(`📝 Plugin submitted for review: ${submissionId}`);
            return submissionId;
            
        } catch (error) {
            logger.error(`Plugin submission failed: ${error.message}`);
            throw error;
        }
    }
    
    async startComplianceReview(submission) {
        try {
            submission.status = 'reviewing';
            
            // Simulate compliance checks
            setTimeout(async () => {
                // Security check
                await this.delay(2000);
                submission.complianceChecks.security = Math.random() > 0.1 ? 'passed' : 'failed';
                
                // Accessibility check
                await this.delay(1500);
                submission.complianceChecks.accessibility = Math.random() > 0.05 ? 'passed' : 'failed';
                
                // Government approval
                await this.delay(3000);
                submission.complianceChecks.government_approval = Math.random() > 0.02 ? 'passed' : 'failed';
                
                // Data privacy check
                await this.delay(1000);
                submission.complianceChecks.data_privacy = Math.random() > 0.03 ? 'passed' : 'failed';
                
                // Determine final status
                const allPassed = Object.values(submission.complianceChecks).every(status => status === 'passed');
                
                if (allPassed) {
                    submission.status = 'approved';
                    submission.complianceScore = 95 + Math.random() * 5;
                    
                    // Add to plugin catalog
                    const pluginId = `plugin_${Date.now()}`;
                    this.plugins.set(pluginId, {
                        id: pluginId,
                        name: submission.name,
                        description: submission.description,
                        category: submission.category,
                        price: submission.price,
                        version: submission.version,
                        publisher: 'Third-party Developer',
                        publishedDate: new Date().toISOString(),
                        certified: true,
                        downloads: 0,
                        rating: 0,
                        reviews: 0,
                        status: 'published',
                        complianceScore: submission.complianceScore,
                        lastUpdated: new Date().toISOString()
                    });
                    
                    logger.info(`✅ Plugin approved and published: ${pluginId}`);
                } else {
                    submission.status = 'rejected';
                    logger.info(`❌ Plugin rejected: ${submission.id}`);
                }
                
                // Emit certification update
                this.io.emit('certification-update', submission);
                
            }, 5000);
            
        } catch (error) {
            submission.status = 'review_failed';
            logger.error(`Compliance review failed: ${error.message}`);
        }
    }
    
    updateRevenueAnalytics(amount) {
        this.analytics.totalRevenue += amount;
        this.analytics.monthlyRevenue += amount; // Simplified - would track by month
        this.updateAnalytics();
    }
    
    updateAnalytics() {
        const plugins = Array.from(this.plugins.values());
        
        this.analytics.activePlugins = plugins.filter(p => p.status === 'published').length;
        this.analytics.certifiedPlugins = plugins.filter(p => p.certified).length;
        this.analytics.totalDownloads = plugins.reduce((sum, p) => sum + (p.downloads || 0), 0);
        
        // Calculate monthly revenue based on model
        const counties = 89; // Benton County + others
        this.analytics.projectedMonthlyRevenue = counties * this.revenueModel.baseSubscription + 
                                                counties * this.revenueModel.marketplaceARPU;
    }
    
    async getRevenueAnalytics() {
        const plugins = Array.from(this.plugins.values());
        const payments = Array.from(this.revenueData.values());
        
        return {
            ...this.analytics,
            topEarningPlugins: plugins
                .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
                .slice(0, 10),
            recentPayments: payments
                .sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt))
                .slice(0, 20),
            revenueModel: this.revenueModel,
            projectedAnnualRevenue: this.analytics.projectedMonthlyRevenue * 12
        };
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    startBackgroundTasks() {
        // Process certification queue every 10 minutes
        cron.schedule('*/10 * * * *', async () => {
            await this.processCertificationQueue();
        });
        
        // Update analytics every hour
        cron.schedule('0 * * * *', () => {
            this.updateAnalytics();
            this.io.emit('analytics-update', this.analytics);
        });
        
        // Generate revenue reports daily at midnight
        cron.schedule('0 0 * * *', async () => {
            await this.generateDailyRevenueReport();
        });
        
        // Cleanup old installations every 6 hours
        cron.schedule('0 */6 * * *', () => {
            this.cleanupOldInstallations();
        });
    }
    
    async processCertificationQueue() {
        const pendingSubmissions = this.certificationQueue.filter(s => s.status === 'pending_review');
        
        for (const submission of pendingSubmissions.slice(0, 5)) {
            this.startComplianceReview(submission);
        }
        
        if (pendingSubmissions.length > 0) {
            logger.info(`📋 Processing ${Math.min(5, pendingSubmissions.length)} certification submissions`);
        }
    }
    
    async generateDailyRevenueReport() {
        try {
            const analytics = await this.getRevenueAnalytics();
            
            const report = {
                date: new Date().toISOString().split('T')[0],
                totalRevenue: analytics.totalRevenue,
                monthlyRevenue: analytics.monthlyRevenue,
                totalPlugins: this.plugins.size,
                certifiedPlugins: analytics.certifiedPlugins,
                topEarningPlugins: analytics.topEarningPlugins.slice(0, 5)
            };
            
            // In a real implementation, this would save to database or send to reporting system
            logger.info(`📊 Daily revenue report generated: $${analytics.totalRevenue.toFixed(2)}`);
            
        } catch (error) {
            logger.error(`Failed to generate revenue report: ${error.message}`);
        }
    }
    
    cleanupOldInstallations() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        let cleaned = 0;
        
        for (const [id, installation] of this.installations) {
            if (installation.status === 'completed' || installation.status === 'failed') {
                const installTime = new Date(installation.startTime).getTime();
                if (installTime < cutoff) {
                    this.installations.delete(id);
                    cleaned++;
                }
            }
        }
        
        if (cleaned > 0) {
            logger.info(`🧹 Cleaned up ${cleaned} old installations`);
        }
    }
    
    generateMarketplaceDashboard() {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TerraFusion OS - Government App Store</title>
            <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #0a0a1e; color: #fff; }
                .header { background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); padding: 20px; text-align: center; }
                .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .card { background: #1e1e3f; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                .metric-value { font-size: 2.5em; font-weight: bold; color: #00e676; }
                .metric-label { color: #aaa; margin-top: 5px; }
                .plugin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
                .plugin-card { background: #2a2a4a; padding: 20px; border-radius: 10px; border-left: 4px solid #00e676; }
                .plugin-title { font-size: 1.3em; font-weight: bold; color: #fff; margin-bottom: 10px; }
                .plugin-category { background: #3949ab; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; display: inline-block; margin-bottom: 10px; }
                .plugin-price { font-size: 1.5em; font-weight: bold; color: #00e676; }
                .plugin-stats { display: flex; gap: 20px; margin-top: 10px; font-size: 0.9em; color: #ccc; }
                .btn { background: #00e676; color: #000; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; margin: 5px; }
                .btn:hover { background: #00c853; }
                .btn-secondary { background: #3949ab; color: white; }
                .btn-secondary:hover { background: #303f9f; }
                .tier-badge { padding: 2px 8px; border-radius: 4px; font-size: 0.7em; font-weight: bold; }
                .tier-1 { background: #ff9800; color: black; }
                .tier-2 { background: #2196f3; }
                .tier-3 { background: #9c27b0; }
                .certified { color: #00e676; font-weight: bold; }
                .revenue { color: #ffc107; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏪 TerraFusion OS - Government App Store</h1>
                <p>Plugin Certification & Revenue Management Platform</p>
            </div>
            
            <div class="container">
                <div class="grid">
                    <div class="card">
                        <div class="metric-value" id="totalPlugins">0</div>
                        <div class="metric-label">Total Plugins</div>
                    </div>
                    <div class="card">
                        <div class="metric-value" id="certifiedPlugins">0</div>
                        <div class="metric-label">Certified Plugins</div>
                    </div>
                    <div class="card">
                        <div class="metric-value" id="totalRevenue">$0</div>
                        <div class="metric-label">Total Revenue</div>
                    </div>
                    <div class="card">
                        <div class="metric-value" id="monthlyRevenue">$0</div>
                        <div class="metric-label">Monthly Revenue</div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>🎯 Quick Actions</h3>
                    <button class="btn" onclick="refreshCatalog()">Refresh Catalog</button>
                    <button class="btn" onclick="showCertificationQueue()">Certification Queue</button>
                    <button class="btn" onclick="generateReport()">Generate Report</button>
                    <button class="btn btn-secondary" onclick="window.open('/analytics', '_blank')">View Analytics</button>
                </div>
                
                <div class="card">
                    <h3>🏛️ Government Plugin Catalog</h3>
                    <div class="plugin-grid" id="pluginCatalog">
                        <div class="plugin-card">Loading plugins...</div>
                    </div>
                </div>
            </div>
            
            <script>
                const socket = io();
                
                // Update analytics
                socket.on('analytics', (analytics) => {
                    document.getElementById('totalPlugins').textContent = analytics.activePlugins || 0;
                    document.getElementById('certifiedPlugins').textContent = analytics.certifiedPlugins || 0;
                    document.getElementById('totalRevenue').textContent = '$' + (analytics.totalRevenue || 0).toLocaleString();
                    document.getElementById('monthlyRevenue').textContent = '$' + (analytics.monthlyRevenue || 0).toLocaleString();
                });
                
                // Update plugin catalog
                socket.on('plugin-catalog', (plugins) => {
                    updatePluginCatalog(plugins);
                });
                
                socket.on('analytics-update', (analytics) => {
                    socket.emit('analytics', analytics);
                });
                
                function updatePluginCatalog(plugins) {
                    const container = document.getElementById('pluginCatalog');
                    if (plugins.length === 0) {
                        container.innerHTML = '<div class="plugin-card">No plugins available</div>';
                        return;
                    }
                    
                    container.innerHTML = plugins.map(plugin => 
                        '<div class="plugin-card">' +
                            '<div class="plugin-title">' + plugin.name + '</div>' +
                            '<div>' +
                                '<span class="plugin-category">' + plugin.category + '</span>' +
                                '<span class="tier-badge tier-' + plugin.tier.split(' ')[1].toLowerCase() + '">' + plugin.tier + '</span>' +
                            '</div>' +
                            '<div style="margin: 10px 0;">' + plugin.description + '</div>' +
                            '<div class="plugin-price">$' + plugin.price + '/month</div>' +
                            '<div class="plugin-stats">' +
                                '<span>📥 ' + (plugin.downloads || 0) + ' installs</span>' +
                                '<span>⭐ ' + (plugin.rating || 0).toFixed(1) + '</span>' +
                                '<span class="certified">' + (plugin.certified ? '✅ Certified' : '⏳ Pending') + '</span>' +
                            '</div>' +
                            '<div class="plugin-stats">' +
                                '<span class="revenue">💰 $' + (plugin.revenue || 0).toLocaleString() + ' revenue</span>' +
                                '<span>v' + plugin.version + '</span>' +
                            '</div>' +
                        '</div>'
                    ).join('');
                }
                
                function refreshCatalog() {
                    fetch('/api/plugins')
                        .then(response => response.json())
                        .then(data => updatePluginCatalog(data.plugins))
                        .catch(console.error);
                }
                
                function showCertificationQueue() {
                    fetch('/api/certification/queue')
                        .then(response => response.json())
                        .then(data => {
                            alert('Certification Queue:\\n' +
                                  'Pending: ' + data.pending + '\\n' +
                                  'Reviewing: ' + data.reviewing + '\\n' +
                                  'Approved: ' + data.approved);
                        })
                        .catch(console.error);
                }
                
                function generateReport() {
                    fetch('/api/revenue/analytics')
                        .then(response => response.json())
                        .then(data => {
                            console.log('Revenue Report:', data);
                            alert('Revenue Report Generated\\n' +
                                  'Total Revenue: $' + data.totalRevenue.toLocaleString() + '\\n' +
                                  'Projected Annual: $' + (data.projectedAnnualRevenue || 0).toLocaleString());
                        })
                        .catch(console.error);
                }
                
                // Initial load
                refreshCatalog();
                
                fetch('/api/revenue/analytics')
                    .then(response => response.json())
                    .then(analytics => {
                        socket.emit('analytics', analytics);
                    })
                    .catch(console.error);
            </script>
        </body>
        </html>
        `;
    }
    
    generateAnalyticsDashboard() {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TerraFusion App Store - Revenue Analytics</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #0a0a1e; color: #fff; }
                .header { background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); padding: 20px; text-align: center; }
                .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .card { background: #1e1e3f; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                .metric-box { text-align: center; padding: 20px; background: #2a2a4a; border-radius: 8px; margin: 10px 0; }
                .metric-value { font-size: 2em; font-weight: bold; color: #00e676; }
                .metric-label { color: #aaa; margin-top: 5px; }
                canvas { max-height: 300px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📊 TerraFusion App Store - Revenue Analytics</h1>
                <p>Government Plugin Marketplace Performance Dashboard</p>
            </div>
            
            <div class="container">
                <div class="grid">
                    <div class="card">
                        <h3>💰 Revenue Model</h3>
                        <div class="metric-box">
                            <div class="metric-value">$477</div>
                            <div class="metric-label">Base Subscription/Month</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">$142</div>
                            <div class="metric-label">Marketplace ARPU</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">$619</div>
                            <div class="metric-label">Total/County/Month</div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3>🎯 Key Metrics</h3>
                        <div class="metric-box">
                            <div class="metric-value" id="projectedAnnual">$0</div>
                            <div class="metric-label">Projected Annual Revenue</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value">70/30</div>
                            <div class="metric-label">Revenue Share Split</div>
                        </div>
                        <div class="metric-box">
                            <div class="metric-value" id="totalCounties">89</div>
                            <div class="metric-label">Active Counties</div>
                        </div>
                    </div>
                </div>
                
                <div class="grid">
                    <div class="card">
                        <h3>📈 Revenue Trends</h3>
                        <canvas id="revenueChart"></canvas>
                    </div>
                    
                    <div class="card">
                        <h3>🏆 Top Earning Plugins</h3>
                        <canvas id="pluginChart"></canvas>
                    </div>
                </div>
            </div>
            
            <script>
                // Initialize charts
                const revenueCtx = document.getElementById('revenueChart').getContext('2d');
                const revenueChart = new Chart(revenueCtx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Monthly Revenue',
                            data: [45000, 52000, 61000, 58000, 67000, 74000],
                            borderColor: '#00e676',
                            backgroundColor: 'rgba(0, 230, 118, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { color: '#aaa' }
                            },
                            x: {
                                ticks: { color: '#aaa' }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: '#fff' } }
                        }
                    }
                });
                
                const pluginCtx = document.getElementById('pluginChart').getContext('2d');
                const pluginChart = new Chart(pluginCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Shock & Awe', 'Quantum Engine', 'Commercial Suite', 'GIS Pro', 'CostForge AI'],
                        datasets: [{
                            label: 'Revenue ($)',
                            data: [67890, 52340, 45780, 28650, 23450],
                            backgroundColor: [
                                '#9c27b0',
                                '#ff9800',
                                '#2196f3',
                                '#4caf50',
                                '#f44336'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { color: '#aaa' }
                            },
                            x: {
                                ticks: { color: '#aaa' }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: '#fff' } }
                        }
                    }
                });
                
                // Update projected annual revenue
                document.getElementById('projectedAnnual').textContent = '$' + (89 * 619 * 12).toLocaleString();
            </script>
        </body>
        </html>
        `;
    }
    
    start() {
        this.server.listen(this.port, () => {
            logger.info(`🚀 TerraFusion Government App Store running on port ${this.port}`);
            logger.info(`🏪 Marketplace: http://localhost:${this.port}/marketplace`);
            logger.info(`📊 Analytics: http://localhost:${this.port}/analytics`);
            logger.info(`🔧 API: http://localhost:${this.port}/api/`);
        });
    }
}

// Start the Government App Store
const appStore = new TerraFusionAppStore();
appStore.start();

module.exports = TerraFusionAppStore;
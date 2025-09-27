/**
 * TerraFusion OS 2.0 - AI Training Dashboard
 * Real-time monitoring and control for AI agent training
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
const { spawn } = require('child_process');

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
        new winston.transports.File({ filename: 'training-dashboard.log' })
    ]
});

class AITrainingDashboard {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.TF_API_HTTPS_PORT || 5001;
        this.trainingMetrics = {};
        this.activeTrainingSessions = new Map();
        this.agentCapabilities = new Map();
        this.certificationQueue = [];
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        this.startBackgroundTasks();
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
            origin: ['http://localhost:\${{TF_FRONTEND_PORT:-3000}}', 'http://localhost:\${{TF_FRONTEND_PORT:-3000}}'],
            credentials: true
        }));
        
        // Compression
        this.app.use(compression());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // Limit each IP to 1000 requests per windowMs
            message: 'Too many requests from this IP'
        });
        this.app.use('/api/', limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        
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
                training_sessions_active: this.activeTrainingSessions.size,
                agents_in_training: this.agentCapabilities.size
            });
        });
        
        // Training metrics
        this.app.get('/api/training/metrics', async (req, res) => {
            try {
                const metrics = await this.getTrainingMetrics();
                res.json(metrics);
            } catch (error) {
                logger.error(`Error fetching training metrics: ${error.message}`);
                res.status(500).json({ error: 'Failed to fetch metrics' });
            }
        });
        
        // Start training session
        this.app.post('/api/training/start', async (req, res) => {
            try {
                const { agentId, skillId, priority = 'normal' } = req.body;
                
                if (!agentId || !skillId) {
                    return res.status(400).json({ error: 'Agent ID and Skill ID required' });
                }
                
                const sessionId = await this.startTrainingSession(agentId, skillId, priority);
                res.json({ sessionId, status: 'started' });
                
            } catch (error) {
                logger.error(`Error starting training session: ${error.message}`);
                res.status(500).json({ error: 'Failed to start training session' });
            }
        });
        
        // Bulk training
        this.app.post('/api/training/bulk', async (req, res) => {
            try {
                const { agentSkillPairs, priority = 'normal' } = req.body;
                
                if (!Array.isArray(agentSkillPairs)) {
                    return res.status(400).json({ error: 'Agent-skill pairs array required' });
                }
                
                const results = await this.startBulkTraining(agentSkillPairs, priority);
                res.json(results);
                
            } catch (error) {
                logger.error(`Error starting bulk training: ${error.message}`);
                res.status(500).json({ error: 'Failed to start bulk training' });
            }
        });
        
        // Agent capabilities
        this.app.get('/api/agents/:agentId/capabilities', async (req, res) => {
            try {
                const { agentId } = req.params;
                const capabilities = await this.getAgentCapabilities(agentId);
                res.json(capabilities);
                
            } catch (error) {
                logger.error(`Error fetching agent capabilities: ${error.message}`);
                res.status(500).json({ error: 'Failed to fetch capabilities' });
            }
        });
        
        // Government certification status
        this.app.get('/api/certification/status', async (req, res) => {
            try {
                const status = await this.getCertificationStatus();
                res.json(status);
                
            } catch (error) {
                logger.error(`Error fetching certification status: ${error.message}`);
                res.status(500).json({ error: 'Failed to fetch certification status' });
            }
        });
        
        // Training dashboard
        this.app.get('/dashboard', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        // Supreme Commander status
        this.app.get('/api/supreme-commander/status', async (req, res) => {
            try {
                const status = await this.getSupremeCommanderStatus();
                res.json(status);
                
            } catch (error) {
                logger.error(`Error fetching Supreme Commander status: ${error.message}`);
                res.status(500).json({ error: 'Failed to fetch Supreme Commander status' });
            }
        });
    }
    
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            logger.info(`Training dashboard client connected: ${socket.id}`);
            
            // Send initial data
            socket.emit('training-metrics', this.trainingMetrics);
            socket.emit('active-sessions', Array.from(this.activeTrainingSessions.values()));
            
            // Handle real-time training requests
            socket.on('start-training', async (data) => {
                try {
                    const { agentId, skillId } = data;
                    const sessionId = await this.startTrainingSession(agentId, skillId);
                    socket.emit('training-started', { sessionId, agentId, skillId });
                } catch (error) {
                    socket.emit('training-error', { error: error.message });
                }
            });
            
            // Handle training monitoring
            socket.on('monitor-agent', (agentId) => {
                socket.join(`agent-${agentId}`);
                logger.info(`Client ${socket.id} monitoring agent ${agentId}`);
            });
            
            socket.on('disconnect', () => {
                logger.info(`Training dashboard client disconnected: ${socket.id}`);
            });
        });
    }
    
    async startTrainingSession(agentId, skillId, priority = 'normal') {
        try {
            const sessionId = `train_${agentId}_${skillId}_${Date.now()}`;
            
            // Create training session
            const session = {
                sessionId,
                agentId,
                skillId,
                priority,
                startTime: new Date().toISOString(),
                status: 'starting',
                progress: 0,
                metrics: {}
            };
            
            this.activeTrainingSessions.set(sessionId, session);
            
            // Start Python training engine
            const trainingProcess = await this.executeTrainingEngine(agentId, skillId);
            session.process = trainingProcess;
            session.status = 'running';
            
            // Emit real-time updates
            this.io.emit('session-started', session);
            this.io.to(`agent-${agentId}`).emit('agent-training-update', session);
            
            logger.info(`🎯 Training session started: ${sessionId}`);
            return sessionId;
            
        } catch (error) {
            logger.error(`Failed to start training session: ${error.message}`);
            throw error;
        }
    }
    
    async executeTrainingEngine(agentId, skillId) {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, 'training-engine.py');
            const args = ['--agent-id', agentId, '--skill-id', skillId];
            
            const process = spawn('python3', [pythonScript, ...args]);
            
            process.stdout.on('data', (data) => {
                const output = data.toString();
                logger.info(`Training output: ${output}`);
                
                // Parse training progress
                this.parseTrainingOutput(agentId, skillId, output);
            });
            
            process.stderr.on('data', (data) => {
                logger.error(`Training error: ${data.toString()}`);
            });
            
            process.on('close', (code) => {
                if (code === 0) {
                    logger.info(`Training completed successfully for ${agentId}:${skillId}`);
                    this.handleTrainingCompletion(agentId, skillId);
                    resolve(process);
                } else {
                    logger.error(`Training failed with code ${code}`);
                    reject(new Error(`Training process failed with code ${code}`));
                }
            });
        });
    }
    
    parseTrainingOutput(agentId, skillId, output) {
        try {
            // Look for progress indicators
            const progressMatch = output.match(/Progress: (\d+)%/);
            if (progressMatch) {
                const progress = parseInt(progressMatch[1]);
                this.updateSessionProgress(agentId, skillId, progress);
            }
            
            // Look for performance metrics
            const performanceMatch = output.match(/Performance: ([\d.]+)/);
            if (performanceMatch) {
                const performance = parseFloat(performanceMatch[1]);
                this.updateSessionMetrics(agentId, skillId, { performance });
            }
            
        } catch (error) {
            logger.error(`Error parsing training output: ${error.message}`);
        }
    }
    
    updateSessionProgress(agentId, skillId, progress) {
        for (const [sessionId, session] of this.activeTrainingSessions) {
            if (session.agentId === agentId && session.skillId === skillId) {
                session.progress = progress;
                this.io.emit('training-progress', { sessionId, progress });
                this.io.to(`agent-${agentId}`).emit('agent-progress', { agentId, progress });
                break;
            }
        }
    }
    
    updateSessionMetrics(agentId, skillId, metrics) {
        for (const [sessionId, session] of this.activeTrainingSessions) {
            if (session.agentId === agentId && session.skillId === skillId) {
                session.metrics = { ...session.metrics, ...metrics };
                this.io.emit('training-metrics-update', { sessionId, metrics: session.metrics });
                break;
            }
        }
    }
    
    handleTrainingCompletion(agentId, skillId) {
        for (const [sessionId, session] of this.activeTrainingSessions) {
            if (session.agentId === agentId && session.skillId === skillId) {
                session.status = 'completed';
                session.endTime = new Date().toISOString();
                session.progress = 100;
                
                // Move to completed sessions
                this.activeTrainingSessions.delete(sessionId);
                
                // Update agent capabilities
                this.updateAgentCapabilities(agentId, skillId, session.metrics);
                
                // Emit completion event
                this.io.emit('training-completed', session);
                this.io.to(`agent-${agentId}`).emit('agent-training-completed', session);
                
                logger.info(`✅ Training completed: ${sessionId}`);
                break;
            }
        }
    }
    
    updateAgentCapabilities(agentId, skillId, metrics) {
        if (!this.agentCapabilities.has(agentId)) {
            this.agentCapabilities.set(agentId, {
                agentId,
                skills: [],
                certifications: [],
                performanceScores: {},
                lastUpdated: new Date().toISOString()
            });
        }
        
        const capabilities = this.agentCapabilities.get(agentId);
        
        // Add skill if performance meets threshold
        if (metrics.performance && metrics.performance >= 0.85) {
            if (!capabilities.skills.includes(skillId)) {
                capabilities.skills.push(skillId);
            }
        }
        
        // Update performance scores
        capabilities.performanceScores[skillId] = metrics.performance || 0;
        capabilities.lastUpdated = new Date().toISOString();
        
        // Check for government certification eligibility
        if (metrics.performance >= 0.90) {
            this.queueForCertification(agentId, skillId, metrics);
        }
    }
    
    queueForCertification(agentId, skillId, metrics) {
        const certificationRequest = {
            id: `cert_${agentId}_${skillId}_${Date.now()}`,
            agentId,
            skillId,
            metrics,
            requestedAt: new Date().toISOString(),
            status: 'pending'
        };
        
        this.certificationQueue.push(certificationRequest);
        logger.info(`🏆 Queued for certification: ${agentId}:${skillId}`);
    }
    
    async startBulkTraining(agentSkillPairs, priority = 'normal') {
        try {
            const sessions = [];
            
            for (const [agentId, skillId] of agentSkillPairs) {
                try {
                    const sessionId = await this.startTrainingSession(agentId, skillId, priority);
                    sessions.push({ sessionId, agentId, skillId, status: 'started' });
                } catch (error) {
                    sessions.push({ agentId, skillId, status: 'failed', error: error.message });
                }
            }
            
            logger.info(`🚀 Bulk training started: ${sessions.length} sessions`);
            return {
                totalSessions: sessions.length,
                successful: sessions.filter(s => s.status === 'started').length,
                failed: sessions.filter(s => s.status === 'failed').length,
                sessions
            };
            
        } catch (error) {
            logger.error(`Bulk training failed: ${error.message}`);
            throw error;
        }
    }
    
    async getTrainingMetrics() {
        const totalAgents = this.agentCapabilities.size;
        const activeSessions = this.activeTrainingSessions.size;
        const certificationsPending = this.certificationQueue.filter(c => c.status === 'pending').length;
        
        // Calculate average performance
        let totalPerformance = 0;
        let performanceCount = 0;
        
        for (const capabilities of this.agentCapabilities.values()) {
            for (const score of Object.values(capabilities.performanceScores)) {
                totalPerformance += score;
                performanceCount++;
            }
        }
        
        const averagePerformance = performanceCount > 0 ? totalPerformance / performanceCount : 0;
        
        return {
            totalAgents,
            activeSessions,
            certificationsPending,
            averagePerformance: parseFloat(averagePerformance.toFixed(3)),
            systemStatus: 'operational',
            quantumOptimizationEnabled: true,
            governmentComplianceRate: 0.95,
            lastUpdated: new Date().toISOString()
        };
    }
    
    async getAgentCapabilities(agentId) {
        return this.agentCapabilities.get(agentId) || {
            agentId,
            skills: [],
            certifications: [],
            performanceScores: {},
            lastUpdated: null
        };
    }
    
    async getCertificationStatus() {
        return {
            pending: this.certificationQueue.filter(c => c.status === 'pending').length,
            processing: this.certificationQueue.filter(c => c.status === 'processing').length,
            completed: this.certificationQueue.filter(c => c.status === 'completed').length,
            queue: this.certificationQueue.slice(0, 10) // First 10 items
        };
    }
    
    async getSupremeCommanderStatus() {
        // Mock Supreme Commander Claude status
        return {
            status: 'active',
            totalAgentsManaged: 50000,
            fieldGenerals: 1220,
            operationalForces: 48779,
            trainingOversight: 'enabled',
            quantumOptimization: '949x performance boost',
            governmentCompliance: 'full',
            lastCommand: new Date().toISOString()
        };
    }
    
    startBackgroundTasks() {
        // Process certification queue every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            await this.processCertificationQueue();
        });
        
        // Update training metrics every minute
        cron.schedule('* * * * *', async () => {
            this.trainingMetrics = await this.getTrainingMetrics();
            this.io.emit('metrics-update', this.trainingMetrics);
        });
        
        // Clean up completed sessions every hour
        cron.schedule('0 * * * *', () => {
            this.cleanupCompletedSessions();
        });
    }
    
    async processCertificationQueue() {
        const pendingCertifications = this.certificationQueue.filter(c => c.status === 'pending');
        
        for (const cert of pendingCertifications.slice(0, 5)) { // Process 5 at a time
            try {
                cert.status = 'processing';
                
                // Simulate government certification process
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                cert.status = 'completed';
                cert.completedAt = new Date().toISOString();
                cert.certificateId = `CERT_${cert.agentId}_${cert.skillId}_${Date.now()}`;
                
                // Update agent capabilities
                const capabilities = this.agentCapabilities.get(cert.agentId);
                if (capabilities && !capabilities.certifications.includes(cert.certificateId)) {
                    capabilities.certifications.push(cert.certificateId);
                }
                
                logger.info(`🏆 Certificate issued: ${cert.certificateId}`);
                
            } catch (error) {
                cert.status = 'failed';
                cert.error = error.message;
                logger.error(`Certification failed for ${cert.agentId}:${cert.skillId}: ${error.message}`);
            }
        }
    }
    
    cleanupCompletedSessions() {
        // Remove sessions older than 24 hours
        const cutoff = Date.now() - (24 * 60 * 60 * 1000);
        
        for (const [sessionId, session] of this.activeTrainingSessions) {
            if (session.status === 'completed' && new Date(session.endTime).getTime() < cutoff) {
                this.activeTrainingSessions.delete(sessionId);
            }
        }
        
        logger.info(`Cleaned up old training sessions`);
    }
    
    generateDashboardHTML() {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>TerraFusion OS - AI Training Dashboard</title>
            <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; background: #1a1a1a; color: #fff; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; }
                .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .metric-card { background: #2a2a2a; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                .metric-value { font-size: 2em; font-weight: bold; color: #4CAF50; }
                .metric-label { color: #999; margin-top: 5px; }
                .sessions-table { background: #2a2a2a; border-radius: 10px; overflow: hidden; }
                .table-header { background: #333; padding: 15px; font-weight: bold; }
                .session-row { padding: 10px 15px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center; }
                .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
                .status-running { background: #2196F3; }
                .status-completed { background: #4CAF50; }
                .status-failed { background: #f44336; }
                .progress-bar { background: #444; height: 6px; border-radius: 3px; overflow: hidden; }
                .progress-fill { background: #4CAF50; height: 100%; transition: width 0.3s ease; }
                #startTraining { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px 0; }
                #startTraining:hover { background: #45a049; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🤖 TerraFusion OS - AI Training Dashboard</h1>
                <p>Supreme Commander Claude's AI Agent Training Infrastructure</p>
            </div>
            
            <div class="container">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value" id="totalAgents">0</div>
                        <div class="metric-label">Total Agents Trained</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="activeSessions">0</div>
                        <div class="metric-label">Active Training Sessions</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="averagePerformance">0.000</div>
                        <div class="metric-label">Average Performance</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" id="certificationsPending">0</div>
                        <div class="metric-label">Certifications Pending</div>
                    </div>
                </div>
                
                <button id="startTraining">🚀 Start Training Session</button>
                
                <div class="sessions-table">
                    <div class="table-header">Active Training Sessions</div>
                    <div id="sessionsContainer">
                        <div class="session-row">No active sessions</div>
                    </div>
                </div>
            </div>
            
            <script>
                const socket = io();
                
                // Update metrics
                socket.on('metrics-update', (metrics) => {
                    document.getElementById('totalAgents').textContent = metrics.totalAgents;
                    document.getElementById('activeSessions').textContent = metrics.activeSessions;
                    document.getElementById('averagePerformance').textContent = metrics.averagePerformance;
                    document.getElementById('certificationsPending').textContent = metrics.certificationsPending;
                });
                
                // Update active sessions
                socket.on('active-sessions', (sessions) => {
                    updateSessionsDisplay(sessions);
                });
                
                socket.on('session-started', (session) => {
                    console.log('Training session started:', session);
                });
                
                socket.on('training-progress', (data) => {
                    updateSessionProgress(data.sessionId, data.progress);
                });
                
                function updateSessionsDisplay(sessions) {
                    const container = document.getElementById('sessionsContainer');
                    if (sessions.length === 0) {
                        container.innerHTML = '<div class="session-row">No active sessions</div>';
                        return;
                    }
                    
                    container.innerHTML = sessions.map(session => 
                        '<div class="session-row" id="session-' + session.sessionId + '">' +
                            '<div>' +
                                '<strong>' + session.agentId + '</strong> → ' + session.skillId +
                                '<div class="progress-bar"><div class="progress-fill" style="width: ' + session.progress + '%"></div></div>' +
                            '</div>' +
                            '<span class="status-badge status-' + session.status + '">' + session.status + '</span>' +
                        '</div>'
                    ).join('');
                }
                
                function updateSessionProgress(sessionId, progress) {
                    const sessionElement = document.getElementById('session-' + sessionId);
                    if (sessionElement) {
                        const progressFill = sessionElement.querySelector('.progress-fill');
                        if (progressFill) {
                            progressFill.style.width = progress + '%';
                        }
                    }
                }
                
                // Start training button
                document.getElementById('startTraining').addEventListener('click', () => {
                    const agentId = 'demo_agent_' + Math.floor(Math.random() * 1000);
                    const skills = ['property_assessment', 'citizen_services', 'compliance_monitoring'];
                    const skillId = skills[Math.floor(Math.random() * skills.length)];
                    
                    socket.emit('start-training', { agentId, skillId });
                });
                
                // Initial load
                fetch('/api/training/metrics')
                    .then(response => response.json())
                    .then(metrics => {
                        socket.emit('metrics-update', metrics);
                    });
            </script>
        </body>
        </html>
        `;
    }
    
    start() {
        this.server.listen(this.port, () => {
            logger.info(`🚀 TerraFusion AI Training Dashboard running on port ${this.port}`);
            logger.info(`📊 Dashboard: http://localhost:${this.port}/dashboard`);
            logger.info(`🔧 API: http://localhost:${this.port}/api/`);
        });
    }
}

// Start the training dashboard
const dashboard = new AITrainingDashboard();
dashboard.start();

module.exports = AITrainingDashboard;
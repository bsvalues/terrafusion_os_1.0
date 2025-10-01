/**
 * TerraFusion OS Module Management API
 * Real module launching, stopping, and lifecycle management
 */

const express = require('express');
const { moduleManager } = require('./ModuleProcessManager');

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
    } else {
        next();
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    const summary = moduleManager.getSystemSummary();
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        api: 'TerraFusion Module Manager',
        version: '1.0.0',
        modules: summary
    });
});

// Get all modules
app.get('/api/modules', (req, res) => {
    try {
        const modules = moduleManager.getAllModules().map(m => ({
            id: m.id,
            name: m.plugin.name,
            displayName: m.plugin.name,
            description: m.plugin.description,
            tier: m.plugin.category === 'government' ? 'Tier1' : 
                  m.plugin.category === 'commercial' ? 'Tier2' : 'Tier3',
            status: m.status === 'running' ? 'active' : 
                   m.status === 'starting' ? 'loading' :
                   m.status === 'error' ? 'error' : 'inactive',
            version: m.plugin.version,
            port: m.port,
            pid: m.pid,
            endpoints: m.endpoints,
            isCore: m.plugin.category === 'government',
            priority: m.plugin.marketplace?.rating || 0,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: new Date().toISOString(),
            lastLaunchedAt: m.startTime?.toISOString() || null,
            uptime: m.startTime ? Date.now() - m.startTime.getTime() : 0
        }));

        res.json(modules);
    } catch (error) {
        console.error('Failed to get modules:', error);
        res.status(500).json({ 
            error: 'Failed to get modules', 
            message: error.message 
        });
    }
});

// Get specific module
app.get('/api/modules/:id', (req, res) => {
    try {
        const moduleId = req.params.id;
        const moduleProcess = moduleManager.getModuleStatus(moduleId);
        
        if (!moduleProcess) {
            return res.status(404).json({ 
                error: 'Module not found', 
                moduleId 
            });
        }

        res.json({
            id: moduleProcess.id,
            name: moduleProcess.plugin.name,
            displayName: moduleProcess.plugin.name,
            description: moduleProcess.plugin.description,
            tier: moduleProcess.plugin.category === 'government' ? 'Tier1' : 
                  moduleProcess.plugin.category === 'commercial' ? 'Tier2' : 'Tier3',
            status: moduleProcess.status === 'running' ? 'active' : 
                   moduleProcess.status === 'starting' ? 'loading' :
                   moduleProcess.status === 'error' ? 'error' : 'inactive',
            version: moduleProcess.plugin.version,
            port: moduleProcess.port,
            pid: moduleProcess.pid,
            endpoints: moduleProcess.endpoints,
            isCore: moduleProcess.plugin.category === 'government',
            priority: moduleProcess.plugin.marketplace?.rating || 0,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: new Date().toISOString(),
            lastLaunchedAt: moduleProcess.startTime?.toISOString() || null,
            uptime: moduleProcess.startTime ? Date.now() - moduleProcess.startTime.getTime() : 0,
            resourceUsage: moduleProcess.resourceUsage,
            plugin: moduleProcess.plugin
        });
    } catch (error) {
        console.error('Failed to get module:', error);
        res.status(500).json({ 
            error: 'Failed to get module', 
            message: error.message 
        });
    }
});

// Launch a module
app.post('/api/modules/:id/launch', async (req, res) => {
    try {
        const moduleId = req.params.id;
        console.log(`🚀 API request to launch module: ${moduleId}`);
        
        const success = await moduleManager.startModule(moduleId);
        const moduleProcess = moduleManager.getModuleStatus(moduleId);
        
        if (success && moduleProcess) {
            res.json({
                success: true,
                message: `Module ${moduleProcess.plugin.name} launched successfully`,
                module: {
                    id: moduleProcess.id,
                    name: moduleProcess.plugin.name,
                    status: moduleProcess.status,
                    port: moduleProcess.port,
                    pid: moduleProcess.pid,
                    endpoints: moduleProcess.endpoints
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: `Failed to launch module ${moduleId}`,
                moduleId
            });
        }
    } catch (error) {
        console.error('Failed to launch module:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to launch module', 
            message: error.message,
            moduleId: req.params.id
        });
    }
});

// Stop a module
app.post('/api/modules/:id/stop', async (req, res) => {
    try {
        const moduleId = req.params.id;
        console.log(`⏹️ API request to stop module: ${moduleId}`);
        
        const success = await moduleManager.stopModule(moduleId);
        const moduleProcess = moduleManager.getModuleStatus(moduleId);
        
        if (success) {
            res.json({
                success: true,
                message: `Module ${moduleProcess?.plugin.name || moduleId} stopped successfully`,
                module: moduleProcess ? {
                    id: moduleProcess.id,
                    name: moduleProcess.plugin.name,
                    status: moduleProcess.status,
                    port: moduleProcess.port,
                    pid: moduleProcess.pid
                } : null
            });
        } else {
            res.status(500).json({
                success: false,
                message: `Failed to stop module ${moduleId}`,
                moduleId
            });
        }
    } catch (error) {
        console.error('Failed to stop module:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to stop module', 
            message: error.message,
            moduleId: req.params.id
        });
    }
});

// Restart a module (hot-swap)
app.post('/api/modules/:id/restart', async (req, res) => {
    try {
        const moduleId = req.params.id;
        console.log(`🔄 API request to restart module: ${moduleId}`);
        
        const success = await moduleManager.restartModule(moduleId);
        const moduleProcess = moduleManager.getModuleStatus(moduleId);
        
        if (success && moduleProcess) {
            res.json({
                success: true,
                message: `Module ${moduleProcess.plugin.name} restarted successfully (hot-swap)`,
                module: {
                    id: moduleProcess.id,
                    name: moduleProcess.plugin.name,
                    status: moduleProcess.status,
                    port: moduleProcess.port,
                    pid: moduleProcess.pid,
                    endpoints: moduleProcess.endpoints
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: `Failed to restart module ${moduleId}`,
                moduleId
            });
        }
    } catch (error) {
        console.error('Failed to restart module:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to restart module', 
            message: error.message,
            moduleId: req.params.id
        });
    }
});

// Get module health
app.get('/api/modules/:id/health', async (req, res) => {
    try {
        const moduleId = req.params.id;
        const moduleProcess = moduleManager.getModuleStatus(moduleId);
        
        if (!moduleProcess) {
            return res.status(404).json({ 
                error: 'Module not found', 
                moduleId 
            });
        }

        res.json({
            status: moduleProcess.status === 'running' ? 'healthy' : 
                   moduleProcess.status === 'starting' ? 'starting' :
                   moduleProcess.status === 'error' ? 'unhealthy' : 'stopped',
            module: moduleProcess.id,
            name: moduleProcess.plugin.name,
            uptime: moduleProcess.startTime ? Date.now() - moduleProcess.startTime.getTime() : 0,
            pid: moduleProcess.pid,
            port: moduleProcess.port,
            lastHealthCheck: moduleProcess.lastHealthCheck,
            resourceUsage: moduleProcess.resourceUsage,
            endpoints: moduleProcess.endpoints,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to get module health:', error);
        res.status(500).json({ 
            error: 'Failed to get module health', 
            message: error.message 
        });
    }
});

// Start all modules
app.post('/api/modules/start-all', async (req, res) => {
    try {
        console.log('🚀 API request to start all modules');
        await moduleManager.startAllModules();
        const summary = moduleManager.getSystemSummary();
        
        res.json({
            success: true,
            message: `Started ${summary.running}/${summary.total} modules`,
            summary: summary
        });
    } catch (error) {
        console.error('Failed to start all modules:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to start all modules', 
            message: error.message 
        });
    }
});

// Stop all modules
app.post('/api/modules/stop-all', async (req, res) => {
    try {
        console.log('⏹️ API request to stop all modules');
        await moduleManager.stopAllModules();
        const summary = moduleManager.getSystemSummary();
        
        res.json({
            success: true,
            message: 'All modules stopped',
            summary: summary
        });
    } catch (error) {
        console.error('Failed to stop all modules:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to stop all modules', 
            message: error.message 
        });
    }
});

// Get system status
app.get('/api/system/status', (req, res) => {
    try {
        const summary = moduleManager.getSystemSummary();
        
        res.json({
            status: 'operational',
            timestamp: new Date().toISOString(),
            system: {
                name: 'TerraFusion OS',
                version: '1.0.0',
                uptime: process.uptime(),
                platform: process.platform,
                nodeVersion: process.version,
                memory: process.memoryUsage()
            },
            modules: summary,
            services: {
                api: { status: 'healthy', port: process.env.PORT || 5046 },
                moduleManager: { status: 'healthy', modules: summary.total }
            }
        });
    } catch (error) {
        console.error('Failed to get system status:', error);
        res.status(500).json({ 
            error: 'Failed to get system status', 
            message: error.message 
        });
    }
});

// Initialize module manager and start API server
async function startModuleManagerAPI() {
    try {
        console.log('🔧 Initializing TerraFusion Module Manager...');
        
        // Load all modules from the modules directory
        await moduleManager.loadModules();
        
        const port = process.env.TF_MODULE_API_PORT || 5046;
        const server = app.listen(port, () => {
            console.log(`🚀 TerraFusion Module Manager API running on port ${port}`);
            console.log(`📊 System Status: http://localhost:${port}/api/system/status`);
            console.log(`🏥 Health Check: http://localhost:${port}/health`);
            console.log(`📦 Modules API: http://localhost:${port}/api/modules`);
            
            const summary = moduleManager.getSystemSummary();
            console.log(`📈 Loaded ${summary.total} modules, ready to launch!`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log('🛑 Shutting down Module Manager API...');
            server.close(async () => {
                await moduleManager.shutdown();
                process.exit(0);
            });
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

        // Auto-start core modules if requested
        if (process.env.TF_AUTO_START_MODULES === 'true') {
            console.log('🚀 Auto-starting modules...');
            setTimeout(async () => {
                await moduleManager.startAllModules();
            }, 5000); // Wait 5 seconds for API to fully start
        }

    } catch (error) {
        console.error('❌ Failed to start Module Manager API:', error);
        process.exit(1);
    }
}

// Start the API if this file is run directly
if (require.main === module) {
    startModuleManagerAPI();
}

module.exports = { app, moduleManager, startModuleManagerAPI };
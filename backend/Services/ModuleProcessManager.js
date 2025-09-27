/**
 * TerraFusion OS Module Process Manager
 * Handles real module lifecycle, hot-swapping, and process management
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

class ModuleProcessManager extends EventEmitter {
    constructor() {
        super();
        this.modules = new Map();
        this.portRange = { start: 5100, end: 5200 };
        this.usedPorts = new Set();
        this.healthCheckInterval = null;
        this.startHealthMonitoring();
    }

    /**
     * Load all modules from the modules directory
     */
    async loadModules() {
        // Try to find modules directory from different possible locations
        const possiblePaths = [
            path.join(__dirname, '..', '..', 'modules'),
            path.join(process.cwd(), 'modules'),
            path.join(process.cwd(), '..', '..', 'modules')
        ];

        let modulesPath = null;
        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                modulesPath = testPath;
                break;
            }
        }
        
        if (!modulesPath) {
            throw new Error(`Modules directory not found. Tried: ${possiblePaths.join(', ')}`);
        }

        console.log(`📁 Using modules directory: ${modulesPath}`);
        return await this.loadModulesFromPath(modulesPath);
    }

    /**
     * Load modules from a specific path
     */
    async loadModulesFromPath(modulesPath) {
        const moduleDirs = fs.readdirSync(modulesPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        console.log(`Found ${moduleDirs.length} modules to load:`, moduleDirs);

        for (const moduleDir of moduleDirs) {
            await this.loadModuleFromPath(moduleDir, modulesPath);
        }

        console.log(`Successfully loaded ${this.modules.size} modules`);
    }

    /**
     * Load a specific module by reading its plugin.json from a given path
     */
    async loadModuleFromPath(moduleId, modulesBasePath) {
        const modulePath = path.join(modulesBasePath, moduleId);
        const pluginPath = path.join(modulePath, 'PWA', 'plugin.json');

        if (!fs.existsSync(pluginPath)) {
            console.warn(`No plugin.json found for module ${moduleId}`);
            return;
        }

        try {
            const pluginContent = fs.readFileSync(pluginPath, 'utf8');
            const plugin = JSON.parse(pluginContent);

            // Handle both 'endpoints' and 'api_endpoints' formats
            const endpoints = plugin.endpoints || plugin.api_endpoints || {};
            
            const port = this.allocatePort();
            const moduleProcess = {
                id: moduleId,
                plugin,
                process: null,
                pid: null,
                port: port,
                status: 'stopped',
                startTime: null,
                lastHealthCheck: null,
                resourceUsage: { cpu: 0, memory: 0 },
                modulePath: modulePath,
                endpoints: {
                    health: `http://localhost:${port}${endpoints.health || '/health'}`,
                    api: `http://localhost:${port}${endpoints.api || '/api'}`,
                    ui: `http://localhost:${port}${endpoints.ui || '/ui'}`
                }
            };

            this.modules.set(moduleId, moduleProcess);
            console.log(`📦 Loaded module: ${plugin.name} (${moduleId}) on port ${port}`);
        } catch (error) {
            console.error(`❌ Failed to load module ${moduleId}:`, error.message);
        }
    }

    /**
     * Start a module process
     */
    async startModule(moduleId) {
        const moduleProcess = this.modules.get(moduleId);
        if (!moduleProcess) {
            throw new Error(`Module ${moduleId} not found`);
        }

        if (moduleProcess.status === 'running') {
            console.log(`Module ${moduleId} is already running`);
            return true;
        }

        try {
            moduleProcess.status = 'starting';
            this.emit('moduleStatusChanged', moduleId, 'starting');

            const modulePath = moduleProcess.modulePath;
            
            // Always use the simple server approach for consistency
            const command = 'node';
            const args = ['-e', this.getSimpleServerCode(moduleProcess)];

            console.log(`🚀 Starting module ${moduleId} on port ${moduleProcess.port}`);

            const childProcess = spawn(command, args, {
                cwd: process.cwd(),
                env: {
                    ...process.env,
                    TF_MODULE_ID: moduleId,
                    TF_MODULE_PORT: moduleProcess.port.toString(),
                    TF_MODULE_NAME: moduleProcess.plugin.name,
                    PORT: moduleProcess.port.toString(),
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            moduleProcess.process = childProcess;
            moduleProcess.pid = childProcess.pid || null;
            moduleProcess.startTime = new Date();

            // Handle process events
            childProcess.on('spawn', () => {
                moduleProcess.status = 'running';
                console.log(`✅ Module ${moduleId} started successfully (PID: ${childProcess.pid}, Port: ${moduleProcess.port})`);
                this.emit('moduleStatusChanged', moduleId, 'running');
            });

            childProcess.on('error', (error) => {
                moduleProcess.status = 'error';
                console.error(`❌ Module ${moduleId} failed to start:`, error.message);
                this.emit('moduleStatusChanged', moduleId, 'error');
            });

            childProcess.on('exit', (code, signal) => {
                moduleProcess.status = 'stopped';
                moduleProcess.process = null;
                moduleProcess.pid = null;
                console.log(`⏹️ Module ${moduleId} exited with code ${code}, signal ${signal}`);
                this.emit('moduleStatusChanged', moduleId, 'stopped');
            });

            // Capture stdout and stderr for logging
            if (childProcess.stdout) {
                childProcess.stdout.on('data', (data) => {
                    console.log(`[${moduleId}] ${data.toString().trim()}`);
                });
            }

            if (childProcess.stderr) {
                childProcess.stderr.on('data', (data) => {
                    console.error(`[${moduleId}] ${data.toString().trim()}`);
                });
            }

            // Give it a moment to start
            await new Promise(resolve => setTimeout(resolve, 2000));

            return true;
        } catch (error) {
            moduleProcess.status = 'error';
            console.error(`❌ Failed to start module ${moduleId}:`, error.message);
            this.emit('moduleStatusChanged', moduleId, 'error');
            return false;
        }
    }

    /**
     * Generate simple server code for modules
     */
    getSimpleServerCode(moduleProcess) {
        return `
const http = require('http');
const path = require('path');
const fs = require('fs');
const port = ${moduleProcess.port};
const moduleId = '${moduleProcess.id}';
const plugin = ${JSON.stringify(moduleProcess.plugin)};
const modulePath = '${moduleProcess.modulePath.replace(/\\/g, '\\\\')}';

// MIME type mapping
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

function serveStaticFile(filePath, res) {
    try {
        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    
    if (req.url === (plugin.endpoints?.health || plugin.api_endpoints?.health || '/health')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            module: moduleId,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            version: plugin.version
        }));
    } else if (req.url === (plugin.endpoints?.api || plugin.api_endpoints?.api || '/api')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            module: moduleId,
            name: plugin.name,
            version: plugin.version,
            status: 'operational',
            endpoints: plugin.endpoints || plugin.api_endpoints || {}
        }));
    } else if (req.url === (plugin.endpoints?.ui || plugin.api_endpoints?.ui || '/ui') || req.url === '/' || req.url === '/index.html') {
        // Serve the module's main index.html file
        const indexPath = path.join(modulePath, 'index.html');
        if (fs.existsSync(indexPath)) {
            serveStaticFile(indexPath, res);
        } else {
            // Fallback to a generated module interface if no index.html exists
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(\`<!DOCTYPE html>
<html>
<head>
    <title>\${plugin.name || moduleId}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            background: linear-gradient(135deg, #0b1426 0%, #1a2332 50%, #0b1426 100%); 
            color: #ffffff; 
            min-height: 100vh;
        }
        .header { 
            background: rgba(0,153,255,0.1); 
            padding: 20px; 
            border-bottom: 2px solid #0099ff; 
            display: flex; 
            align-items: center; 
            justify-content: space-between;
        }
        .logo { 
            font-size: 24px; 
            font-weight: bold; 
            color: #0099ff; 
        }
        .status-badge { 
            background: #00ff88; 
            color: #000; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-weight: bold; 
            font-size: 12px;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 40px 20px; 
        }
        .module-header { 
            text-align: center; 
            margin-bottom: 40px; 
        }
        .module-title { 
            font-size: 48px; 
            font-weight: 300; 
            color: #00ffee; 
            margin: 0 0 10px 0; 
            text-shadow: 0 0 20px rgba(0,255,238,0.3);
        }
        .module-description { 
            font-size: 18px; 
            color: #a0a8b8; 
            margin: 0 0 30px 0; 
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin: 30px 0; 
        }
        .stat-card { 
            background: rgba(255,255,255,0.05); 
            border: 1px solid rgba(0,153,255,0.3); 
            padding: 20px; 
            border-radius: 10px; 
            text-align: center;
        }
        .stat-value { 
            font-size: 32px; 
            font-weight: bold; 
            color: #00ffaa; 
            margin-bottom: 5px; 
        }
        .stat-label { 
            color: #a0a8b8; 
            font-size: 14px; 
        }
        .endpoints-section { 
            background: rgba(255,255,255,0.05); 
            border: 1px solid rgba(0,153,255,0.3); 
            padding: 30px; 
            border-radius: 10px; 
            margin: 30px 0; 
        }
        .endpoints-title { 
            font-size: 24px; 
            color: #0099ff; 
            margin-bottom: 20px; 
        }
        .endpoint-list { 
            display: grid; 
            gap: 15px; 
        }
        .endpoint-item { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
            padding: 15px; 
            background: rgba(0,153,255,0.1); 
            border-radius: 8px; 
        }
        .endpoint-name { 
            font-weight: bold; 
            color: #ffffff; 
        }
        .endpoint-url { 
            color: #00ffaa; 
            text-decoration: none; 
            font-family: monospace; 
        }
        .endpoint-url:hover { 
            color: #00ffee; 
            text-decoration: underline; 
        }
        .transcendence-message { 
            text-align: center; 
            padding: 30px; 
            background: linear-gradient(45deg, rgba(0,255,170,0.1), rgba(0,255,238,0.1)); 
            border: 1px solid rgba(0,255,170,0.3); 
            border-radius: 10px; 
            margin: 30px 0; 
        }
        .transcendence-text { 
            font-size: 20px; 
            color: #00ffaa; 
            font-weight: 300; 
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">TF</div>
        <div class="status-badge">OPERATIONAL</div>
    </div>
    
    <div class="container">
        <div class="module-header">
            <h1 class="module-title">\${plugin.name || plugin.displayName || moduleId}</h1>
            <p class="module-description">\${plugin.description || 'TerraFusion Government Module'}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">\${port}</div>
                <div class="stat-label">Port</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">v\${plugin.version || '1.0.0'}</div>
                <div class="stat-label">Version</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">ACTIVE</div>
                <div class="stat-label">Status</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">\${Math.floor(process.uptime())}s</div>
                <div class="stat-label">Uptime</div>
            </div>
        </div>
        
        <div class="endpoints-section">
            <h2 class="endpoints-title">🌐 Module Endpoints</h2>
            <div class="endpoint-list">
                <div class="endpoint-item">
                    <span class="endpoint-name">Health Check</span>
                    <a href="http://localhost:\${port}\${plugin.endpoints?.health || plugin.api_endpoints?.health || '/health'}" class="endpoint-url" target="_blank">
                        \${plugin.endpoints?.health || plugin.api_endpoints?.health || '/health'}
                    </a>
                </div>
                <div class="endpoint-item">
                    <span class="endpoint-name">API Interface</span>
                    <a href="http://localhost:\${port}\${plugin.endpoints?.api || plugin.api_endpoints?.api || '/api'}" class="endpoint-url" target="_blank">
                        \${plugin.endpoints?.api || plugin.api_endpoints?.api || '/api'}
                    </a>
                </div>
                <div class="endpoint-item">
                    <span class="endpoint-name">User Interface</span>
                    <a href="http://localhost:\${port}\${plugin.endpoints?.ui || plugin.api_endpoints?.ui || '/ui'}" class="endpoint-url" target="_blank">
                        \${plugin.endpoints?.ui || plugin.api_endpoints?.ui || '/ui'}
                    </a>
                </div>
            </div>
        </div>
        
        <div class="transcendence-message">
            <div class="transcendence-text">🏛️ Government. Transcended.</div>
        </div>
    </div>
</body>
</html>\`);
        }
    } else {
        // Serve static assets (CSS, JS, images, etc.)
        let filePath = path.join(modulePath, req.url.slice(1)); // Remove leading slash
        serveStaticFile(filePath, res);
    }
});

server.listen(port, () => {
    console.log(\`Module \${moduleId} (\${plugin.name}) running on port \${port}\`);
});

process.on('SIGTERM', () => {
    console.log(\`Module \${moduleId} received SIGTERM, shutting down gracefully\`);
    server.close(() => {
        process.exit(0);
    });
});`;
    }

    /**
     * Stop a module process
     */
    async stopModule(moduleId) {
        const moduleProcess = this.modules.get(moduleId);
        if (!moduleProcess || !moduleProcess.process) {
            console.log(`Module ${moduleId} is already stopped`);
            return true;
        }

        try {
            moduleProcess.status = 'stopping';
            this.emit('moduleStatusChanged', moduleId, 'stopping');

            console.log(`⏹️ Stopping module ${moduleId} (PID: ${moduleProcess.pid})`);

            // Graceful shutdown first
            moduleProcess.process.kill('SIGTERM');

            // Force kill after 10 seconds if still running
            setTimeout(() => {
                if (moduleProcess.process && !moduleProcess.process.killed) {
                    console.log(`🔥 Force killing module ${moduleId}`);
                    moduleProcess.process.kill('SIGKILL');
                }
            }, 10000);

            return true;
        } catch (error) {
            console.error(`❌ Failed to stop module ${moduleId}:`, error.message);
            return false;
        }
    }

    /**
     * Start all modules
     */
    async startAllModules() {
        console.log(`🚀 Starting all ${this.modules.size} modules...`);
        const moduleIds = Array.from(this.modules.keys());
        
        for (const moduleId of moduleIds) {
            try {
                await this.startModule(moduleId);
                // Stagger startup to avoid port conflicts
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Failed to start module ${moduleId}:`, error.message);
            }
        }
        
        const runningCount = this.getRunningModules().length;
        console.log(`✅ Module startup complete: ${runningCount}/${this.modules.size} modules running`);
    }

    /**
     * Get all modules
     */
    getAllModules() {
        return Array.from(this.modules.values());
    }

    /**
     * Get running modules
     */
    getRunningModules() {
        return Array.from(this.modules.values()).filter(m => m.status === 'running');
    }

    /**
     * Get module status
     */
    getModuleStatus(moduleId) {
        return this.modules.get(moduleId) || null;
    }

    /**
     * Get module summary for system status
     */
    getSystemSummary() {
        const modules = this.getAllModules();
        const running = this.getRunningModules();
        
        return {
            total: modules.length,
            running: running.length,
            stopped: modules.filter(m => m.status === 'stopped').length,
            error: modules.filter(m => m.status === 'error').length,
            starting: modules.filter(m => m.status === 'starting').length,
            modules: modules.map(m => ({
                id: m.id,
                name: m.plugin.name,
                status: m.status,
                port: m.port,
                pid: m.pid,
                uptime: m.startTime ? Date.now() - m.startTime.getTime() : 0,
                endpoints: m.endpoints
            }))
        };
    }

    /**
     * Allocate a port for a module
     */
    allocatePort() {
        for (let port = this.portRange.start; port <= this.portRange.end; port++) {
            if (!this.usedPorts.has(port)) {
                this.usedPorts.add(port);
                return port;
            }
        }
        throw new Error('No available ports for module');
    }

    /**
     * Start health monitoring for all modules
     */
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(async () => {
            for (const [moduleId, moduleProcess] of this.modules) {
                if (moduleProcess.status === 'running') {
                    await this.checkModuleHealth(moduleId);
                }
            }
        }, 30000); // Check every 30 seconds
    }

    /**
     * Check health of a specific module
     */
    async checkModuleHealth(moduleId) {
        const moduleProcess = this.modules.get(moduleId);
        if (!moduleProcess) return;

        try {
            if (moduleProcess.process && moduleProcess.pid) {
                process.kill(moduleProcess.pid, 0); // Check if process exists
                moduleProcess.lastHealthCheck = new Date();
            }
        } catch (error) {
            console.log(`❌ Module ${moduleId} process not found, marking as stopped`);
            moduleProcess.status = 'stopped';
            moduleProcess.process = null;
            moduleProcess.pid = null;
            this.emit('moduleStatusChanged', moduleId, 'stopped');
        }
    }

    /**
     * Cleanup and stop all modules
     */
    async shutdown() {
        console.log('🛑 Shutting down Module Process Manager...');
        
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        const stopPromises = Array.from(this.modules.keys()).map(moduleId => 
            this.stopModule(moduleId)
        );

        await Promise.all(stopPromises);
        console.log('✅ Module Process Manager shutdown complete');
    }
}

// Singleton instance
const moduleManager = new ModuleProcessManager();

module.exports = { ModuleProcessManager, moduleManager };
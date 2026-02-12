// Terrafusion Playground - Enhanced Application Launcher
// Enterprise-grade launcher for the complete Terrafusion ecosystem

const TerraFusionLauncher = {
    // Application configuration - EXPANDED ECOSYSTEM (12 APPLICATIONS)
    apps: {
        // ORIGINAL TERRAFUSION CORE (6 APPS)
        TerraAgent: { port: 5003, name: 'TerraAgent', script: 'app.py' },
        TerraFlow: { port: 5001, name: 'TerraFlow', script: 'app.py' },
        TerraSync: { port: 5002, name: 'TerraSync', script: 'app.py' },
        Terrafusion: { port: 5000, name: 'Terrafusion Build', script: 'terrafusion_build_ENTERPRISE_COMPLETE.py' },
        TerraMiner: { port: 5006, name: 'TerraMiner', script: 'app.py' },
        TerraLevy: { port: 5007, name: 'TerraLevy', script: 'app.py' },
        
        // NEW ENTERPRISE APPLICATIONS (6 APPS)
        BCBSWebhub: { port: 5008, name: 'BCBS WebHub', script: 'npm run dev' },
        TerraFusionPrimeView: { port: 5009, name: 'Terrafusion Prime View', script: 'npm run dev' },
        TerraFusionV0Demo: { port: 5010, name: 'Terrafusion Quantum Demo', script: 'npm run dev' },
        TerraFusionProf: { port: 5011, name: 'Terrafusion Professional', script: 'npm run dev' },
        MCPServers: { port: 5012, name: 'MCP Protocol Servers', script: 'python src/servers.py' },
        SystemPromptsAI: { port: 5013, name: 'AI System Prompts & Models', script: 'python main.py' }
    },

    // Status tracking
    statusElements: {},
    launchButtons: {},

    // Initialize the launcher
    init() {
        // Initialize status elements and buttons
        Object.keys(this.apps).forEach(appKey => {
            const statusId = `${appKey.toLowerCase()}Status`;
            this.statusElements[appKey] = document.getElementById(statusId);
            this.launchButtons[appKey] = document.querySelector(`[onclick*="${appKey}"]`);
        });

        // Start status monitoring
        this.startStatusMonitoring();
        
        // Initial status check
        this.checkAllApplicationStatus();
        
        console.log('🚀 Terrafusion Playground Launcher Initialized');
    },

    // Launch a specific application
    async launchApp(appName, port) {
        const app = this.apps[appName];
        if (!app) {
            console.error(`Unknown application: ${appName}`);
            return;
        }

        const statusElement = this.statusElements[appName];
        const button = this.launchButtons[appName];

        if (statusElement) {
            statusElement.textContent = 'Launching...';
            statusElement.className = 'tf-status-badge tf-status-warning';
        }

        if (button) {
            button.disabled = true;
        }

        try {
            // First check if app is already running
            const healthCheck = await this.checkAppHealth(port);
            if (healthCheck.online) {
                if (statusElement) {
                    statusElement.textContent = 'Already Running';
                    statusElement.className = 'tf-status-badge tf-status-online';
                }
                if (button) button.disabled = false;
                return;
            }

            // Attempt to launch via backend API
            const response = await fetch('/api/launch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    app: appName,
                    port: port,
                    script: app.script
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (statusElement) {
                    statusElement.textContent = 'Starting...';
                    statusElement.className = 'tf-status-badge tf-status-warning';
                }
                
                // Wait a moment then check if it started
                setTimeout(() => this.checkAppStatus(appName, port), 3000);
            } else {
                throw new Error(`Launch failed: ${response.status}`);
            }

        } catch (error) {
            console.error(`Error launching ${appName}:`, error);
            
            // Fallback: try to launch via direct command
            this.launchAppFallback(appName, port);
        }

        if (button) {
            button.disabled = false;
        }
    },

    // Fallback launch method
    async launchAppFallback(appName, port) {
        const statusElement = this.statusElements[appName];
        
        try {
            // Try to start the application using a simple approach
            const startCommand = this.getStartCommand(appName);
            
            if (statusElement) {
                statusElement.textContent = 'Starting (Fallback)...';
                statusElement.className = 'tf-status-badge tf-status-warning';
            }

            // Since we can't actually execute commands from the browser,
            // we'll just check if the service becomes available
            setTimeout(() => this.checkAppStatus(appName, port), 2000);
            
        } catch (error) {
            console.error(`Fallback launch failed for ${appName}:`, error);
            if (statusElement) {
                statusElement.textContent = 'Launch Failed';
                statusElement.className = 'tf-status-badge tf-status-error';
            }
        }
    },

    // Get the appropriate start command for each app
    getStartCommand(appName) {
        const commands = {
            TerraAgent: 'cd ../TerraAgent_PRODUCTION && python app.py',
            TerraFlow: 'cd ../TerraFlow_PRODUCTION && python app.py',
            TerraSync: 'cd ../TerraFusionSync_PRODUCTION && python app.py',
            Terrafusion: 'cd ../DEPLOYED_APPLICATIONS && python terrafusion_build_ENTERPRISE_COMPLETE.py',
            TerraMiner: 'cd ../TerraMiner_PRODUCTION && python app.py',
            TerraLevy: 'cd ../TerraFusionLevy_PRODUCTION && python app.py'
        };
        return commands[appName] || '';
    },

    // Check if an application is healthy
    async checkAppHealth(port) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`http://localhost:${port}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            return {
                online: response.ok,
                status: response.status,
                port: port
            };
        } catch (error) {
            return {
                online: false,
                error: error.message,
                port: port
            };
        }
    },

    // Check status of a specific application
    async checkAppStatus(appName, port) {
        const statusElement = this.statusElements[appName];
        if (!statusElement) return;

        try {
            const health = await this.checkAppHealth(port);
            
            if (health.online) {
                statusElement.textContent = 'Online';
                statusElement.className = 'tf-status-badge tf-status-online';
            } else {
                statusElement.textContent = 'Offline';
                statusElement.className = 'tf-status-badge tf-status-offline';
            }
        } catch (error) {
            statusElement.textContent = 'Error';
            statusElement.className = 'tf-status-badge tf-status-error';
        }
    },

    // Check all application statuses
    async checkAllApplicationStatus() {
        const promises = Object.entries(this.apps).map(([appName, config]) => 
            this.checkAppStatus(appName, config.port)
        );
        
        await Promise.all(promises);
    },

    // Start periodic status monitoring
    startStatusMonitoring() {
        // Check status every 30 seconds
        setInterval(() => {
            this.checkAllApplicationStatus();
        }, 30000);

        // Quick check every 5 seconds for recently launched apps
        setInterval(() => {
            Object.entries(this.apps).forEach(([appName, config]) => {
                const statusElement = this.statusElements[appName];
                if (statusElement && statusElement.textContent.includes('Starting')) {
                    this.checkAppStatus(appName, config.port);
                }
            });
        }, 5000);
    },

    // Launch all applications
    async launchAllApps() {
        console.log('🚀 Launching all Terrafusion applications...');
        
        const apps = Object.entries(this.apps);
        
        // Launch apps with staggered timing to avoid resource conflicts
        for (let i = 0; i < apps.length; i++) {
            const [appName, config] = apps[i];
            setTimeout(() => {
                this.launchApp(appName, config.port);
            }, i * 2000); // 2 second delay between launches
        }
    },

    // Refresh all statuses
    async refreshAllStatus() {
        console.log('🔄 Refreshing all application statuses...');
        await this.checkAllApplicationStatus();
    }
};

// Global functions for HTML onclick handlers
function launchApp(appName, port) {
    TerraFusionLauncher.launchApp(appName, port);
}

function launchAllApps() {
    TerraFusionLauncher.launchAllApps();
}

function checkAllStatus() {
    TerraFusionLauncher.refreshAllStatus();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    TerraFusionLauncher.init();
});

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TerraFusionLauncher;
} 
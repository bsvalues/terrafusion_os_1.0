const path = require('path');
const { spawn } = require('child_process');

const { app, BrowserWindow, shell, ipcMain } = require('electron');

/**
 * Desktop Launcher Integration for Terrafusion OS 1.0
 * Migrated from TerraFusion_Remix_Clean desktop launchers
 */

class DesktopLaunchers {
    constructor() {
        this.launchers = {
            costforgeai: {
                name: 'CostForge AI',
                description: 'Advanced cost analysis and forecasting',
                icon: 'utilities-terminal',
                category: 'Development',
                startScript: 'start-costforge.sh'
            },
            leafscope: {
                name: 'LeafScope',
                description: 'Property visualization and mapping',
                icon: 'utilities-terminal', 
                category: 'Development',
                startScript: 'start-leafscope.sh'
            },
            marketplaceui: {
                name: 'Marketplace UI',
                description: 'Terrafusion marketplace interface',
                icon: 'utilities-terminal',
                category: 'Development',
                startScript: 'start-marketplace.sh'
            },
            terrafusiondev: {
                name: 'Terrafusion Dev',
                description: 'Development environment launcher',
                icon: 'utilities-terminal',
                category: 'Development', 
                startScript: 'start-dev.sh'
            }
        };
    }

    /**
     * Launch a specific application
     */
    async launchApplication(appId) {
        const launcher = this.launchers[appId];
        if (!launcher) {
            throw new Error(`Unknown application: ${appId}`);
        }

        console.log(`Launching ${launcher.name}...`);
        
        try {
            const scriptPath = path.join(__dirname, '../../scripts', launcher.startScript);
            const process = spawn('bash', [scriptPath], {
                detached: true,
                stdio: 'inherit'
            });

            process.unref();
            return { success: true, message: `${launcher.name} launched successfully` };
        } catch (error) {
            console.error(`Failed to launch ${launcher.name}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all available launchers
     */
    getAvailableLaunchers() {
        return Object.entries(this.launchers).map(([id, launcher]) => ({
            id,
            ...launcher
        }));
    }

    /**
     * Create desktop shortcuts (Linux .desktop files)
     */
    async createDesktopShortcuts(targetDir = '~/.local/share/applications') {
        const shortcuts = [];
        
        for (const [id, launcher] of Object.entries(this.launchers)) {
            const desktopContent = `[Desktop Entry]
Type=Application
Name=${launcher.name}
Exec=bash ~/Projects/terrafusion/scripts/${launcher.startScript}
Icon=${launcher.icon}
Terminal=true
Categories=${launcher.category};
`;
            
            shortcuts.push({
                filename: `${id}.desktop`,
                content: desktopContent
            });
        }
        
        return shortcuts;
    }

    /**
     * Register IPC handlers for launcher functionality
     */
    registerIPCHandlers() {
        ipcMain.handle('launcher:getAll', () => {
            return this.getAvailableLaunchers();
        });

        ipcMain.handle('launcher:launch', async (event, appId) => {
            return await this.launchApplication(appId);
        });

        ipcMain.handle('launcher:createShortcuts', async () => {
            return await this.createDesktopShortcuts();
        });
    }
}

module.exports = DesktopLaunchers;

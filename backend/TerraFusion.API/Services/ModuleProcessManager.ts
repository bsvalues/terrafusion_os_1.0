/**
 * TerraFusion OS Module Process Manager
 * Handles real module lifecycle, hot-swapping, and process management
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { EventEmitter } from 'events';

export interface ModulePlugin {
    id: string;
    name: string;
    version: string;
    type: string;
    entry: string;
    description: string;
    category: string;
    price: string;
    author: string;
    marketplace: {
        featured: boolean;
        revenue_sharing: string;
        compatibility: string[];
        requirements: string[];
        rating: number;
        downloads: number;
    };
    endpoints: {
        health: string;
        api: string;
        ui: string;
    };
    permissions: string[];
    hot_swap: {
        enabled: boolean;
        restart_required: boolean;
        dependencies: string[];
    };
}

export interface ModuleProcess {
    id: string;
    plugin: ModulePlugin;
    process: ChildProcess | null;
    pid: number | null;
    port: number;
    status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
    startTime: Date | null;
    lastHealthCheck: Date | null;
    resourceUsage: {
        cpu: number;
        memory: number;
    };
    endpoints: {
        health: string;
        api: string;
        ui: string;
    };
}

export class ModuleProcessManager extends EventEmitter {
    private modules: Map<string, ModuleProcess> = new Map();
    private portRange = { start: 5100, end: 5200 };
    private usedPorts = new Set<number>();
    private healthCheckInterval: NodeJS.Timeout | null = null;
    
    constructor() {
        super();
        this.startHealthMonitoring();
    }

    /**
     * Load all modules from the modules directory
     */
    async loadModules(): Promise<void> {
        const modulesPath = path.join(process.cwd(), 'modules');
        
        if (!fs.existsSync(modulesPath)) {
            throw new Error('Modules directory not found');
        }

        const moduleDirs = fs.readdirSync(modulesPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const moduleDir of moduleDirs) {
            await this.loadModule(moduleDir);
        }
    }

    /**
     * Load a specific module by reading its plugin.json
     */
    async loadModule(moduleId: string): Promise<void> {
        const modulePath = path.join(process.cwd(), 'modules', moduleId);
        const pluginPath = path.join(modulePath, 'PWA', 'plugin.json');

        if (!fs.existsSync(pluginPath)) {
            console.warn(`No plugin.json found for module ${moduleId}`);
            return;
        }

        try {
            const pluginContent = fs.readFileSync(pluginPath, 'utf8');
            const plugin: ModulePlugin = JSON.parse(pluginContent);

            const moduleProcess: ModuleProcess = {
                id: moduleId,
                plugin,
                process: null,
                pid: null,
                port: this.allocatePort(),
                status: 'stopped',
                startTime: null,
                lastHealthCheck: null,
                resourceUsage: { cpu: 0, memory: 0 },
                endpoints: {
                    health: `http://localhost:${this.allocatePort()}${plugin.endpoints.health}`,
                    api: `http://localhost:${this.allocatePort()}${plugin.endpoints.api}`,
                    ui: `http://localhost:${this.allocatePort()}${plugin.endpoints.ui}`
                }
            };

            this.modules.set(moduleId, moduleProcess);
            console.log(`Loaded module: ${plugin.name} (${moduleId})`);
        } catch (error) {
            console.error(`Failed to load module ${moduleId}:`, error);
        }
    }

    /**
     * Start a module process
     */
    async startModule(moduleId: string): Promise<boolean> {
        const moduleProcess = this.modules.get(moduleId);
        if (!moduleProcess) {
            throw new Error(`Module ${moduleId} not found`);
        }

        if (moduleProcess.status === 'running') {
            return true; // Already running
        }

        try {
            moduleProcess.status = 'starting';
            this.emit('moduleStatusChanged', moduleId, 'starting');

            const modulePath = path.join(process.cwd(), 'modules', moduleId);
            const entryPath = path.join(modulePath, 'PWA', moduleProcess.plugin.entry);

            // Check if module has a package.json for npm start
            const packageJsonPath = path.join(modulePath, 'package.json');
            let command: string;
            let args: string[];

            if (fs.existsSync(packageJsonPath)) {
                // Use npm start if package.json exists
                command = 'npm';
                args = ['start'];
            } else {
                // Use node to run the entry file directly
                command = 'node';
                args = [entryPath];
            }

            const childProcess = spawn(command, args, {
                cwd: modulePath,
                env: {
                    ...process.env,
                    TF_MODULE_ID: moduleId,
                    TF_MODULE_PORT: moduleProcess.port.toString(),
                    TF_MODULE_NAME: moduleProcess.plugin.name,
                },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            moduleProcess.process = childProcess;
            moduleProcess.pid = childProcess.pid || null;
            moduleProcess.startTime = new Date();

            // Handle process events
            childProcess.on('spawn', () => {
                moduleProcess.status = 'running';
                console.log(`Module ${moduleId} started successfully (PID: ${childProcess.pid})`);
                this.emit('moduleStatusChanged', moduleId, 'running');
            });

            childProcess.on('error', (error) => {
                moduleProcess.status = 'error';
                console.error(`Module ${moduleId} failed to start:`, error);
                this.emit('moduleStatusChanged', moduleId, 'error');
            });

            childProcess.on('exit', (code, signal) => {
                moduleProcess.status = 'stopped';
                moduleProcess.process = null;
                moduleProcess.pid = null;
                console.log(`Module ${moduleId} exited with code ${code}, signal ${signal}`);
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

            return true;
        } catch (error) {
            moduleProcess.status = 'error';
            console.error(`Failed to start module ${moduleId}:`, error);
            this.emit('moduleStatusChanged', moduleId, 'error');
            return false;
        }
    }

    /**
     * Stop a module process
     */
    async stopModule(moduleId: string): Promise<boolean> {
        const moduleProcess = this.modules.get(moduleId);
        if (!moduleProcess || !moduleProcess.process) {
            return true; // Already stopped
        }

        try {
            moduleProcess.status = 'stopping';
            this.emit('moduleStatusChanged', moduleId, 'stopping');

            // Graceful shutdown first
            moduleProcess.process.kill('SIGTERM');

            // Force kill after 10 seconds if still running
            setTimeout(() => {
                if (moduleProcess.process && !moduleProcess.process.killed) {
                    moduleProcess.process.kill('SIGKILL');
                }
            }, 10000);

            return true;
        } catch (error) {
            console.error(`Failed to stop module ${moduleId}:`, error);
            return false;
        }
    }

    /**
     * Restart a module (hot-swap)
     */
    async restartModule(moduleId: string): Promise<boolean> {
        const moduleProcess = this.modules.get(moduleId);
        if (!moduleProcess) {
            throw new Error(`Module ${moduleId} not found`);
        }

        if (!moduleProcess.plugin.hot_swap.enabled) {
            throw new Error(`Module ${moduleId} does not support hot-swapping`);
        }

        await this.stopModule(moduleId);
        
        // Wait for process to fully stop
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return await this.startModule(moduleId);
    }

    /**
     * Get module status
     */
    getModuleStatus(moduleId: string): ModuleProcess | null {
        return this.modules.get(moduleId) || null;
    }

    /**
     * Get all modules
     */
    getAllModules(): ModuleProcess[] {
        return Array.from(this.modules.values());
    }

    /**
     * Get running modules
     */
    getRunningModules(): ModuleProcess[] {
        return Array.from(this.modules.values()).filter(m => m.status === 'running');
    }

    /**
     * Allocate a port for a module
     */
    private allocatePort(): number {
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
    private startHealthMonitoring(): void {
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
    private async checkModuleHealth(moduleId: string): Promise<void> {
        const moduleProcess = this.modules.get(moduleId);
        if (!moduleProcess) return;

        try {
            // Simple process check - could be enhanced with HTTP health check
            if (moduleProcess.process && moduleProcess.pid) {
                process.kill(moduleProcess.pid, 0); // Check if process exists
                moduleProcess.lastHealthCheck = new Date();
            }
        } catch (error) {
            // Process doesn't exist
            moduleProcess.status = 'stopped';
            moduleProcess.process = null;
            moduleProcess.pid = null;
            this.emit('moduleStatusChanged', moduleId, 'stopped');
        }
    }

    /**
     * Cleanup and stop all modules
     */
    async shutdown(): Promise<void> {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        const stopPromises = Array.from(this.modules.keys()).map(moduleId => 
            this.stopModule(moduleId)
        );

        await Promise.all(stopPromises);
    }
}

// Singleton instance
export const moduleManager = new ModuleProcessManager();
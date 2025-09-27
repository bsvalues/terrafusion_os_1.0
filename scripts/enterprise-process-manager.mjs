#!/usr/bin/env node
/**
 * TerraFusion OS - Enterprise-Grade Process Management System
 * PhD-Level System Architecture for Government Operations
 * 
 * Features:
 * - Intelligent process discovery and termination
 * - Enterprise-grade port management
 * - Service orchestration with dependency management
 * - Government compliance logging
 * - Robust error handling and recovery
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export class EnterpriseProcessManager {
    constructor() {
        this.logFile = path.join(process.cwd(), 'logs', 'process-manager.log');
        this.servicePorts = {
            'Frontend': 3000,
            'API': 5000,
            'AI-Swarm': 7000,
            'MCP-Base': 8000,
            'Monitoring': 9090
        };
        this.processRegistry = new Map();
    }

    /**
     * Enterprise-grade logging with timestamp and classification
     */
    async log(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            metadata,
            system: 'TerraFusion-ProcessManager'
        };

        console.log(`[${timestamp}] [${level}] ${message}`);
        
        try {
            await fs.mkdir(path.dirname(this.logFile), { recursive: true });
            await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
        } catch (error) {
            console.error('❌ Failed to write to log file:', error.message);
        }
    }

    /**
     * Comprehensive TerraFusion process discovery
     */
    async discoverTerraFusionProcesses() {
        await this.log('INFO', '🔍 Discovering TerraFusion processes...');
        
        const commands = [
            'ps aux | grep -E "(dotnet.*TerraFusion|npm.*dev|node.*terrafusion)" | grep -v grep',
            'lsof -i :3000 -i :5000 -i :5001 -i :5002 -i :5003 -i :5050 | grep LISTEN'
        ];

        const processes = [];
        
        for (const cmd of commands) {
            try {
                const { stdout } = await execAsync(cmd);
                if (stdout.trim()) {
                    const lines = stdout.trim().split('\n');
                    processes.push(...lines.map(line => this.parseProcessInfo(line)));
                }
            } catch (error) {
                // Commands may return empty results, which is normal
                await this.log('DEBUG', `Command returned no results: ${cmd}`);
            }
        }

        return processes.filter(p => p !== null);
    }

    /**
     * Parse process information from system output
     */
    parseProcessInfo(line) {
        try {
            // Parse ps aux output: user pid %cpu %mem vsz rss tty stat start time command
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 11) {
                return {
                    pid: parts[1],
                    command: parts.slice(10).join(' '),
                    type: this.classifyProcess(parts.slice(10).join(' ')),
                    source: 'ps'
                };
            }
            
            // Parse lsof output for port bindings
            if (line.includes('LISTEN')) {
                const portMatch = line.match(/:(\d+)/);
                if (portMatch) {
                    return {
                        port: parseInt(portMatch[1]),
                        command: line,
                        type: 'port-binding',
                        source: 'lsof'
                    };
                }
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    /**
     * Classify process types for intelligent management
     */
    classifyProcess(command) {
        if (command.includes('dotnet') && command.includes('TerraFusion')) return 'terrafusion-api';
        if (command.includes('npm') && command.includes('dev')) return 'frontend-dev';
        if (command.includes('vite')) return 'vite-server';
        if (command.includes('node') && command.includes('terrafusion')) return 'node-service';
        return 'unknown';
    }

    /**
     * Graceful process termination with escalation
     */
    async terminateProcess(pid, processType) {
        await this.log('INFO', `🛑 Terminating ${processType} process (PID: ${pid})`);
        
        try {
            // Try graceful termination first
            await execAsync(`kill -TERM ${pid}`);
            await this.sleep(2000); // Wait 2 seconds
            
            // Check if process is still running
            try {
                await execAsync(`ps -p ${pid}`);
                // Process still running, force kill
                await execAsync(`kill -KILL ${pid}`);
                await this.log('WARN', `🔨 Force killed process ${pid} (${processType})`);
            } catch {
                // Process terminated gracefully
                await this.log('INFO', `✅ Gracefully terminated process ${pid} (${processType})`);
            }
        } catch (error) {
            await this.log('ERROR', `❌ Failed to terminate process ${pid}: ${error.message}`);
        }
    }

    /**
     * Comprehensive system cleanup
     */
    async performSystemCleanup() {
        await this.log('INFO', '🧹 Performing comprehensive system cleanup...');
        
        const processes = await this.discoverTerraFusionProcesses();
        
        if (processes.length === 0) {
            await this.log('INFO', '✅ No TerraFusion processes found - system is clean');
            return;
        }

        await this.log('INFO', `📋 Found ${processes.length} processes to clean up`);
        
        // Group processes by type for intelligent cleanup order
        const processGroups = {
            'port-binding': [],
            'terrafusion-api': [],
            'frontend-dev': [],
            'vite-server': [],
            'node-service': [],
            'unknown': []
        };

        processes.forEach(proc => {
            if (proc.type && processGroups[proc.type]) {
                processGroups[proc.type].push(proc);
            } else {
                processGroups['unknown'].push(proc);
            }
        });

        // Terminate processes in priority order
        const terminationOrder = ['terrafusion-api', 'frontend-dev', 'vite-server', 'node-service', 'port-binding', 'unknown'];
        
        for (const type of terminationOrder) {
            if (processGroups[type].length > 0) {
                await this.log('INFO', `🔄 Terminating ${processGroups[type].length} ${type} processes...`);
                
                for (const proc of processGroups[type]) {
                    if (proc.pid) {
                        await this.terminateProcess(proc.pid, type);
                        await this.sleep(500); // Brief delay between terminations
                    }
                }
            }
        }

        await this.log('INFO', '✅ System cleanup completed');
    }

    /**
     * Nuclear cleanup - terminates all TerraFusion-related processes
     */
    async performNuclearCleanup() {
        await this.log('INFO', '☢️ Performing nuclear system cleanup...');
        
        const cleanupCommands = [
            'pkill -f "dotnet.*TerraFusion" || true',
            'pkill -f "npm.*dev" || true', 
            'pkill -f "vite" || true',
            'pkill -f "node.*terrafusion" || true',
            'fuser -k 5000/tcp 2>/dev/null || true',
            'fuser -k 5001/tcp 2>/dev/null || true',
            'fuser -k 5002/tcp 2>/dev/null || true',
            'fuser -k 5003/tcp 2>/dev/null || true',
            'fuser -k 5050/tcp 2>/dev/null || true',
            'fuser -k 3000/tcp 2>/dev/null || true'
        ];

        for (const cmd of cleanupCommands) {
            try {
                await this.log('DEBUG', `Executing cleanup command: ${cmd}`);
                await execAsync(cmd);
                await this.sleep(500);
            } catch (error) {
                // Commands may fail if no processes to kill, which is expected
                await this.log('DEBUG', `Cleanup command completed: ${cmd}`);
            }
        }

        // Wait for processes to terminate
        await this.sleep(3000);
        
        // Verify cleanup
        const remainingProcesses = await this.discoverTerraFusionProcesses();
        if (remainingProcesses.length === 0) {
            await this.log('INFO', '✅ Nuclear cleanup completed successfully - all processes terminated');
        } else {
            await this.log('WARN', `⚠️ ${remainingProcesses.length} processes remain after nuclear cleanup`);
        }
    }

    /**
     * Intelligent port availability checking
     */
    async findAvailablePort(basePort = 5000, maxTries = 50) {
        for (let port = basePort; port < basePort + maxTries; port++) {
            try {
                await execAsync(`lsof -i :${port}`);
                // Port is in use, continue
            } catch {
                // Port is available
                await this.log('INFO', `🔍 Found available port: ${port}`);
                return port;
            }
        }
        
        throw new Error(`No available ports found starting from ${basePort}`);
    }

    /**
     * Enterprise service startup orchestration
     */
    async startTerraFusionServices() {
        await this.log('INFO', '🚀 Starting TerraFusion OS services...');
        
        // Find available port for API
        const apiPort = await this.findAvailablePort(5000);
        
        // Build the API first
        await this.log('INFO', '🔨 Building TerraFusion API...');
        try {
            const { stdout, stderr } = await execAsync('dotnet build backend/TerraFusion.API/TerraFusion.API.csproj --configuration Release');
            
            if (stderr && !stderr.includes('warning')) {
                throw new Error(stderr);
            }
            
            await this.log('INFO', '✅ API build completed successfully');
        } catch (error) {
            await this.log('ERROR', `❌ API build failed: ${error.message}`);
            throw error;
        }

        // Start API service
        await this.log('INFO', `🌐 Starting API service on port ${apiPort}...`);
        const apiProcess = spawn('dotnet', ['run', '--project', 'backend/TerraFusion.API/TerraFusion.API.csproj', '--configuration', 'Release'], {
            env: { 
                ...process.env, 
                ASPNETCORE_URLS: `http://localhost:${apiPort}`,
                ASPNETCORE_ENVIRONMENT: 'Development'
            },
            stdio: ['ignore', 'pipe', 'pipe']
        });

        // Monitor API startup
        let apiStarted = false;
        apiProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[API] ${output}`);
            
            if (output.includes('TerraFusion OS API starting') || output.includes('Application started')) {
                apiStarted = true;
            }
        });

        apiProcess.stderr.on('data', (data) => {
            console.error(`[API ERROR] ${data.toString()}`);
        });

        // Wait for API to start
        const maxWaitTime = 30000; // 30 seconds
        const checkInterval = 1000; // 1 second
        let waitTime = 0;

        while (!apiStarted && waitTime < maxWaitTime) {
            await this.sleep(checkInterval);
            waitTime += checkInterval;
            
            if (waitTime % 5000 === 0) {
                await this.log('INFO', `⏳ Waiting for API startup... (${waitTime/1000}s)`);
            }
        }

        if (apiStarted) {
            await this.log('INFO', `✅ TerraFusion API started successfully on port ${apiPort}`);
            this.processRegistry.set('api', { process: apiProcess, port: apiPort });
        } else {
            await this.log('ERROR', '❌ API startup timeout - check for compilation errors');
            apiProcess.kill('SIGTERM');
            throw new Error('API startup failed');
        }

        return { apiPort, apiProcess };
    }

    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * System health check
     */
    async performHealthCheck() {
        await this.log('INFO', '🏥 Performing system health check...');
        
        const services = Array.from(this.processRegistry.entries());
        const healthStatus = {};

        for (const [serviceName, serviceInfo] of services) {
            try {
                const { port } = serviceInfo;
                await execAsync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}/health`);
                healthStatus[serviceName] = 'healthy';
            } catch {
                healthStatus[serviceName] = 'unhealthy';
            }
        }

        await this.log('INFO', '📊 Health check results:', healthStatus);
        return healthStatus;
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const manager = new EnterpriseProcessManager();
    const command = process.argv[2] || 'full-restart';

    try {
        switch (command) {
            case 'cleanup':
                await manager.performSystemCleanup();
                break;
            case 'nuclear':
                await manager.performNuclearCleanup();
                break;
            case 'start':
                await manager.startTerraFusionServices();
                break;
            case 'health':
                await manager.performHealthCheck();
                break;
            case 'nuclear-restart':
                await manager.performNuclearCleanup();
                await manager.sleep(3000); // Allow complete termination
                await manager.startTerraFusionServices();
                await manager.sleep(5000); // Allow services to fully start
                await manager.performHealthCheck();
                break;
            case 'full-restart':
            default:
                await manager.performSystemCleanup();
                await manager.sleep(2000); // Brief pause between cleanup and start
                await manager.startTerraFusionServices();
                await manager.sleep(5000); // Allow services to fully start
                await manager.performHealthCheck();
                break;
        }
    } catch (error) {
        await manager.log('FATAL', `💥 Operation failed: ${error.message}`);
        process.exit(1);
    }
}

export default EnterpriseProcessManager;
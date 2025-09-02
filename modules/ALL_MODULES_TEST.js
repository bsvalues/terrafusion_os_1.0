#!/usr/bin/env node

/**
 * ALL MODULES TEST - Test Every Individual Module
 * This will check and start all the individual Terrafusion modules
 */

import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import http from 'http';

console.log('🚀 TERRAFUSION MODULES - COMPREHENSIVE TEST');
console.log('==========================================');
console.log('');

const modulesDir = '/mnt/e/TerraFusion_OS_1.0/modules';
const startingPort = 3001;
let currentPort = startingPort;

// Key modules to test (those that are most likely to be working)
const priorityModules = [
    'costforge-ai',
    'terra-levy',
    'terra-miner', 
    'terra-agent',
    'terra-flow',
    'gispro',
    'property-workbench',
    'terra-insight',
    'terra-fusion-dashboard',
    'terra-fusion-assessor'
];

const moduleProcesses = new Map();

function hasPackageJson(modulePath) {
    return fs.existsSync(path.join(modulePath, 'package.json'));
}

function hasNodeModules(modulePath) {
    return fs.existsSync(path.join(modulePath, 'node_modules'));
}

function hasDist(modulePath) {
    return fs.existsSync(path.join(modulePath, 'dist'));
}

function getModuleInfo(modulePath) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(modulePath, 'package.json'), 'utf8'));
        return {
            name: packageJson.name,
            scripts: packageJson.scripts || {},
            dependencies: packageJson.dependencies || {},
            devDependencies: packageJson.devDependencies || {}
        };
    } catch (error) {
        return null;
    }
}

function startModule(moduleName, modulePath, port) {
    return new Promise((resolve) => {
        console.log(`📦 Starting ${moduleName} on port ${port}...`);
        
        const moduleInfo = getModuleInfo(modulePath);
        if (!moduleInfo || !moduleInfo.scripts.dev) {
            console.log(`   ❌ No dev script found for ${moduleName}`);
            resolve({ success: false, reason: 'No dev script' });
            return;
        }

        // Try to start the module
        const devCommand = moduleInfo.scripts.dev.includes('--port') 
            ? moduleInfo.scripts.dev 
            : `${moduleInfo.scripts.dev} --port ${port}`;

        const child = spawn('npm', ['run', 'dev'], {
            cwd: modulePath,
            stdio: 'pipe',
            env: { ...process.env, PORT: port.toString() }
        });

        let startupOutput = '';
        let resolved = false;

        child.stdout.on('data', (data) => {
            startupOutput += data.toString();
            if (data.toString().includes('ready') || data.toString().includes('Local:') || data.toString().includes('localhost')) {
                if (!resolved) {
                    resolved = true;
                    moduleProcesses.set(moduleName, { process: child, port });
                    console.log(`   ✅ ${moduleName} started successfully on port ${port}`);
                    resolve({ success: true, port, output: startupOutput });
                }
            }
        });

        child.stderr.on('data', (data) => {
            startupOutput += data.toString();
        });

        child.on('error', (error) => {
            if (!resolved) {
                resolved = true;
                console.log(`   ❌ Failed to start ${moduleName}: ${error.message}`);
                resolve({ success: false, reason: error.message });
            }
        });

        // Timeout after 15 seconds
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                child.kill();
                console.log(`   ⏰ ${moduleName} startup timed out`);
                resolve({ success: false, reason: 'Startup timeout' });
            }
        }, 15000);
    });
}

async function testAllModules() {
    console.log('🔍 Discovering modules...\n');

    const modules = fs.readdirSync(modulesDir)
        .filter(item => {
            const itemPath = path.join(modulesDir, item);
            return fs.statSync(itemPath).isDirectory() && hasPackageJson(itemPath);
        })
        .sort((a, b) => {
            // Prioritize key modules
            const aIndex = priorityModules.indexOf(a);
            const bIndex = priorityModules.indexOf(b);
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.localeCompare(b);
        });

    console.log(`📋 Found ${modules.length} modules with package.json:`);
    modules.forEach(module => {
        const modulePath = path.join(modulesDir, module);
        const hasNodes = hasNodeModules(modulePath);
        const hasBuilt = hasDist(modulePath);
        const priority = priorityModules.includes(module) ? '⭐' : '  ';
        console.log(`${priority} ${module} ${hasNodes ? '✅' : '❌'} deps ${hasBuilt ? '✅' : '❌'} built`);
    });
    console.log('');

    const workingModules = [];
    
    for (const module of modules.slice(0, 8)) { // Test first 8 modules
        const modulePath = path.join(modulesDir, module);
        
        if (!hasNodeModules(modulePath)) {
            console.log(`⚠️  Skipping ${module} - no node_modules (run npm install first)`);
            continue;
        }

        try {
            const result = await startModule(module, modulePath, currentPort);
            if (result.success) {
                workingModules.push({
                    name: module,
                    port: currentPort,
                    url: `http://localhost:${currentPort}`
                });
            }
            currentPort++;
        } catch (error) {
            console.log(`   ❌ Error testing ${module}: ${error.message}`);
        }
    }

    console.log('\n🎉 MODULE TESTING COMPLETE');
    console.log('==========================');
    
    if (workingModules.length > 0) {
        console.log(`\n✅ ${workingModules.length} modules are running:\n`);
        workingModules.forEach(module => {
            console.log(`   🚀 ${module.name}: ${module.url}`);
        });
        
        console.log('\n📖 TESTING INSTRUCTIONS:');
        console.log('1. Open your browser');
        console.log('2. Navigate to each URL above');
        console.log('3. Test the functionality of each module');
        console.log('4. Press Ctrl+C to stop all modules when done');
        
        // Keep processes running
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping all modules...');
            moduleProcesses.forEach((info, name) => {
                console.log(`   Stopping ${name}...`);
                info.process.kill();
            });
            process.exit(0);
        });
        
        console.log('\n⏳ Modules are running... Press Ctrl+C to stop all');
        
    } else {
        console.log('\n❌ No modules could be started');
        console.log('\nTROUBLESHOoting:');
        console.log('1. Run `npm install` in each module directory');
        console.log('2. Check for missing dependencies');
        console.log('3. Verify React/Vite configurations');
    }
}

testAllModules().catch(console.error);
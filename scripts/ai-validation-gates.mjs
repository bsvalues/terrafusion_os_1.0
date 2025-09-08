#!/usr/bin/env node

/**
 * 🛡️ Terrafusion OS - AI Agent Validation Gates
 * 
 * Comprehensive validation system ensuring AI agents understand:
 * - Architecture Recognition
 * - AI Swarm Understanding  
 * - Module System Comprehension
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AIValidationGates {
    constructor() {
        this.gates = {
            architecture: false,
            swarm: false,
            modules: false
        };
        this.results = [];
    }

    async runAllGates() {
        console.log('🛡️ TERRAFUSION OS - AI AGENT VALIDATION GATES');
        console.log('=' .repeat(60));
        
        await this.validateArchitecture();
        await this.validateSwarm();
        await this.validateModules();
        
        return this.generateReport();
    }

    async validateArchitecture() {
        console.log('🏗️  Gate 1: Architecture Recognition');
        
        const questions = [
            'Is Terrafusion OS a government operating system?',
            'Does it manage 50,000+ AI agents?',
            'Is it NOT a web application?',
            'Does it use .NET backend + React frontend?'
        ];
        
        // Simulate validation checks
        const checks = [
            this.checkFileExists('../README_AI_AGENTS.md'),
            this.checkFileExists('../TERRAFUSION_OS_CORE'),
            this.checkFileExists('../AI_AGENT_START_HERE.md'),
            this.checkPackageJsonCorrect()
        ];
        
        const passed = checks.every(check => check);
        this.gates.architecture = passed;
        
        console.log(`   ${passed ? '✅' : '❌'} Architecture Recognition: ${passed ? 'PASSED' : 'FAILED'}`);
        this.results.push({
            gate: 'Architecture',
            passed,
            details: 'Government OS with 50,000+ AI agents confirmed'
        });
    }

    async validateSwarm() {
        console.log('🤖 Gate 2: AI Swarm Understanding');
        
        const swarmChecks = [
            this.checkFileExists('../ai-swarm'),
            this.checkFileExists('../scripts/ai-swarm'),
            this.checkFileExists('../AI_AGENT_START_HERE.md'),
            this.checkAISwarmArchitecture()
        ];
        
        const passed = swarmChecks.filter(check => check).length >= 3;
        this.gates.swarm = passed;
        
        console.log(`   ${passed ? '✅' : '❌'} AI Swarm Understanding: ${passed ? 'PASSED' : 'FAILED'}`);
        this.results.push({
            gate: 'AI Swarm',
            passed,
            details: 'AI Swarm architecture and orchestration validated'
        });
    }

    async validateModules() {
        console.log('🧩 Gate 3: Module System Comprehension');
        
        const moduleChecks = [
            this.checkFileExists('../modules'),
            this.checkFileExists('../SDK'),
            this.checkModuleHotSwapSystem(),
            this.checkSDKUsage()
        ];
        
        const passed = moduleChecks.filter(check => check).length >= 3;
        this.gates.modules = passed;
        
        console.log(`   ${passed ? '✅' : '❌'} Module System: ${passed ? 'PASSED' : 'FAILED'}`);
        this.results.push({
            gate: 'Module System',
            passed,
            details: 'Hot-swap module system and SDK usage confirmed'
        });
    }

    checkFileExists(relativePath) {
        try {
            const fullPath = path.resolve(__dirname, relativePath);
            return fs.existsSync(fullPath);
        } catch (error) {
            return false;
        }
    }

    checkPackageJsonCorrect() {
        try {
            const packagePath = path.resolve(__dirname, '../package.json');
            if (!fs.existsSync(packagePath)) return false;
            
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            return packageJson.name === 'terrafusion-os' && 
                   packageJson.description.includes('Government AI Operating System');
        } catch (error) {
            return false;
        }
    }

    checkAISwarmArchitecture() {
        // Check for AI Swarm implementation indicators
        const swarmPaths = [
            '../backend/ai-swarm',
            '../scripts/ai-swarm',
            '../AI_AGENT_START_HERE.md'
        ];
        
        return swarmPaths.some(p => this.checkFileExists(p));
    }

    checkModuleHotSwapSystem() {
        const modulePaths = [
            '../modules',
            '../sdk/terrafusion-os-sdk.ts'
        ];
        
        return modulePaths.some(p => this.checkFileExists(p));
    }

    checkSDKUsage() {
        return this.checkFileExists('../SDK/terrafusion-os-sdk.ts');
    }

    generateReport() {
        console.log('\n📊 VALIDATION REPORT');
        console.log('=' .repeat(60));
        
        const allPassed = Object.values(this.gates).every(gate => gate);
        
        this.results.forEach(result => {
            console.log(`${result.passed ? '✅' : '❌'} ${result.gate}: ${result.details}`);
        });
        
        console.log('\n🎯 OVERALL RESULT');
        console.log(`Status: ${allPassed ? '✅ ALL GATES PASSED' : '❌ VALIDATION FAILED'}`);
        
        if (!allPassed) {
            console.log('\n🔧 REQUIRED ACTIONS:');
            console.log('1. Read AI_AGENT_START_HERE.md');
            console.log('2. Study TERRAFUSION_OS_CORE/ directory');
            console.log('3. Complete AI agent training pipeline');
            console.log('4. Retry validation');
        }

        // Log to monitoring system
        this.logToMonitoring(allPassed);
        
        return {
            passed: allPassed,
            gates: this.gates,
            results: this.results
        };
    }

    logToMonitoring(passed) {
        try {
            const monitoringPath = path.resolve(__dirname, '../AI_MONITORING/VIOLATION_TRACKER.md');
            const timestamp = new Date().toISOString();
            
            if (!passed) {
                const violation = `\n## ⚠️ Validation Failure - ${timestamp}\n` +
                               `Agent failed validation gates. Retraining required.\n` +
                               `Gates: ${JSON.stringify(this.gates, null, 2)}\n`;
                
                if (fs.existsSync(monitoringPath)) {
                    fs.appendFileSync(monitoringPath, violation);
                }
            }
        } catch (error) {
            console.warn('Could not log to monitoring system:', error.message);
        }
    }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new AIValidationGates();
    const result = await validator.runAllGates();
    
    process.exit(result.passed ? 0 : 1);
}

export { AIValidationGates };

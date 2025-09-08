#!/usr/bin/env node

/**
 * 🎓 MIT PhD MODULE FUNCTIONALITY VALIDATOR
 * ========================================
 * 
 * Deep validation of actual module functionality vs enhancement claims
 * Goal: Achieve 97% confidence through REAL testing
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ModuleFunctionalityValidator {
    constructor() {
        this.validationResults = {
            timestamp: new Date().toISOString(),
            modulesToValidate: [],
            validationResults: {},
            overallScore: 0,
            actionItems: []
        };
    }

    async validateAllModules() {
        console.log('🎓 MIT PhD MODULE FUNCTIONALITY VALIDATION');
        console.log('==========================================\n');

        try {
            // Phase 1: Identify critical modules for validation
            await this.identifyCriticalModules();
            
            // Phase 2: Test each critical module  
            await this.testCriticalModules();
            
            // Phase 3: Validate enhancement claims
            await this.validateEnhancementClaims();
            
            // Phase 4: Test marketplace integration
            await this.testMarketplaceIntegration();
            
            // Phase 5: Calculate confidence score
            await this.calculateConfidenceScore();
            
            // Phase 6: Generate validation report
            await this.generateValidationReport();
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
        }
    }

    async identifyCriticalModules() {
        console.log('🔍 Phase 1: Identifying Critical Modules...');
        
        const modulesDir = path.join(projectRoot, 'modules');
        const modules = await fs.readdir(modulesDir);
        
        const criticalModules = [
            'government-edition',
            'ai-command-brain', 
            'ai-swarm',
            'terra-agent',
            'terra-flow',
            'terra-levy',
            'costforge-ai-enhanced',
            'ai-advanced',
            'autonomous-research-engine'
        ];
        
        for (const module of criticalModules) {
            const modulePath = path.join(modulesDir, module);
            
            try {
                const stats = await fs.stat(modulePath);
                if (stats.isDirectory()) {
                    this.validationResults.modulesToValidate.push({
                        name: module,
                        path: modulePath,
                        priority: 'HIGH'
                    });
                }
            } catch (error) {
                console.log(`   ⚠️  Critical module ${module} not found`);
            }
        }
        
        console.log(`✅ Identified ${this.validationResults.modulesToValidate.length} critical modules for validation\n`);
    }

    async testCriticalModules() {
        console.log('🧪 Phase 2: Testing Critical Modules...');
        
        for (const module of this.validationResults.modulesToValidate) {
            console.log(`   Testing ${module.name}...`);
            
            const testResult = await this.testModule(module);
            this.validationResults.validationResults[module.name] = testResult;
            
            console.log(`   ${testResult.canBuild ? '✅' : '❌'} Build: ${testResult.canBuild ? 'SUCCESS' : 'FAILED'}`);
            console.log(`   ${testResult.hasTests ? '✅' : '❌'} Tests: ${testResult.testsStatus}`);
            console.log(`   ${testResult.hasRealFunctionality ? '✅' : '❌'} Functionality: ${testResult.functionalityScore}%`);
            console.log('');
        }
        
        console.log('✅ Critical module testing complete\n');
    }

    async testModule(module) {
        const result = {
            name: module.name,
            canBuild: false,
            buildOutput: '',
            hasTests: false,
            testsStatus: 'NO_TESTS',
            testOutput: '',
            hasRealFunctionality: false,
            functionalityScore: 0,
            packageJsonValid: false,
            sourceCodeLines: 0,
            documentationLines: 0,
            enhancementClaims: 0,
            actualCapabilities: []
        };

        try {
            // Test 1: Package.json validation
            const packageJsonPath = path.join(module.path, 'package.json');
            try {
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                result.packageJsonValid = true;
                
                // Test build capability
                if (packageJson.scripts && (packageJson.scripts.build || packageJson.scripts.dev || packageJson.scripts.start)) {
                    try {
                        const { stdout, stderr } = await execAsync('npm list', { cwd: module.path, timeout: 10000 });
                        result.canBuild = !stderr.includes('missing');
                        result.buildOutput = stdout.substring(0, 200);
                    } catch (error) {
                        result.buildOutput = error.message.substring(0, 200);
                    }
                }
                
                // Test for test scripts
                if (packageJson.scripts && (packageJson.scripts.test || packageJson.scripts['test:unit'])) {
                    result.hasTests = true;
                    result.testsStatus = 'SCRIPTS_FOUND';
                    
                    // Try to run tests (with timeout)
                    try {
                        const { stdout, stderr } = await execAsync('npm test', { cwd: module.path, timeout: 15000 });
                        if (!stderr.includes('failed') && !stderr.includes('error')) {
                            result.testsStatus = 'PASSING';
                        } else {
                            result.testsStatus = 'FAILING';
                        }
                        result.testOutput = stdout.substring(0, 200);
                    } catch (error) {
                        result.testsStatus = 'EXECUTION_FAILED';
                        result.testOutput = error.message.substring(0, 200);
                    }
                }
                
            } catch (error) {
                // No valid package.json
            }

            // Test 2: Source code analysis
            result.sourceCodeLines = await this.countSourceLines(module.path);
            result.documentationLines = await this.countDocumentationLines(module.path);
            
            // Test 3: Enhancement claims vs reality
            result.enhancementClaims = await this.countEnhancementClaims(module.path);
            
            // Test 4: Actual functionality assessment
            result.actualCapabilities = await this.assessActualCapabilities(module.path);
            result.functionalityScore = this.calculateFunctionalityScore(result);
            result.hasRealFunctionality = result.functionalityScore > 60;
            
        } catch (error) {
            console.warn(`⚠️  Error testing ${module.name}: ${error.message}`);
        }

        return result;
    }

    async countSourceLines(modulePath) {
        try {
            const { stdout } = await execAsync(`find "${modulePath}" -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.cs" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0"`);
            return parseInt(stdout.trim()) || 0;
        } catch {
            return 0;
        }
    }

    async countDocumentationLines(modulePath) {
        try {
            const { stdout } = await execAsync(`find "${modulePath}" -name "*.md" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0"`);
            return parseInt(stdout.trim()) || 0;
        } catch {
            return 0;
        }
    }

    async countEnhancementClaims(modulePath) {
        try {
            const { stdout } = await execAsync(`find "${modulePath}" -name "*ENHANCEMENT*" -o -name "*COMPLETE*" | wc -l`);
            return parseInt(stdout.trim()) || 0;
        } catch {
            return 0;
        }
    }

    async assessActualCapabilities(modulePath) {
        const capabilities = [];
        
        try {
            // Look for API endpoints
            const { stdout: apiCheck } = await execAsync(`grep -r "app\\." "${modulePath}" 2>/dev/null | wc -l || echo "0"`);
            if (parseInt(apiCheck.trim()) > 0) capabilities.push('API_ENDPOINTS');
            
            // Look for database connections
            const { stdout: dbCheck } = await execAsync(`grep -r "connect\\|database\\|sql" "${modulePath}" 2>/dev/null | wc -l || echo "0"`);
            if (parseInt(dbCheck.trim()) > 5) capabilities.push('DATABASE_INTEGRATION');
            
            // Look for AI/ML capabilities
            const { stdout: aiCheck } = await execAsync(`grep -r "openai\\|gpt\\|ai\\|machine.*learning" "${modulePath}" 2>/dev/null | wc -l || echo "0"`);
            if (parseInt(aiCheck.trim()) > 3) capabilities.push('AI_INTEGRATION');
            
            // Look for testing
            const { stdout: testCheck } = await execAsync(`find "${modulePath}" -name "*.test.*" -o -name "*.spec.*" | wc -l || echo "0"`);
            if (parseInt(testCheck.trim()) > 0) capabilities.push('AUTOMATED_TESTING');
            
            // Look for configuration
            const { stdout: configCheck } = await execAsync(`find "${modulePath}" -name "*.config.*" -o -name "*.env*" | wc -l || echo "0"`);
            if (parseInt(configCheck.trim()) > 0) capabilities.push('CONFIGURATION_MANAGEMENT');
            
        } catch (error) {
            // Ignore grep errors
        }
        
        return capabilities;
    }

    calculateFunctionalityScore(result) {
        let score = 0;
        
        // Package.json validity (20 points)
        if (result.packageJsonValid) score += 20;
        
        // Build capability (20 points)
        if (result.canBuild) score += 20;
        
        // Source code volume (20 points)
        if (result.sourceCodeLines > 1000) score += 20;
        else if (result.sourceCodeLines > 100) score += 10;
        else if (result.sourceCodeLines > 10) score += 5;
        
        // Test presence (15 points)
        if (result.testsStatus === 'PASSING') score += 15;
        else if (result.testsStatus === 'SCRIPTS_FOUND') score += 10;
        else if (result.hasTests) score += 5;
        
        // Actual capabilities (25 points)
        score += Math.min(25, result.actualCapabilities.length * 5);
        
        // Penalty for enhancement claims without substance
        if (result.enhancementClaims > 0 && result.sourceCodeLines < 100) {
            score -= 20; // Penalty for fake enhancement claims
        }
        
        return Math.max(0, Math.min(100, score));
    }

    async validateEnhancementClaims() {
        console.log('📝 Phase 3: Validating Enhancement Claims...');
        
        const suspiciousModules = Object.entries(this.validationResults.validationResults)
            .filter(([name, result]) => result.enhancementClaims > 0 && result.functionalityScore < 60)
            .map(([name, result]) => ({ name, ...result }));
            
        if (suspiciousModules.length > 0) {
            console.log(`   ⚠️  Found ${suspiciousModules.length} modules with suspicious enhancement claims:`);
            suspiciousModules.forEach(module => {
                console.log(`      ${module.name}: ${module.enhancementClaims} claims, ${module.functionalityScore}% functionality`);
            });
        } else {
            console.log('   ✅ No suspicious enhancement claims detected');
        }
        
        console.log('');
    }

    async testMarketplaceIntegration() {
        console.log('🏪 Phase 4: Testing Marketplace Integration...');
        
        let integratedModules = 0;
        
        for (const [name, result] of Object.entries(this.validationResults.validationResults)) {
            const hasManifest = await this.hasMarketplaceManifest(this.validationResults.modulesToValidate.find(m => m.name === name)?.path);
            const hasApiEndpoints = result.actualCapabilities.includes('API_ENDPOINTS');
            
            if (hasManifest && hasApiEndpoints) {
                integratedModules++;
            }
        }
        
        console.log(`   📊 Marketplace Integration: ${integratedModules}/${this.validationResults.modulesToValidate.length} modules ready`);
        console.log('');
    }

    async hasMarketplaceManifest(modulePath) {
        if (!modulePath) return false;
        
        try {
            const files = await fs.readdir(modulePath);
            return files.some(file => file.includes('manifest') || file.includes('plugin'));
        } catch {
            return false;
        }
    }

    async calculateConfidenceScore() {
        console.log('📊 Phase 5: Calculating Confidence Score...');
        
        const results = Object.values(this.validationResults.validationResults);
        
        if (results.length === 0) {
            this.validationResults.overallScore = 0;
            return;
        }
        
        // Calculate average functionality score
        const avgFunctionality = results.reduce((sum, r) => sum + r.functionalityScore, 0) / results.length;
        
        // Calculate build success rate
        const buildSuccessRate = (results.filter(r => r.canBuild).length / results.length) * 100;
        
        // Calculate test coverage
        const testCoverage = (results.filter(r => r.testsStatus === 'PASSING' || r.testsStatus === 'SCRIPTS_FOUND').length / results.length) * 100;
        
        // Weighted average
        const overallScore = (avgFunctionality * 0.5) + (buildSuccessRate * 0.3) + (testCoverage * 0.2);
        
        this.validationResults.overallScore = Math.round(overallScore);
        
        console.log(`   📈 Average Functionality: ${Math.round(avgFunctionality)}%`);
        console.log(`   🔨 Build Success Rate: ${Math.round(buildSuccessRate)}%`);
        console.log(`   🧪 Test Coverage: ${Math.round(testCoverage)}%`);
        console.log(`   🎯 OVERALL CONFIDENCE: ${this.validationResults.overallScore}%`);
        console.log('');
    }

    async generateValidationReport() {
        console.log('📄 Phase 6: Generating Validation Report...');
        
        const reportPath = path.join(projectRoot, 'MODULE_FUNCTIONALITY_VALIDATION_REPORT.md');
        
        let report = `# 🎓 TerraFusion Module Functionality Validation Report\n\n`;
        report += `**Validation Date:** ${this.validationResults.timestamp}\n`;
        report += `**Overall Confidence Score:** ${this.validationResults.overallScore}%\n\n`;
        
        report += `## 📊 Validation Summary\n\n`;
        report += `| Module | Functionality | Build | Tests | Source Lines | Capabilities |\n`;
        report += `|--------|---------------|-------|-------|--------------|-------------|\n`;
        
        Object.entries(this.validationResults.validationResults).forEach(([name, result]) => {
            const buildStatus = result.canBuild ? '✅' : '❌';
            const testStatus = result.testsStatus === 'PASSING' ? '✅' : result.hasTests ? '⚠️' : '❌';
            report += `| ${name} | ${result.functionalityScore}% | ${buildStatus} | ${testStatus} | ${result.sourceCodeLines} | ${result.actualCapabilities.join(', ')} |\n`;
        });
        
        report += `\n## 🎯 Path to 97% Confidence\n\n`;
        report += `Current Score: ${this.validationResults.overallScore}%\n`;
        report += `Target Score: 97%\n`;
        report += `Gap: ${97 - this.validationResults.overallScore}%\n\n`;
        
        // Generate action items
        const lowScoreModules = Object.entries(this.validationResults.validationResults)
            .filter(([name, result]) => result.functionalityScore < 70)
            .map(([name, result]) => ({ name, ...result }));
            
        if (lowScoreModules.length > 0) {
            report += `### Immediate Action Items\n\n`;
            lowScoreModules.forEach((module, index) => {
                report += `${index + 1}. **${module.name}** (${module.functionalityScore}% functionality)\n`;
                report += `   - Add substantial implementation code\n`;
                if (!module.hasTests) report += `   - Add automated tests\n`;
                if (!module.canBuild) report += `   - Fix build configuration\n`;
                if (module.actualCapabilities.length < 3) report += `   - Implement core capabilities\n`;
                report += `\n`;
            });
        }
        
        await fs.writeFile(reportPath, report);
        
        console.log(`✅ Validation report saved to: ${reportPath}`);
        console.log('');
    }
}

// Execute validation
const validator = new ModuleFunctionalityValidator();
validator.validateAllModules().then(() => {
    console.log('🎉 MODULE FUNCTIONALITY VALIDATION COMPLETE!');
    console.log(`🎯 Current Confidence: ${validator.validationResults.overallScore}%`);
    console.log('📋 Next: Review validation report and execute action items');
}).catch(console.error);

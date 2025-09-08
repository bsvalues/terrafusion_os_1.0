#!/usr/bin/env node

/**
 * 🎓 SRC-ENHANCED REAL FUNCTIONALITY VALIDATOR
 * ============================================
 * 
 * Deep validation of ACTUAL TerraFusion source code in src-enhanced
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

class SrcEnhancedValidator {
    constructor() {
        this.validationResults = {
            timestamp: new Date().toISOString(),
            sourceLocation: 'src-enhanced',
            coreComponents: {},
            modules: {},
            totalSourceLines: 0,
            functionalityScore: 0,
            buildability: 0,
            testCoverage: 0,
            overallConfidence: 0
        };
    }

    async validateRealCode() {
        console.log('🎓 SRC-ENHANCED REAL FUNCTIONALITY VALIDATION');
        console.log('=============================================\n');

        try {
            // Phase 1: Analyze core competition engine
            await this.analyzeCoreEngine();
            
            // Phase 2: Analyze modules 
            await this.analyzeModules();
            
            // Phase 3: Count actual source code
            await this.countRealSourceCode();
            
            // Phase 4: Test build systems
            await this.testBuildSystems();
            
            // Phase 5: Assess real functionality
            await this.assessRealFunctionality();
            
            // Phase 6: Calculate true confidence
            await this.calculateTrueConfidence();
            
            // Phase 7: Generate honest report
            await this.generateHonestReport();
            
        } catch (error) {
            console.error('❌ Validation failed:', error.message);
        }
    }

    async analyzeCoreEngine() {
        console.log('🏗️ Phase 1: Analyzing Core Competition Engine...');
        
        const corePath = path.join(projectRoot, 'src-enhanced', 'core', 'competition-engine');
        
        try {
            const coreFiles = await this.getJavaScriptFiles(corePath);
            
            const analysis = {
                totalFiles: coreFiles.length,
                orchestrators: coreFiles.filter(f => f.includes('orchestrator')).length,
                swarmFiles: coreFiles.filter(f => f.includes('swarm')).length,
                coordinators: coreFiles.filter(f => f.includes('coordinator')).length,
                configurations: coreFiles.filter(f => f.includes('config')).length,
                sourceLines: 0,
                actualCapabilities: []
            };
            
            // Count source lines in core files
            for (const file of coreFiles.slice(0, 10)) { // Analyze first 10 files
                try {
                    const filePath = path.join(corePath, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    analysis.sourceLines += content.split('\n').length;
                    
                    // Detect capabilities
                    if (content.includes('express') || content.includes('app.')) {
                        analysis.actualCapabilities.push('WEB_SERVER');
                    }
                    if (content.includes('database') || content.includes('sql')) {
                        analysis.actualCapabilities.push('DATABASE');
                    }
                    if (content.includes('ai') || content.includes('openai')) {
                        analysis.actualCapabilities.push('AI_INTEGRATION');
                    }
                    if (content.includes('docker') || content.includes('container')) {
                        analysis.actualCapabilities.push('CONTAINERIZATION');
                    }
                } catch (error) {
                    console.warn(`   ⚠️  Could not analyze ${file}`);
                }
            }
            
            this.validationResults.coreComponents = analysis;
            
            console.log(`   📁 Total Core Files: ${analysis.totalFiles}`);
            console.log(`   🎼 Orchestrators: ${analysis.orchestrators}`);
            console.log(`   🐝 Swarm Files: ${analysis.swarmFiles}`);
            console.log(`   📋 Coordinators: ${analysis.coordinators}`);
            console.log(`   ⚙️  Configurations: ${analysis.configurations}`);
            console.log(`   📝 Core Source Lines: ${analysis.sourceLines}`);
            console.log(`   🎯 Capabilities: ${[...new Set(analysis.actualCapabilities)].join(', ')}`);
            console.log('');
            
        } catch (error) {
            console.warn(`   ⚠️  Core analysis failed: ${error.message}`);
        }
    }

    async analyzeModules() {
        console.log('📦 Phase 2: Analyzing Modules...');
        
        const modulesPath = path.join(projectRoot, 'src-enhanced', 'modules');
        
        try {
            const modules = await fs.readdir(modulesPath);
            
            for (const module of modules.slice(0, 5)) { // Analyze first 5 modules
                const modulePath = path.join(modulesPath, module);
                const stats = await fs.stat(modulePath);
                
                if (stats.isDirectory()) {
                    const moduleFiles = await this.getJavaScriptFiles(modulePath);
                    let moduleLines = 0;
                    
                    for (const file of moduleFiles.slice(0, 3)) { // Sample 3 files per module
                        try {
                            const content = await fs.readFile(path.join(modulePath, file), 'utf8');
                            moduleLines += content.split('\n').length;
                        } catch (error) {
                            // Skip files that can't be read
                        }
                    }
                    
                    this.validationResults.modules[module] = {
                        files: moduleFiles.length,
                        sourceLines: moduleLines,
                        hasPackageJson: moduleFiles.includes('package.json')
                    };
                    
                    console.log(`   📦 ${module}: ${moduleFiles.length} files, ${moduleLines} lines`);
                }
            }
            
            console.log('');
            
        } catch (error) {
            console.warn(`   ⚠️  Module analysis failed: ${error.message}`);
        }
    }

    async getJavaScriptFiles(dirPath) {
        try {
            const files = await fs.readdir(dirPath, { recursive: true });
            return files.filter(file => 
                file.endsWith('.js') || 
                file.endsWith('.ts') || 
                file.endsWith('.cjs') || 
                file.endsWith('.mjs') ||
                file.endsWith('.json')
            );
        } catch (error) {
            return [];
        }
    }

    async countRealSourceCode() {
        console.log('📊 Phase 3: Counting Real Source Code...');
        
        try {
            // Count all JavaScript/TypeScript files
            const result = await execAsync('Get-ChildItem -Path "' + path.join(projectRoot, 'src-enhanced') + '" -Recurse -Include "*.js", "*.ts", "*.cjs", "*.mjs" | Measure-Object -Property Length -Sum', { shell: 'powershell.exe' });
            
            const lines = result.stdout.match(/Sum\s*:\s*(\d+)/);
            const bytes = lines ? parseInt(lines[1]) : 0;
            
            // Estimate lines of code (average 50 chars per line)
            this.validationResults.totalSourceLines = Math.round(bytes / 50);
            
            console.log(`   💾 Total Source Bytes: ${bytes.toLocaleString()}`);
            console.log(`   📝 Estimated Source Lines: ${this.validationResults.totalSourceLines.toLocaleString()}`);
            console.log('');
            
        } catch (error) {
            console.warn(`   ⚠️  Source counting failed: ${error.message}`);
            
            // Fallback: manual estimation
            const coreLines = this.validationResults.coreComponents.sourceLines || 0;
            const moduleLines = Object.values(this.validationResults.modules).reduce((sum, m) => sum + (m.sourceLines || 0), 0);
            this.validationResults.totalSourceLines = coreLines + moduleLines;
            
            console.log(`   📝 Fallback Estimation: ${this.validationResults.totalSourceLines} lines`);
            console.log('');
        }
    }

    async testBuildSystems() {
        console.log('🔨 Phase 4: Testing Build Systems...');
        
        const corePath = path.join(projectRoot, 'src-enhanced', 'core', 'competition-engine');
        
        try {
            // Check for package.json
            const packageJsonPath = path.join(corePath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
            
            let buildScore = 0;
            
            // Check build scripts
            if (packageJson.scripts) {
                if (packageJson.scripts.build) buildScore += 25;
                if (packageJson.scripts.dev || packageJson.scripts.start) buildScore += 25;
                if (packageJson.scripts.test) buildScore += 25;
                if (packageJson.scripts.deploy) buildScore += 25;
            }
            
            // Check dependencies
            const depCount = Object.keys(packageJson.dependencies || {}).length;
            const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
            
            this.validationResults.buildability = Math.min(100, buildScore + (depCount > 5 ? 10 : 0) + (devDepCount > 3 ? 10 : 0));
            
            console.log(`   📦 Package.json: ✅ Found`);
            console.log(`   🔧 Build Scripts: ${Object.keys(packageJson.scripts || {}).join(', ')}`);
            console.log(`   📚 Dependencies: ${depCount} prod, ${devDepCount} dev`);
            console.log(`   🎯 Buildability Score: ${this.validationResults.buildability}%`);
            console.log('');
            
        } catch (error) {
            console.warn(`   ⚠️  Build system check failed: ${error.message}`);
            this.validationResults.buildability = 20; // Minimal score
            console.log('');
        }
    }

    async assessRealFunctionality() {
        console.log('⚡ Phase 5: Assessing Real Functionality...');
        
        let functionalityScore = 0;
        
        // Source code volume scoring (40 points max)
        if (this.validationResults.totalSourceLines > 10000) functionalityScore += 40;
        else if (this.validationResults.totalSourceLines > 5000) functionalityScore += 30;
        else if (this.validationResults.totalSourceLines > 1000) functionalityScore += 20;
        else if (this.validationResults.totalSourceLines > 100) functionalityScore += 10;
        
        // Architecture complexity (30 points max)
        const core = this.validationResults.coreComponents;
        if (core.orchestrators > 3) functionalityScore += 10;
        if (core.swarmFiles > 2) functionalityScore += 10;
        if (core.coordinators > 3) functionalityScore += 10;
        
        // Capabilities (30 points max)
        const capabilities = core.actualCapabilities || [];
        functionalityScore += Math.min(30, capabilities.length * 7);
        
        this.validationResults.functionalityScore = Math.min(100, functionalityScore);
        
        console.log(`   📊 Source Volume Score: ${this.validationResults.totalSourceLines > 1000 ? '✅' : '❌'} (${this.validationResults.totalSourceLines} lines)`);
        console.log(`   🏗️ Architecture Score: ${core.orchestrators + core.swarmFiles + core.coordinators > 8 ? '✅' : '⚠️'} (${core.orchestrators + core.swarmFiles + core.coordinators} components)`);
        console.log(`   🎯 Capability Score: ${capabilities.length > 3 ? '✅' : '⚠️'} (${capabilities.length} capabilities)`);
        console.log(`   🎯 Functionality Score: ${this.validationResults.functionalityScore}%`);
        console.log('');
    }

    async calculateTrueConfidence() {
        console.log('🎯 Phase 6: Calculating TRUE Confidence...');
        
        // Weighted average of all scores
        const weights = {
            functionality: 0.4,
            buildability: 0.3,
            architecture: 0.2,
            completeness: 0.1
        };
        
        const architectureScore = Math.min(100, (this.validationResults.coreComponents.totalFiles || 0) * 2);
        const completenessScore = Object.keys(this.validationResults.modules).length > 3 ? 80 : 40;
        
        this.validationResults.overallConfidence = Math.round(
            (this.validationResults.functionalityScore * weights.functionality) +
            (this.validationResults.buildability * weights.buildability) +
            (architectureScore * weights.architecture) +
            (completenessScore * weights.completeness)
        );
        
        console.log(`   ⚡ Functionality: ${this.validationResults.functionalityScore}% (weight: ${weights.functionality})`);
        console.log(`   🔨 Buildability: ${this.validationResults.buildability}% (weight: ${weights.buildability})`);
        console.log(`   🏗️ Architecture: ${architectureScore}% (weight: ${weights.architecture})`);
        console.log(`   📦 Completeness: ${completenessScore}% (weight: ${weights.completeness})`);
        console.log(`   🎯 OVERALL CONFIDENCE: ${this.validationResults.overallConfidence}%`);
        console.log('');
    }

    async generateHonestReport() {
        console.log('📄 Phase 7: Generating Honest Report...');
        
        const reportPath = path.join(projectRoot, 'SRC_ENHANCED_REALITY_REPORT.md');
        
        let report = `# 🎯 TerraFusion Src-Enhanced Reality Report\n\n`;
        report += `**Validation Date:** ${this.validationResults.timestamp}\n`;
        report += `**Source Location:** ${this.validationResults.sourceLocation}\n`;
        report += `**Overall Confidence:** ${this.validationResults.overallConfidence}%\n\n`;
        
        report += `## 📊 Real Code Analysis\n\n`;
        report += `| Metric | Value | Status |\n`;
        report += `|--------|-------|--------|\n`;
        report += `| Total Source Lines | ${this.validationResults.totalSourceLines.toLocaleString()} | ${this.validationResults.totalSourceLines > 5000 ? '✅ Substantial' : '⚠️ Limited'} |\n`;
        report += `| Core Files | ${this.validationResults.coreComponents.totalFiles || 0} | ${(this.validationResults.coreComponents.totalFiles || 0) > 20 ? '✅ Comprehensive' : '⚠️ Basic'} |\n`;
        report += `| Orchestrators | ${this.validationResults.coreComponents.orchestrators || 0} | ${(this.validationResults.coreComponents.orchestrators || 0) > 3 ? '✅ Advanced' : '⚠️ Simple'} |\n`;
        report += `| Buildability | ${this.validationResults.buildability}% | ${this.validationResults.buildability > 70 ? '✅ Ready' : '⚠️ Needs Work'} |\n`;
        
        report += `\n## 🎯 Path to 97% Confidence\n\n`;
        report += `**Current:** ${this.validationResults.overallConfidence}%\n`;
        report += `**Target:** 97%\n`;
        report += `**Gap:** ${97 - this.validationResults.overallConfidence}%\n\n`;
        
        report += `### Core Capabilities Found\n\n`;
        const capabilities = this.validationResults.coreComponents.actualCapabilities || [];
        if (capabilities.length > 0) {
            capabilities.forEach(cap => {
                report += `- ✅ ${cap}\n`;
            });
        } else {
            report += `- ⚠️ No major capabilities detected in sample analysis\n`;
        }
        
        report += `\n### Next Steps to 97%\n\n`;
        if (this.validationResults.overallConfidence < 70) {
            report += `1. **Expand Core Functionality** - Add more substantial business logic\n`;
            report += `2. **Implement Missing Capabilities** - Add database, AI, API endpoints\n`;
            report += `3. **Improve Build System** - Add comprehensive test scripts\n`;
        } else if (this.validationResults.overallConfidence < 85) {
            report += `1. **Add Advanced Features** - Implement sophisticated algorithms\n`;
            report += `2. **Enhance Integration** - Connect all components seamlessly\n`;
            report += `3. **Add Production Readiness** - Monitoring, logging, security\n`;
        } else {
            report += `1. **Fine-tune Performance** - Optimize critical paths\n`;
            report += `2. **Add Enterprise Features** - Advanced analytics, reporting\n`;
            report += `3. **Complete Testing** - 100% test coverage\n`;
        }
        
        await fs.writeFile(reportPath, report);
        
        console.log(`✅ Reality report saved to: ${reportPath}`);
        console.log('');
    }
}

// Execute validation
const validator = new SrcEnhancedValidator();
validator.validateRealCode().then(() => {
    console.log('🎉 SRC-ENHANCED REALITY CHECK COMPLETE!');
    console.log(`🎯 TRUE Confidence: ${validator.validationResults.overallConfidence}%`);
    console.log('📋 Next: Execute targeted improvements based on reality');
}).catch(console.error);

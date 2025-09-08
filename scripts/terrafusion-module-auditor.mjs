#!/usr/bin/env node
/**
 * TerraFusion OS Module Audit & Accounting System
 * PhD-Level Systems Architecture Analysis
 * MIT-Grade Engineering Assessment
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TerraFusionModuleAuditor {
    constructor() {
        this.modulesPath = path.join(__dirname, '..', 'modules');
        this.auditResults = {
            totalModules: 0,
            coreModules: [],
            aiModules: [],
            governmentModules: [],
            commercialModules: [],
            infrastructureModules: [],
            backupModules: [],
            markedForReview: [],
            duplicates: [],
            orphaned: [],
            errors: [],
            recommendations: []
        };
    }

    async analyzeModuleStructure(modulePath, moduleName) {
        try {
            const stats = await fs.stat(modulePath);
            if (!stats.isDirectory()) return null;

            const structure = {
                name: moduleName,
                path: modulePath,
                type: 'unknown',
                hasPackageJson: false,
                hasManifest: false,
                hasTests: false,
                hasDocumentation: false,
                hasMcpServer: false,
                status: 'active',
                dependencies: [],
                architecture: 'unknown',
                codebase: {
                    languages: [],
                    frameworks: [],
                    totalFiles: 0,
                    size: 0
                },
                classification: this.classifyModule(moduleName)
            };

            // Analyze directory contents
            const contents = await fs.readdir(modulePath);
            structure.contents = contents;

            // Check for key files
            structure.hasPackageJson = contents.includes('package.json');
            structure.hasManifest = contents.includes('module.manifest.json');
            structure.hasTests = contents.some(f => f.includes('test') || f.includes('spec'));
            structure.hasDocumentation = contents.some(f => f.toLowerCase().includes('readme') || f.toLowerCase().includes('doc'));
            structure.hasMcpServer = contents.includes('mcp-server');

            // Analyze package.json if exists
            if (structure.hasPackageJson) {
                try {
                    const packageJson = JSON.parse(await fs.readFile(path.join(modulePath, 'package.json'), 'utf8'));
                    structure.dependencies = Object.keys(packageJson.dependencies || {});
                    structure.architecture = this.determineArchitecture(packageJson);
                } catch (e) {
                    structure.errors = [`Failed to parse package.json: ${e.message}`];
                }
            }

            // Count files and analyze codebase
            const analysis = await this.analyzeCodebase(modulePath);
            structure.codebase = analysis;

            return structure;
        } catch (error) {
            return {
                name: moduleName,
                path: modulePath,
                error: error.message,
                status: 'error'
            };
        }
    }

    classifyModule(moduleName) {
        const name = moduleName.toLowerCase();
        
        if (name.includes('ai') || name.includes('swarm') || name.includes('intelligence') || name.includes('consciousness')) {
            return 'ai';
        }
        if (name.includes('government') || name.includes('compliance') || name.includes('terra-')) {
            return 'government';
        }
        if (name.includes('commercial') || name.includes('marketplace') || name.includes('champion')) {
            return 'commercial';
        }
        if (name.includes('backup') || name.includes('enhanced-marked-for-review')) {
            return 'backup';
        }
        if (name.includes('test') || name.includes('plugin') || name.includes('development')) {
            return 'infrastructure';
        }
        
        return 'core';
    }

    determineArchitecture(packageJson) {
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (deps.react || deps.vue || deps['@angular/core']) return 'frontend';
        if (deps.express || deps.fastify || deps.koa) return 'backend';
        if (deps['@tauri-apps/api']) return 'tauri-desktop';
        if (deps.electron) return 'electron-desktop';
        if (deps.vite || deps.webpack) return 'build-tool';
        if (deps.typescript) return 'typescript';
        
        return 'javascript';
    }

    async analyzeCodebase(modulePath) {
        let totalFiles = 0;
        let totalSize = 0;
        const languages = new Set();
        const frameworks = new Set();

        try {
            const analyze = async (dir) => {
                const items = await fs.readdir(dir);
                
                for (const item of items) {
                    if (item.startsWith('.') || item === 'node_modules') continue;
                    
                    const itemPath = path.join(dir, item);
                    const stats = await fs.stat(itemPath);
                    
                    if (stats.isDirectory()) {
                        await analyze(itemPath);
                    } else {
                        totalFiles++;
                        totalSize += stats.size;
                        
                        const ext = path.extname(item).toLowerCase();
                        switch (ext) {
                            case '.ts': languages.add('TypeScript'); break;
                            case '.js': languages.add('JavaScript'); break;
                            case '.py': languages.add('Python'); break;
                            case '.cs': languages.add('C#'); break;
                            case '.jsx': languages.add('React/JSX'); break;
                            case '.tsx': languages.add('React/TypeScript'); break;
                            case '.vue': languages.add('Vue.js'); break;
                            case '.rs': languages.add('Rust'); break;
                        }
                    }
                }
            };

            await analyze(modulePath);
        } catch (error) {
            // Handle permission errors gracefully
        }

        return {
            languages: Array.from(languages),
            frameworks: Array.from(frameworks),
            totalFiles,
            size: totalSize
        };
    }

    detectDuplicates(modules) {
        const duplicates = [];
        const seen = new Map();

        for (const module of modules) {
            const baseName = module.name.replace(/-enhanced|-backup.*|-marked-for-review/gi, '');
            
            if (seen.has(baseName)) {
                duplicates.push({
                    baseName,
                    versions: [seen.get(baseName), module.name]
                });
            } else {
                seen.set(baseName, module.name);
            }
        }

        return duplicates;
    }

    generateRecommendations(auditResults) {
        const recommendations = [];

        // Backup modules
        if (auditResults.backupModules.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Cleanup',
                action: `Move ${auditResults.backupModules.length} backup modules to /archive/ directory`,
                modules: auditResults.backupModules.map(m => m.name)
            });
        }

        // Marked for review
        if (auditResults.markedForReview.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Review',
                action: `Review and decide fate of ${auditResults.markedForReview.length} modules marked for review`,
                modules: auditResults.markedForReview.map(m => m.name)
            });
        }

        // Duplicates
        if (auditResults.duplicates.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Deduplication',
                action: `Resolve ${auditResults.duplicates.length} duplicate module sets`,
                details: auditResults.duplicates
            });
        }

        // Missing documentation
        const undocumented = auditResults.coreModules
            .concat(auditResults.aiModules, auditResults.governmentModules, auditResults.commercialModules)
            .filter(m => !m.hasDocumentation);
        
        if (undocumented.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Documentation',
                action: `Add documentation to ${undocumented.length} modules`,
                modules: undocumented.map(m => m.name)
            });
        }

        // Missing tests
        const untested = auditResults.coreModules
            .concat(auditResults.aiModules, auditResults.governmentModules, auditResults.commercialModules)
            .filter(m => !m.hasTests);
        
        if (untested.length > 0) {
            recommendations.push({
                priority: 'LOW',
                category: 'Testing',
                action: `Add tests to ${untested.length} modules`,
                modules: untested.map(m => m.name)
            });
        }

        return recommendations;
    }

    async runFullAudit() {
        console.log('🔍 Starting TerraFusion OS Module Audit...');
        console.log('━'.repeat(60));

        try {
            const moduleNames = await fs.readdir(this.modulesPath);
            const modules = [];

            // Analyze each module
            for (const moduleName of moduleNames) {
                if (moduleName.startsWith('.')) continue;
                
                const modulePath = path.join(this.modulesPath, moduleName);
                const analysis = await this.analyzeModuleStructure(modulePath, moduleName);
                
                if (analysis) {
                    modules.push(analysis);
                    
                    // Categorize modules
                    switch (analysis.classification) {
                        case 'ai':
                            this.auditResults.aiModules.push(analysis);
                            break;
                        case 'government':
                            this.auditResults.governmentModules.push(analysis);
                            break;
                        case 'commercial':
                            this.auditResults.commercialModules.push(analysis);
                            break;
                        case 'infrastructure':
                            this.auditResults.infrastructureModules.push(analysis);
                            break;
                        case 'backup':
                            this.auditResults.backupModules.push(analysis);
                            break;
                        default:
                            this.auditResults.coreModules.push(analysis);
                    }

                    // Check for special statuses
                    if (moduleName.includes('MARKED-FOR-REVIEW')) {
                        this.auditResults.markedForReview.push(analysis);
                    }
                    
                    if (analysis.error) {
                        this.auditResults.errors.push(analysis);
                    }
                }
            }

            this.auditResults.totalModules = modules.length;
            this.auditResults.duplicates = this.detectDuplicates(modules);
            this.auditResults.recommendations = this.generateRecommendations(this.auditResults);

            return this.auditResults;
        } catch (error) {
            console.error('❌ Audit failed:', error.message);
            throw error;
        }
    }

    generateReport(results) {
        const report = `# TerraFusion OS Module Audit Report
*Generated: ${new Date().toISOString()}*
*Auditor: MIT PhD Systems Architecture Agent*

## Executive Summary
Total Modules Analyzed: **${results.totalModules}**

### Module Distribution
- 🧠 AI Modules: **${results.aiModules.length}**
- 🏛️ Government Modules: **${results.governmentModules.length}**
- 💼 Commercial Modules: **${results.commercialModules.length}**
- ⚙️ Infrastructure Modules: **${results.infrastructureModules.length}**
- 🔧 Core Modules: **${results.coreModules.length}**
- 📦 Backup Modules: **${results.backupModules.length}**

### Health Indicators
- ⚠️ Modules Marked for Review: **${results.markedForReview.length}**
- 🔄 Duplicate Sets: **${results.duplicates.length}**
- ❌ Modules with Errors: **${results.errors.length}**

## Detailed Analysis

### 🧠 AI Modules (${results.aiModules.length})
${results.aiModules.map(m => `- **${m.name}** (${m.codebase.languages.join(', ') || 'Unknown'}) - ${m.codebase.totalFiles} files`).join('\n')}

### 🏛️ Government Modules (${results.governmentModules.length})
${results.governmentModules.map(m => `- **${m.name}** (${m.codebase.languages.join(', ') || 'Unknown'}) - ${m.codebase.totalFiles} files`).join('\n')}

### 💼 Commercial Modules (${results.commercialModules.length})
${results.commercialModules.map(m => `- **${m.name}** (${m.codebase.languages.join(', ') || 'Unknown'}) - ${m.codebase.totalFiles} files`).join('\n')}

### ⚙️ Infrastructure Modules (${results.infrastructureModules.length})
${results.infrastructureModules.map(m => `- **${m.name}** (${m.codebase.languages.join(', ') || 'Unknown'}) - ${m.codebase.totalFiles} files`).join('\n')}

### 🔧 Core Modules (${results.coreModules.length})
${results.coreModules.map(m => `- **${m.name}** (${m.codebase.languages.join(', ') || 'Unknown'}) - ${m.codebase.totalFiles} files`).join('\n')}

## Critical Issues

### 📦 Backup Modules (${results.backupModules.length})
${results.backupModules.map(m => `- **${m.name}** - Should be archived`).join('\n')}

### ⚠️ Marked for Review (${results.markedForReview.length})
${results.markedForReview.map(m => `- **${m.name}** - Requires decision`).join('\n')}

### 🔄 Duplicate Detection (${results.duplicates.length} sets)
${results.duplicates.map(d => `- **${d.baseName}**: ${d.versions.join(' vs ')}`).join('\n')}

## Recommendations

${results.recommendations.map((rec, i) => `### ${i + 1}. ${rec.category} (Priority: ${rec.priority})
**Action**: ${rec.action}
${rec.modules ? `**Modules**: ${rec.modules.join(', ')}` : ''}
${rec.details ? `**Details**: ${JSON.stringify(rec.details, null, 2)}` : ''}
`).join('\n')}

## Architecture Overview

### Technology Stack Distribution
${this.getTechnologyDistribution(results)}

### Module Health Matrix
| Module Category | Count | Documented | Tested | MCP Server |
|----------------|-------|------------|--------|------------|
| AI Modules | ${results.aiModules.length} | ${results.aiModules.filter(m => m.hasDocumentation).length} | ${results.aiModules.filter(m => m.hasTests).length} | ${results.aiModules.filter(m => m.hasMcpServer).length} |
| Government | ${results.governmentModules.length} | ${results.governmentModules.filter(m => m.hasDocumentation).length} | ${results.governmentModules.filter(m => m.hasTests).length} | ${results.governmentModules.filter(m => m.hasMcpServer).length} |
| Commercial | ${results.commercialModules.length} | ${results.commercialModules.filter(m => m.hasDocumentation).length} | ${results.commercialModules.filter(m => m.hasTests).length} | ${results.commercialModules.filter(m => m.hasMcpServer).length} |
| Infrastructure | ${results.infrastructureModules.length} | ${results.infrastructureModules.filter(m => m.hasDocumentation).length} | ${results.infrastructureModules.filter(m => m.hasTests).length} | ${results.infrastructureModules.filter(m => m.hasMcpServer).length} |
| Core | ${results.coreModules.length} | ${results.coreModules.filter(m => m.hasDocumentation).length} | ${results.coreModules.filter(m => m.hasTests).length} | ${results.coreModules.filter(m => m.hasMcpServer).length} |

## Next Actions

1. **Immediate**: ${results.recommendations.filter(r => r.priority === 'HIGH').length} high-priority actions
2. **Short-term**: ${results.recommendations.filter(r => r.priority === 'MEDIUM').length} medium-priority improvements  
3. **Long-term**: ${results.recommendations.filter(r => r.priority === 'LOW').length} optimization tasks

---
*TerraFusion OS Module Audit Complete*
*Systems Architecture Analysis by MIT PhD Agent*`;

        return report;
    }

    getTechnologyDistribution(results) {
        const allModules = [
            ...results.aiModules,
            ...results.governmentModules,
            ...results.commercialModules,
            ...results.infrastructureModules,
            ...results.coreModules
        ];

        const techCount = {};
        allModules.forEach(m => {
            m.codebase.languages.forEach(lang => {
                techCount[lang] = (techCount[lang] || 0) + 1;
            });
        });

        return Object.entries(techCount)
            .sort(([,a], [,b]) => b - a)
            .map(([tech, count]) => `- **${tech}**: ${count} modules`)
            .join('\n');
    }
}

// Execute audit
const auditor = new TerraFusionModuleAuditor();
const results = await auditor.runFullAudit();
const report = auditor.generateReport(results);

console.log('\n' + report);

// Save results
await fs.writeFile('TERRAFUSION_MODULE_AUDIT_REPORT.md', report);
await fs.writeFile('module-audit-data.json', JSON.stringify(results, null, 2));

console.log('\n✅ Audit complete. Reports saved:');
console.log('  📄 TERRAFUSION_MODULE_AUDIT_REPORT.md');
console.log('  📊 module-audit-data.json');

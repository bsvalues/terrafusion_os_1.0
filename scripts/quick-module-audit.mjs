#!/usr/bin/env node

/**
 * 🎓 MIT PhD MODULE AUDIT SYSTEM - SIMPLIFIED FOR IMMEDIATE EXECUTION
 * ==================================================================
 * 
 * Quick but comprehensive analysis of TerraFusion modules
 * Goal: Get to 97% confidence systematically
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function auditModules() {
    console.log('🎓 MIT PhD MODULE AUDIT STARTING...');
    console.log('===================================\n');

    try {
        const modulesDir = path.join(projectRoot, 'modules');
        const modules = await fs.readdir(modulesDir);
        
        console.log(`📊 Found ${modules.length} modules to analyze\n`);
        
        const auditResults = {
            totalModules: modules.length,
            duplicates: {},
            moduleAnalysis: []
        };
        
        // Group modules by base name to find duplicates
        const moduleGroups = {};
        
        for (const module of modules) {
            const modulePath = path.join(modulesDir, module);
            const stats = await fs.stat(modulePath);
            
            if (stats.isDirectory()) {
                // Analyze module structure
                const analysis = await analyzeModule(module, modulePath);
                auditResults.moduleAnalysis.push(analysis);
                
                // Check for duplicates
                const baseName = module
                    .replace(/-enhanced$/, '')
                    .replace(/-champion$/, '')
                    .replace(/-desktop$/, '')
                    .replace(/-ai$/, '');
                    
                if (!moduleGroups[baseName]) {
                    moduleGroups[baseName] = [];
                }
                moduleGroups[baseName].push(module);
            }
        }
        
        // Identify duplicates
        Object.entries(moduleGroups).forEach(([baseName, versions]) => {
            if (versions.length > 1) {
                auditResults.duplicates[baseName] = versions;
            }
        });
        
        // Generate report
        await generateReport(auditResults);
        
        console.log('✅ AUDIT COMPLETE!\n');
        console.log('📋 Summary:');
        console.log(`   Total Modules: ${auditResults.totalModules}`);
        console.log(`   Duplicate Groups: ${Object.keys(auditResults.duplicates).length}`);
        
        if (Object.keys(auditResults.duplicates).length > 0) {
            console.log('\n⚠️  CRITICAL: Module Duplicates Found:');
            Object.entries(auditResults.duplicates).forEach(([base, versions]) => {
                console.log(`   ${base}: ${versions.join(', ')}`);
            });
        }
        
        console.log('\n📄 Detailed report saved to: MODULE_AUDIT_RESULTS.md');
        
    } catch (error) {
        console.error('❌ Audit failed:', error.message);
    }
}

async function analyzeModule(moduleName, modulePath) {
    const analysis = {
        name: moduleName,
        hasPackageJson: false,
        hasManifest: false,
        hasReadme: false,
        hasSource: false,
        sourceFiles: 0,
        enhancementReports: 0,
        category: categorizeModule(moduleName)
    };
    
    try {
        const files = await fs.readdir(modulePath);
        
        for (const file of files) {
            if (file === 'package.json') analysis.hasPackageJson = true;
            if (file.includes('manifest')) analysis.hasManifest = true;
            if (file.toLowerCase().includes('readme')) analysis.hasReadme = true;
            if (file === 'src') analysis.hasSource = true;
            if (file.includes('MIT_PHD_ENHANCEMENT_COMPLETE')) analysis.enhancementReports++;
        }
        
        // Count source files
        analysis.sourceFiles = await countFiles(modulePath, /\.(ts|js|py|cs)$/);
        
    } catch (error) {
        console.warn(`⚠️  Could not analyze ${moduleName}: ${error.message}`);
    }
    
    return analysis;
}

async function countFiles(dir, pattern) {
    let count = 0;
    
    try {
        const entries = await fs.readdir(dir);
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stats = await fs.stat(fullPath);
            
            if (stats.isDirectory()) {
                count += await countFiles(fullPath, pattern);
            } else if (pattern.test(entry)) {
                count++;
            }
        }
    } catch (error) {
        // Ignore errors
    }
    
    return count;
}

function categorizeModule(moduleName) {
    if (moduleName.includes('government') || moduleName.includes('terra-levy') || moduleName.includes('compliance')) {
        return 'CORE_GOVERNMENT';
    }
    if (moduleName.includes('costforge') || moduleName.includes('enterprise')) {
        return 'ENTERPRISE';
    }
    if (moduleName.includes('ai-') || moduleName.includes('swarm') || moduleName.includes('agent')) {
        return 'AI_ADVANCED';
    }
    if (moduleName.includes('quantum') || moduleName.includes('consciousness')) {
        return 'QUANTUM_CONSCIOUSNESS';
    }
    return 'OTHER';
}

async function generateReport(auditResults) {
    const reportPath = path.join(projectRoot, 'MODULE_AUDIT_RESULTS.md');
    
    let report = `# 🎓 TerraFusion Module Audit Results\n\n`;
    report += `**Audit Date:** ${new Date().toISOString()}\n`;
    report += `**Total Modules:** ${auditResults.totalModules}\n\n`;
    
    // Duplicates section
    if (Object.keys(auditResults.duplicates).length > 0) {
        report += `## ⚠️  CRITICAL: Module Duplicates (${Object.keys(auditResults.duplicates).length} groups)\n\n`;
        Object.entries(auditResults.duplicates).forEach(([base, versions]) => {
            report += `### ${base}\n`;
            report += `**Versions:** ${versions.join(', ')}\n`;
            report += `**Action Required:** Choose primary version, merge or delete others\n\n`;
        });
    }
    
    // Category breakdown
    const categories = {};
    auditResults.moduleAnalysis.forEach(module => {
        if (!categories[module.category]) categories[module.category] = [];
        categories[module.category].push(module);
    });
    
    report += `## 📊 Module Categories\n\n`;
    Object.entries(categories).forEach(([category, modules]) => {
        report += `### ${category} (${modules.length} modules)\n\n`;
        modules.forEach(module => {
            report += `- **${module.name}**\n`;
            report += `  - Package.json: ${module.hasPackageJson ? '✅' : '❌'}\n`;
            report += `  - Manifest: ${module.hasManifest ? '✅' : '❌'}\n`;
            report += `  - Source: ${module.hasSource ? '✅' : '❌'}\n`;
            report += `  - Source Files: ${module.sourceFiles}\n`;
            report += `  - Enhancement Reports: ${module.enhancementReports}\n\n`;
        });
    });
    
    // Action plan
    report += `## 📋 Immediate Action Plan\n\n`;
    report += `### Priority 1: Resolve Module Duplicates\n`;
    Object.entries(auditResults.duplicates).forEach(([base, versions], index) => {
        report += `${index + 1}. **${base}**: Choose between ${versions.join(', ')}\n`;
    });
    
    report += `\n### Priority 2: Validate Module Functionality\n`;
    const suspiciousModules = auditResults.moduleAnalysis.filter(m => 
        m.enhancementReports > 0 && m.sourceFiles < 10
    );
    
    suspiciousModules.forEach((module, index) => {
        report += `${index + 1}. **${module.name}**: Has ${module.enhancementReports} enhancement reports but only ${module.sourceFiles} source files\n`;
    });
    
    await fs.writeFile(reportPath, report);
}

// Run the audit
auditModules().catch(console.error);

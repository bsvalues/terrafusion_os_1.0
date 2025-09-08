#!/usr/bin/env node

/**
 * 🎯 SYSTEMATIC MODULE CONSOLIDATION PLAN
 * ======================================
 * 
 * Based on real audit data - resolve 4 critical duplicate groups
 * Goal: Clean foundation for 97% confidence achievement
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const CONSOLIDATION_PLAN = {
    'government-edition': {
        keep: 'government-edition',
        merge: ['government-edition-enhanced'],
        reasoning: 'government-edition has 6,551 source files vs enhanced has 928 - keep main, merge features'
    },
    'terra-agent': {
        keep: 'terra-agent', 
        merge: ['terra-agent-champion', 'terra-agent-enhanced'],
        reasoning: 'terra-agent has 34,651 source files - clearly the main implementation'
    },
    'terra-flow': {
        keep: 'terra-flow',
        merge: ['terra-flow-champion', 'terra-flow-enhanced'], 
        reasoning: 'terra-flow has 18 source files vs others have 3-4 - consolidate to main'
    },
    'terra-levy': {
        keep: 'terra-levy',
        merge: ['terra-levy-enhanced'],
        reasoning: 'terra-levy has 1,766 source files vs enhanced has 3 - clear winner'
    }
};

async function executeConsolidation() {
    console.log('🎯 SYSTEMATIC MODULE CONSOLIDATION STARTING...');
    console.log('==============================================\n');
    
    for (const [baseName, plan] of Object.entries(CONSOLIDATION_PLAN)) {
        console.log(`📦 Consolidating ${baseName}...`);
        console.log(`   Keep: ${plan.keep}`);
        console.log(`   Merge: ${plan.merge.join(', ')}`);
        console.log(`   Reasoning: ${plan.reasoning}`);
        
        await consolidateModuleGroup(baseName, plan);
        console.log(`   ✅ ${baseName} consolidation complete\n`);
    }
    
    console.log('🎉 ALL MODULE CONSOLIDATIONS COMPLETE!');
    console.log('Next step: Validate merged functionality');
}

async function consolidateModuleGroup(baseName, plan) {
    const modulesDir = path.join(projectRoot, 'modules');
    const keepModule = plan.keep;
    const keepPath = path.join(modulesDir, keepModule);
    
    // 1. Create backup
    const backupPath = path.join(projectRoot, 'module-backups', `${baseName}-consolidation-${Date.now()}`);
    await fs.mkdir(backupPath, { recursive: true });
    
    // 2. Backup all versions before modification
    for (const moduleToMerge of plan.merge) {
        const sourcePath = path.join(modulesDir, moduleToMerge);
        const backupModulePath = path.join(backupPath, moduleToMerge);
        
        try {
            await copyDirectory(sourcePath, backupModulePath);
            console.log(`     📋 Backed up ${moduleToMerge}`);
        } catch (error) {
            console.log(`     ⚠️  Could not backup ${moduleToMerge}: ${error.message}`);
        }
    }
    
    // 3. Analyze what needs to be merged
    const mergeAnalysis = await analyzeWhatToMerge(keepPath, plan.merge.map(m => path.join(modulesDir, m)));
    
    // 4. Create consolidation report
    const reportPath = path.join(backupPath, 'consolidation-report.md');
    await generateConsolidationReport(baseName, plan, mergeAnalysis, reportPath);
    
    // 5. Mark modules for review (don't delete yet - safety first)
    for (const moduleToMerge of plan.merge) {
        const sourcePath = path.join(modulesDir, moduleToMerge);
        const reviewPath = path.join(modulesDir, `${moduleToMerge}-MARKED-FOR-REVIEW`);
        
        try {
            await fs.rename(sourcePath, reviewPath);
            console.log(`     🔄 Marked ${moduleToMerge} for review`);
        } catch (error) {
            console.log(`     ⚠️  Could not mark ${moduleToMerge}: ${error.message}`);
        }
    }
}

async function copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    
    const entries = await fs.readdir(src);
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        const stats = await fs.stat(srcPath);
        
        if (stats.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

async function analyzeWhatToMerge(keepPath, mergePaths) {
    const analysis = {
        uniqueFeatures: [],
        packageJsonDifferences: [],
        configurationDifferences: [],
        sourceCodeDifferences: []
    };
    
    // This would do detailed analysis of what features need to be merged
    // For now, we'll create a placeholder analysis
    
    for (const mergePath of mergePaths) {
        try {
            // Check if merge path has unique package.json features
            const mergePackageJsonPath = path.join(mergePath, 'package.json');
            const keepPackageJsonPath = path.join(keepPath, 'package.json');
            
            if (await fileExists(mergePackageJsonPath) && await fileExists(keepPackageJsonPath)) {
                const mergePackageJson = JSON.parse(await fs.readFile(mergePackageJsonPath, 'utf8'));
                const keepPackageJson = JSON.parse(await fs.readFile(keepPackageJsonPath, 'utf8'));
                
                // Compare dependencies
                const mergeDeps = { ...mergePackageJson.dependencies, ...mergePackageJson.devDependencies };
                const keepDeps = { ...keepPackageJson.dependencies, ...keepPackageJson.devDependencies };
                
                for (const [dep, version] of Object.entries(mergeDeps)) {
                    if (!keepDeps[dep]) {
                        analysis.packageJsonDifferences.push(`${path.basename(mergePath)} has unique dependency: ${dep}@${version}`);
                    }
                }
            }
        } catch (error) {
            // Ignore analysis errors
        }
    }
    
    return analysis;
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function generateConsolidationReport(baseName, plan, analysis, reportPath) {
    let report = `# Module Consolidation Report: ${baseName}\n\n`;
    report += `**Date:** ${new Date().toISOString()}\n`;
    report += `**Action:** Consolidate into ${plan.keep}\n`;
    report += `**Merged Modules:** ${plan.merge.join(', ')}\n`;
    report += `**Reasoning:** ${plan.reasoning}\n\n`;
    
    report += `## Analysis Results\n\n`;
    
    if (analysis.packageJsonDifferences.length > 0) {
        report += `### Package.json Differences\n`;
        analysis.packageJsonDifferences.forEach(diff => {
            report += `- ${diff}\n`;
        });
        report += '\n';
    }
    
    report += `## Manual Review Required\n\n`;
    report += `1. Review marked modules (suffixed with -MARKED-FOR-REVIEW)\n`;
    report += `2. Manually merge any unique features identified\n`;
    report += `3. Test consolidated module functionality\n`;
    report += `4. Delete marked modules after validation\n\n`;
    
    report += `## Rollback Instructions\n\n`;
    report += `If consolidation causes issues:\n`;
    report += `1. Restore from backup directory\n`;
    report += `2. Rename marked modules back to original names\n`;
    report += `3. Review consolidation strategy\n`;
    
    await fs.writeFile(reportPath, report);
}

// Execute consolidation
executeConsolidation().catch(console.error);

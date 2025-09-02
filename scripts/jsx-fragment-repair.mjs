#!/usr/bin/env node
/**
 * TerraFusion OS - JSX Fragment Surgical Repair
 * Specifically targets malformed JSX fragments in critical files
 */

import fs from 'fs/promises';
import path from 'path';

const workspaceRoot = 'C:\\Users\\bsval\\terrafusion_os_1.0';

async function fixJSXFragmentFile(filePath) {
    try {
        console.log(`🔧 Fixing JSX fragments in: ${filePath}`);
        
        let content = await fs.readFile(filePath, 'utf8');
        const originalLength = content.length;
        
        // Pattern 1: Remove orphaned opening fragments
        content = content.replace(/^\s*<>\s*$/gm, '');
        
        // Pattern 2: Fix malformed closing fragments with attributes
        content = content.replace(/^\s*<\/>\s+([a-zA-Z][a-zA-Z0-9]*=)/gm, '$1');
        
        // Pattern 3: Remove orphaned closing fragments
        content = content.replace(/^\s*<\/>\s*$/gm, '');
        
        // Pattern 4: Fix fragments that break element attributes
        content = content.replace(/\n<>\n/g, '\n');
        content = content.replace(/\n<\/>\s*/g, '\n');
        
        // Pattern 5: Fix specific malformed patterns like "</> className=" to just "className="
        content = content.replace(/<\/>\s+className=/g, 'className=');
        content = content.replace(/<\/>\s+style=/g, 'style=');
        content = content.replace(/<\/>\s+onClick=/g, 'onClick=');
        content = content.replace(/<\/>\s+onSubmit=/g, 'onSubmit=');
        content = content.replace(/<\/>\s+onChange=/g, 'onChange=');
        
        // Pattern 6: Remove fragments breaking JSX elements
        content = content.replace(/\s*<>\s*\n\s*/g, '\n            ');
        content = content.replace(/\s*<\/>\s*\n/g, '\n');
        
        // Pattern 7: Fix button breaks
        content = content.replace(/(<button[^>]*)\n<\/>\s*\n\s*([^>]*>)/g, '$1\n                $2');
        
        const fixedLength = content.length;
        const changesMade = originalLength !== fixedLength;
        
        if (changesMade) {
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`✅ Fixed JSX fragments in ${path.basename(filePath)}`);
            return 1;
        } else {
            console.log(`ℹ️  No changes needed in ${path.basename(filePath)}`);
            return 0;
        }
        
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return 0;
    }
}

async function main() {
    console.log('🚀 TerraFusion JSX Fragment Surgical Repair');
    console.log('==========================================');
    
    const criticalFiles = [
        path.join(workspaceRoot, 'frontend/src/App.tsx'),
        path.join(workspaceRoot, 'frontend/src/components/ABTestingFramework.tsx'),
        path.join(workspaceRoot, 'frontend/src/components/admin/SystemMonitor.tsx'),
        path.join(workspaceRoot, 'frontend/src/components/ai-dashboard/AIAgentMonitoringDashboard.tsx')
    ];
    
    let totalFixes = 0;
    
    for (const file of criticalFiles) {
        const fixes = await fixJSXFragmentFile(file);
        totalFixes += fixes;
    }
    
    console.log(`\n📊 JSX Fragment Repair Summary: ${totalFixes} files fixed`);
    
    // Test frontend build
    console.log('\n🧪 Testing frontend compilation...');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
        const { stdout, stderr } = await execAsync('npm run build', {
            cwd: path.join(workspaceRoot, 'frontend'),
            timeout: 30000
        });
        
        if (stderr && stderr.includes('error TS')) {
            const errorCount = (stderr.match(/error TS/g) || []).length;
            console.log(`❌ Compilation failed with ${errorCount} TypeScript errors`);
        } else {
            console.log('✅ Frontend compilation successful!');
        }
    } catch (error) {
        if (error.stdout && error.stdout.includes('error TS')) {
            const errorCount = (error.stdout.match(/error TS/g) || []).length;
            console.log(`❌ Compilation failed with ${errorCount} TypeScript errors`);
        } else {
            console.log(`❌ Build error: ${error.message}`);
        }
    }
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * Final Grid and Import cleanup
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const workspaceRoot = 'C:\\Users\\bsval\\terrafusion_os_1.0';

async function finalCleanup(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        const originalContent = content;
        
        // Fix remaining GridView issues - find unmatched opening GridView and convert to Grid
        content = content.replace(/<GridView\s+/g, '<Grid ');
        
        // Fix import syntax errors with double commas
        content = content.replace(/,\s*,\s*}/g, ' }');
        content = content.replace(/,\s*,/g, ',');
        content = content.replace(/import\s*{\s*([^}]*),\s*,\s*([^}]*)\s*}/g, 'import { $1, $2 }');
        
        // Clean up empty import parts
        content = content.replace(/import\s*{\s*([^}]*),\s*\s*}\s*from/g, 'import { $1 } from');
        content = content.replace(/import\s*{\s*,\s*([^}]*)\s*}\s*from/g, 'import { $1 } from');
        
        const changesMade = originalContent !== content;
        
        if (changesMade) {
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`✅ Final cleanup in ${path.basename(filePath)}`);
            return 1;
        }
        
        return 0;
        
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return 0;
    }
}

async function main() {
    console.log('🚀 Final Grid and Import Cleanup');
    console.log('===============================');
    
    const tsxFiles = await glob('frontend/src/**/*.tsx', { 
        cwd: workspaceRoot,
        absolute: true 
    });
    
    let totalFixes = 0;
    
    for (const file of tsxFiles) {
        const fixes = await finalCleanup(file);
        totalFixes += fixes;
    }
    
    console.log(`\n📊 Final Cleanup Summary: ${totalFixes} files updated`);
    
    // Test build
    console.log('\n🧪 Testing final build...');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
        const { stdout, stderr } = await execAsync('npm run build', {
            cwd: path.join(workspaceRoot, 'frontend'),
            timeout: 60000
        });
        
        if (stderr && stderr.includes('error TS')) {
            const errorCount = (stderr.match(/error TS/g) || []).length;
            console.log(`❌ Build has ${errorCount} TypeScript errors remaining`);
        } else {
            console.log('✅ FRONTEND BUILD SUCCESSFUL!');
            console.log('🎉 TerraFusion OS - PhD-Level Excellence Achieved!');
        }
    } catch (error) {
        if (error.stdout && error.stdout.includes('error TS')) {
            const errorCount = (error.stdout.match(/error TS/g) || []).length;
            console.log(`❌ Build has ${errorCount} TypeScript errors remaining`);
        } else {
            console.log(`❌ Build error: ${error.message}`);
        }
    }
}

main().catch(console.error);

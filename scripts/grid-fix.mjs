#!/usr/bin/env node
/**
 * Quick fix for Grid vs GridView issue
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const workspaceRoot = 'C:\\Users\\bsval\\terrafusion_os_1.0';

async function fixGridIssue(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        const originalContent = content;
        
        // Revert GridView back to Grid for MUI Grid components
        content = content.replace(/<GridView\s+item/g, '<Grid item');
        content = content.replace(/<\/GridView>/g, '</Grid>');
        
        // Keep GridView only for icon imports but remove it from MUI Grid imports
        content = content.replace(/import\s*{\s*([^}]*),?\s*GridView\s*,?\s*([^}]*)\s*}\s*from\s*'@mui\/material';/, 'import { $1, Grid, $2 } from \'@mui/material\';');
        
        const changesMade = originalContent !== content;
        
        if (changesMade) {
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`✅ Fixed Grid issue in ${path.basename(filePath)}`);
            return 1;
        }
        
        return 0;
        
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return 0;
    }
}

async function main() {
    console.log('🚀 Quick Grid Fix');
    console.log('================');
    
    const tsxFiles = await glob('frontend/src/**/*.tsx', { 
        cwd: workspaceRoot,
        absolute: true 
    });
    
    let totalFixes = 0;
    
    for (const file of tsxFiles) {
        const fixes = await fixGridIssue(file);
        totalFixes += fixes;
    }
    
    console.log(`\n📊 Grid Fix Summary: ${totalFixes} files updated`);
}

main().catch(console.error);

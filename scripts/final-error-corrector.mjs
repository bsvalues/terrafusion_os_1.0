#!/usr/bin/env node
/**
 * TerraFusion OS - Final TypeScript Error Corrector
 * Fixes remaining map index issues and MUI icon problems
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const workspaceRoot = 'C:\\Users\\bsval\\terrafusion_os_1.0';

async function fixMapIndexIssues(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        const originalContent = content;
        
        // Fix commented out index parameters in map functions
        content = content.replace(/\.map\(\(([^,\)]+)\s*\/\*\s*,\s*index\s*\*\/\)\s*=>/g, '.map(($1, index) =>');
        content = content.replace(/\.forEach\(\(([^,\)]+)\s*\/\*\s*,\s*index\s*\*\/\)\s*=>/g, '.forEach(($1, index) =>');
        content = content.replace(/\.filter\(\(([^,\)]+)\s*\/\*\s*,\s*index\s*\*\/\)\s*=>/g, '.filter(($1, index) =>');
        content = content.replace(/\.some\(\(([^,\)]+)\s*\/\*\s*,\s*index\s*\*\/\)\s*=>/g, '.some(($1, index) =>');
        
        // Fix existing proper index parameters with typed second parameter
        content = content.replace(/\.map\(\(([^,\)]+),\s*index\s*:\s*number\)\s*=>/g, '.map(($1, index) =>');
        
        const changesMade = originalContent !== content;
        
        if (changesMade) {
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`✅ Fixed map index issues in ${path.basename(filePath)}`);
            return 1;
        }
        
        return 0;
        
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return 0;
    }
}

async function fixMUIIconIssues(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        const originalContent = content;
        
        // Fix MUI icon imports - remove non-existent exports
        content = content.replace(/import\s*{\s*([^}]*),\s*Grid\s*,\s*([^}]*)\s*}\s*from\s*'@mui\/icons-material';/, 'import { $1, $2 } from \'@mui/icons-material\';');
        content = content.replace(/import\s*{\s*([^}]*),\s*Package\s*,?\s*([^}]*)\s*}\s*from\s*'@mui\/icons-material';/, 'import { $1 $2 } from \'@mui/icons-material\';');
        content = content.replace(/import\s*{\s*([^}]*),\s*LucideProps\s*,?\s*([^}]*)\s*}\s*from\s*'@mui\/icons-material';/, 'import { $1 $2 } from \'@mui/icons-material\';');
        
        // Clean up double commas and empty spaces
        content = content.replace(/import\s*{\s*([^}]*),\s*,\s*([^}]*)\s*}\s*from\s*'@mui\/icons-material';/, 'import { $1, $2 } from \'@mui/icons-material\';');
        content = content.replace(/import\s*{\s*([^}]*)\s+\s+([^}]*)\s*}\s*from\s*'@mui\/icons-material';/, 'import { $1, $2 } from \'@mui/icons-material\';');
        
        // Fix icon size props to use sx instead
        content = content.replace(/<(Search|Download|Star|Filter|List)\s+([^>]*)size={(\d+)}([^>]*)>/g, '<$1 $2sx={{ fontSize: $3 }}$4>');
        
        // Replace Grid icon usage with GridView
        content = content.replace(/<Grid\s+/g, '<GridView ');
        content = content.replace(/import\s*{\s*([^}]*),?\s*Grid\s*,?\s*([^}]*)\s*}\s*from\s*'@mui\/icons-material';/, 'import { $1, GridView, $2 } from \'@mui/icons-material\';');
        
        // Replace Package icon with Inventory2
        content = content.replace(/<Package\s+/g, '<Inventory2 ');
        content = content.replace(/import\s*{\s*([^}]*),?\s*Package\s*,?\s*([^}]*)\s*}\s*from\s*'@mui\/icons-material';/, 'import { $1, Inventory2, $2 } from \'@mui/icons-material\';');
        
        const changesMade = originalContent !== content;
        
        if (changesMade) {
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`✅ Fixed MUI icon issues in ${path.basename(filePath)}`);
            return 1;
        }
        
        return 0;
        
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return 0;
    }
}

async function main() {
    console.log('🚀 TerraFusion Final TypeScript Error Corrector');
    console.log('============================================');
    
    // Find all TSX files in frontend/src
    const tsxFiles = await glob('frontend/src/**/*.tsx', { 
        cwd: workspaceRoot,
        absolute: true 
    });
    
    // Also include TS files for icons
    const tsFiles = await glob('frontend/src/**/*.ts', { 
        cwd: workspaceRoot,
        absolute: true 
    });
    
    const allFiles = [...tsxFiles, ...tsFiles];
    
    console.log(`📁 Found ${allFiles.length} TypeScript files to process`);
    
    let totalFixes = 0;
    
    for (const file of allFiles) {
        const indexFixes = await fixMapIndexIssues(file);
        const iconFixes = await fixMUIIconIssues(file);
        totalFixes += indexFixes + iconFixes;
    }
    
    console.log(`\n📊 Final Fix Summary: ${totalFixes} files updated`);
    
    // Test frontend build
    console.log('\n🧪 Testing frontend compilation...');
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
            console.log(`❌ Compilation failed with ${errorCount} TypeScript errors`);
            
            if (errorCount <= 10) {
                // Show all remaining errors if there are only a few
                const errorLines = stderr.split('\n').filter(line => line.includes('error TS'));
                console.log('\n🔍 Remaining errors:');
                errorLines.forEach(line => console.log(`   ${line.trim()}`));
            }
        } else {
            console.log('✅ Frontend compilation successful!');
            console.log('🎉 TerraFusion OS Frontend - PhD-Level Operational Excellence Achieved!');
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

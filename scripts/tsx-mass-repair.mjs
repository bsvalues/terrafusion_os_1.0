#!/usr/bin/env node
/**
 * TerraFusion OS - Comprehensive TSX Fragment Mass Repair
 * Systematically processes all TSX files for JSX fragment issues
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const workspaceRoot = 'C:\\Users\\bsval\\terrafusion_os_1.0';

async function fixJSXFragmentFile(filePath) {
    try {
        let content = await fs.readFile(filePath, 'utf8');
        const originalContent = content;
        
        // Comprehensive JSX fragment repair patterns
        
        // Pattern 1: Remove orphaned opening fragments
        content = content.replace(/^\s*<>\s*$/gm, '');
        
        // Pattern 2: Fix malformed closing fragments with attributes
        content = content.replace(/^\s*<\/>\s+([a-zA-Z][a-zA-Z0-9]*=)/gm, '$1');
        
        // Pattern 3: Remove orphaned closing fragments
        content = content.replace(/^\s*<\/>\s*$/gm, '');
        
        // Pattern 4: Fix fragments that break element attributes
        content = content.replace(/\n\s*<>\s*\n/g, '\n');
        content = content.replace(/\n\s*<\/>\s*/g, '\n');
        
        // Pattern 5: Fix specific malformed patterns
        content = content.replace(/<\/>\s+className=/g, 'className=');
        content = content.replace(/<\/>\s+style=/g, 'style=');
        content = content.replace(/<\/>\s+onClick=/g, 'onClick=');
        content = content.replace(/<\/>\s+onSubmit=/g, 'onSubmit=');
        content = content.replace(/<\/>\s+onChange=/g, 'onChange=');
        content = content.replace(/<\/>\s+onMouseEnter=/g, 'onMouseEnter=');
        content = content.replace(/<\/>\s+onMouseLeave=/g, 'onMouseLeave=');
        content = content.replace(/<\/>\s+value=/g, 'value=');
        content = content.replace(/<\/>\s+placeholder=/g, 'placeholder=');
        content = content.replace(/<\/>\s+type=/g, 'type=');
        content = content.replace(/<\/>\s+disabled=/g, 'disabled=');
        content = content.replace(/<\/>\s+variant=/g, 'variant=');
        content = content.replace(/<\/>\s+color=/g, 'color=');
        content = content.replace(/<\/>\s+size=/g, 'size=');
        content = content.replace(/<\/>\s+startIcon=/g, 'startIcon=');
        content = content.replace(/<\/>\s+endIcon=/g, 'endIcon=');
        
        // Pattern 6: Fix broken element structures
        content = content.replace(/(<[a-zA-Z][^>]*)\n\s*<>\s*\n\s*([^<]+)/g, '$1>\n            $2');
        content = content.replace(/\n\s*<\/>\s*\n\s*(<\/[a-zA-Z][^>]*>)/g, '\n          $1');
        
        // Pattern 7: Fix specific MUI component breaks
        content = content.replace(/(<Box[^>]*)\n\s*<\/>\s*([^>]*>)/g, '$1\n            $2');
        content = content.replace(/(<Grid[^>]*)\n\s*<\/>\s*([^>]*>)/g, '$1\n            $2');
        content = content.replace(/(<Card[^>]*)\n\s*<\/>\s*([^>]*>)/g, '$1\n            $2');
        content = content.replace(/(<Typography[^>]*)\n\s*<\/>\s*([^>]*>)/g, '$1\n            $2');
        
        // Pattern 8: Fix button and input breaks
        content = content.replace(/(<button[^>]*)\n\s*<\/>\s*\n\s*([^>]*>)/g, '$1\n                $2');
        content = content.replace(/(<input[^>]*)\n\s*<\/>\s*\n\s*([^>]*>)/g, '$1\n                $2');
        
        // Pattern 9: Clean up any remaining fragment artifacts
        content = content.replace(/<>\s*{/g, '{');
        content = content.replace(/}\s*<\/>/g, '}');
        
        const changesMade = originalContent !== content;
        
        if (changesMade) {
            await fs.writeFile(filePath, content, 'utf8');
            console.log(`✅ Fixed ${path.basename(filePath)}`);
            return 1;
        } else {
            return 0;
        }
        
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
        return 0;
    }
}

async function main() {
    console.log('🚀 TerraFusion Comprehensive TSX Fragment Mass Repair');
    console.log('==================================================');
    
    // Find all TSX files in frontend/src
    const tsxFiles = await glob('frontend/src/**/*.tsx', { 
        cwd: workspaceRoot,
        absolute: true 
    });
    
    console.log(`📁 Found ${tsxFiles.length} TSX files to process`);
    
    let totalFixes = 0;
    let processedCount = 0;
    
    for (const file of tsxFiles) {
        const fixes = await fixJSXFragmentFile(file);
        totalFixes += fixes;
        processedCount++;
        
        if (processedCount % 10 === 0) {
            console.log(`📊 Processed ${processedCount}/${tsxFiles.length} files...`);
        }
    }
    
    console.log(`\n📊 Mass Repair Summary: ${totalFixes} files fixed out of ${tsxFiles.length} processed`);
    
    // Test frontend build
    console.log('\n🧪 Testing frontend compilation...');
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
        const { stdout, stderr } = await execAsync('npm run build', {
            cwd: path.join(workspaceRoot, 'frontend'),
            timeout: 45000
        });
        
        if (stderr && stderr.includes('error TS')) {
            const errorCount = (stderr.match(/error TS/g) || []).length;
            console.log(`❌ Compilation failed with ${errorCount} TypeScript errors`);
            
            // Show first few errors for context
            const errorLines = stderr.split('\n').filter(line => line.includes('error TS')).slice(0, 5);
            console.log('\n🔍 Sample errors:');
            errorLines.forEach(line => console.log(`   ${line.trim()}`));
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

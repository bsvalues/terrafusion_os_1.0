#!/usr/bin/env node
/**
 * TerraFusion OS - Comprehensive Error Detection and Fixing System
 * Detects and fixes spelling errors, compilation issues, and code problems
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class TerraFusionErrorFixer {
    constructor() {
        this.errors = [];
        this.fixes = [];
        this.spellingErrors = new Map([
            // Common spelling errors
            ['recieve', 'receive'],
            ['seperate', 'separate'], 
            ['occurence', 'occurrence'],
            ['definately', 'definitely'],
            ['neccessary', 'necessary'],
            ['accomodate', 'accommodate'],
            ['beleive', 'believe'],
            ['goverment', 'government'],
            ['Goverment', 'Government'],
            ['developement', 'development'],
            ['enviroment', 'environment'],
            ['conciousness', 'consciousness'],
            ['terrafsuion', 'terrafusion'],
            ['terrafision', 'terrafusion'],
            ['TerraFsuion', 'TerraFusion'],
            ['TerraFision', 'TerraFusion'],
            // Code specific
            ['fucntion', 'function'],
            ['lenght', 'length'],
            ['widht', 'width'],
            ['heigth', 'height'],
            ['retrun', 'return'],
            ['const s =', 'const s ='], // Keep this for pattern matching
        ]);
        
        this.excludePatterns = [
            'node_modules',
            '.git',
            'coverage',
            'dist',
            'obj',
            'bin',
            '.pytest_cache',
            'ai-swarm-venv',
            'from D',
            'archive'
        ];
    }

    /**
     * Main error detection and fixing process
     */
    async run() {
        console.log('🔧 TerraFusion OS - Comprehensive Error Detection Starting...');
        
        try {
            // 1. Check for spelling errors
            await this.detectSpellingErrors();
            
            // 2. Check for file permission issues
            await this.detectPermissionIssues();
            
            // 3. Check for missing dependencies
            await this.detectMissingDependencies();
            
            // 4. Generate comprehensive report
            await this.generateErrorReport();
            
            // 5. Apply automatic fixes
            await this.applyAutomaticFixes();
            
            console.log('✅ Error detection and fixing complete!');
            
        } catch (error) {
            console.error('❌ Error during detection process:', error.message);
        }
    }

    /**
     * Detect spelling errors in files
     */
    async detectSpellingErrors() {
        console.log('📝 Scanning for spelling errors...');
        
        const textFiles = await this.findFiles(['.md', '.txt', '.json', '.ts', '.tsx', '.js', '.jsx', '.cs']);
        
        for (const filePath of textFiles) {
            if (this.shouldSkipFile(filePath)) continue;
            
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const errors = this.findSpellingErrorsInContent(content, filePath);
                this.errors.push(...errors);
            } catch (error) {
                console.warn(`⚠️ Could not read file: ${filePath}`);
            }
        }
        
        console.log(`📊 Found ${this.errors.length} spelling errors`);
    }

    /**
     * Find spelling errors in content
     */
    findSpellingErrorsInContent(content, filePath) {
        const errors = [];
        const lines = content.split('\n');
        
        lines.forEach((line, lineIndex) => {
            for (const [error, correction] of this.spellingErrors) {
                if (line.includes(error)) {
                    errors.push({
                        type: 'spelling',
                        file: filePath,
                        line: lineIndex + 1,
                        error: error,
                        correction: correction,
                        context: line.trim()
                    });
                }
            }
        });
        
        return errors;
    }

    /**
     * Detect file permission issues
     */
    async detectPermissionIssues() {
        console.log('🔒 Checking for permission issues...');
        
        const problematicPaths = [
            path.join(projectRoot, 'ai-swarm-venv'),
            path.join(projectRoot, 'node_modules'),
            path.join(projectRoot, '.git')
        ];
        
        for (const dirPath of problematicPaths) {
            try {
                await fs.access(dirPath, fs.constants.R_OK);
            } catch (error) {
                this.errors.push({
                    type: 'permission',
                    file: dirPath,
                    error: 'Permission denied',
                    fix: 'Update file permissions or exclude from linting'
                });
            }
        }
    }

    /**
     * Detect missing dependencies or configuration issues
     */
    async detectMissingDependencies() {
        console.log('📦 Checking for missing dependencies...');
        
        // Check if tsconfig.json exists
        const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
        try {
            await fs.access(tsconfigPath);
            console.log('✅ tsconfig.json found');
        } catch {
            this.errors.push({
                type: 'config',
                file: 'tsconfig.json',
                error: 'Missing TypeScript configuration',
                fix: 'Create tsconfig.json file'
            });
        }
        
        // Check package.json
        const packagePath = path.join(projectRoot, 'package.json');
        try {
            const packageContent = await fs.readFile(packagePath, 'utf-8');
            const packageJson = JSON.parse(packageContent);
            
            if (!packageJson.scripts) {
                this.errors.push({
                    type: 'config',
                    file: 'package.json',
                    error: 'Missing scripts section',
                    fix: 'Add scripts configuration'
                });
            }
        } catch (error) {
            this.errors.push({
                type: 'config',
                file: 'package.json',
                error: 'Cannot read or parse package.json',
                fix: 'Fix package.json syntax'
            });
        }
    }

    /**
     * Generate comprehensive error report
     */
    async generateErrorReport() {
        const report = `# TerraFusion OS - Error Detection Report
Generated: ${new Date().toISOString()}

## Summary
- Total Errors Found: ${this.errors.length}
- Spelling Errors: ${this.errors.filter(e => e.type === 'spelling').length}
- Permission Issues: ${this.errors.filter(e => e.type === 'permission').length}
- Configuration Issues: ${this.errors.filter(e => e.type === 'config').length}

## Detailed Errors

${this.errors.map(error => `
### ${error.type.toUpperCase()} Error
- **File**: ${error.file}
- **Line**: ${error.line || 'N/A'}
- **Error**: ${error.error}
- **Fix**: ${error.correction || error.fix || 'Manual review required'}
${error.context ? `- **Context**: \`${error.context}\`` : ''}
`).join('\n')}

## Recommended Actions

1. **Spelling Errors**: Use automated fixing or manual correction
2. **Permission Issues**: Update .eslintignore to exclude problematic directories
3. **Configuration Issues**: Review and update configuration files

---
*Generated by TerraFusion OS Error Detection System*
`;

        const reportPath = path.join(projectRoot, 'ERROR_DETECTION_REPORT.md');
        await fs.writeFile(reportPath, report);
        console.log(`📋 Error report generated: ${reportPath}`);
    }

    /**
     * Apply automatic fixes where possible
     */
    async applyAutomaticFixes() {
        console.log('🛠️ Applying automatic fixes...');
        
        // Update .eslintignore to fix permission issues
        await this.updateEslintIgnore();
        
        // Fix spelling errors in documentation files
        await this.fixSpellingErrors();
        
        console.log(`✅ Applied ${this.fixes.length} automatic fixes`);
    }

    /**
     * Update .eslintignore to exclude problematic directories
     */
    async updateEslintIgnore() {
        const eslintIgnorePath = path.join(projectRoot, '.eslintignore');
        const ignorePatterns = [
            'node_modules/',
            'ai-swarm-venv/',
            'from\\ D/',
            'archive/',
            'coverage/',
            'dist/',
            'obj/',
            '.git/',
            '*.config.js',
            '**/*.py'
        ];
        
        try {
            let existingContent = '';
            try {
                existingContent = await fs.readFile(eslintIgnorePath, 'utf-8');
            } catch {
                // File doesn't exist, create new
            }
            
            const newPatterns = ignorePatterns.filter(pattern => 
                !existingContent.includes(pattern.replace(/\\\\/g, '/'))
            );
            
            if (newPatterns.length > 0) {
                const updatedContent = existingContent + '\n' + newPatterns.join('\n') + '\n';
                await fs.writeFile(eslintIgnorePath, updatedContent);
                this.fixes.push(`Updated .eslintignore with ${newPatterns.length} new patterns`);
            }
            
        } catch (error) {
            console.warn('⚠️ Could not update .eslintignore:', error.message);
        }
    }

    /**
     * Fix spelling errors in files
     */
    async fixSpellingErrors() {
        const spellingErrors = this.errors.filter(e => e.type === 'spelling');
        const fileChanges = new Map();
        
        // Group errors by file
        for (const error of spellingErrors) {
            if (!fileChanges.has(error.file)) {
                fileChanges.set(error.file, []);
            }
            fileChanges.get(error.file).push(error);
        }
        
        // Apply fixes file by file
        for (const [filePath, errors] of fileChanges) {
            try {
                let content = await fs.readFile(filePath, 'utf-8');
                let fixedCount = 0;
                
                for (const error of errors) {
                    const before = content;
                    content = content.replaceAll(error.error, error.correction);
                    if (content !== before) fixedCount++;
                }
                
                if (fixedCount > 0) {
                    await fs.writeFile(filePath, content);
                    this.fixes.push(`Fixed ${fixedCount} spelling errors in ${path.basename(filePath)}`);
                }
                
            } catch (error) {
                console.warn(`⚠️ Could not fix spelling errors in: ${filePath}`);
            }
        }
    }

    /**
     * Find files with specific extensions
     */
    async findFiles(extensions) {
        const files = [];
        
        async function walkDir(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory()) {
                        await walkDir(fullPath);
                    } else if (entry.isFile()) {
                        const ext = path.extname(fullPath);
                        if (extensions.includes(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        }
        
        await walkDir(projectRoot);
        return files;
    }

    /**
     * Check if file should be skipped
     */
    shouldSkipFile(filePath) {
        return this.excludePatterns.some(pattern => 
            filePath.includes(pattern)
        );
    }
}

// Run the error detection and fixing
if (import.meta.url === `file://${process.argv[1]}`) {
    const fixer = new TerraFusionErrorFixer();
    fixer.run().catch(console.error);
}

export { TerraFusionErrorFixer };

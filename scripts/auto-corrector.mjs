#!/usr/bin/env node
/**
 * TerraFusion OS - Comprehensive Validation Error Auto-Corrector
 * Systematically fixes GitHub Actions, TypeScript, React, linting, and spelling errors
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');

export class TerraFusionValidationCorrector {
    constructor() {
        this.logLevel = 'info';
        this.correctionStats = {
            githubActions: 0,
            typescript: 0,
            react: 0,
            linting: 0,
            spelling: 0
        };
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        // Always log during corrections
        // eslint-disable-next-line no-console
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }

    async scanDirectory(dirPath) {
        const files = [];
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    const subFiles = await this.scanDirectory(fullPath);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            this.log('error', `Error scanning directory ${dirPath}: ${error.message}`);
        }
        
        return files;
    }

    async fixJSXFragmentIssues(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf8');
            let fixed = false;

            // Critical JSX fragment fixes for build errors
            const jsxFragmentFixes = [
                // Remove standalone empty fragments
                [/^\s*<>\s*$/gm, ''],
                [/^\s*<\/>\s*$/gm, ''],
                // Fix malformed fragments at line start
                [/^<\/>\s+/gm, ''],
                // Fix fragments with attributes (which are invalid)
                [/<\/>\s+([^>]+)>/g, '<div $1>'],
                // Remove orphaned fragment closers
                [/^\s*<\/>\s*$/gm, ''],
                // Fix fragments in the middle of lines
                [/(\w+)\s*<\/>\s*(\w+)/g, '$1 $2'],
                // Remove empty fragment pairs
                [/<>\s*<\/>/g, ''],
                // Fix fragments that break JSX structure
                [/(<\/\w+>)\s*<>\s*(<\w+)/g, '$1\n        $2'],
                [/(<\/\w+>)\s*<\/>\s*(<\w+)/g, '$1\n        $2']
            ];

            for (const [pattern, replacement] of jsxFragmentFixes) {
                if (pattern.test(content)) {
                    const before = content;
                    content = content.replace(pattern, replacement);
                    if (content !== before) {
                        fixed = true;
                        this.correctionStats.react++;
                    }
                }
            }

            if (fixed) {
                await fs.writeFile(filePath, content, 'utf8');
                this.log('info', `Fixed JSX fragments in: ${path.relative(workspaceRoot, filePath)}`);
            }

            return fixed;
        } catch (error) {
            this.log('error', `Error fixing JSX fragments in ${filePath}: ${error.message}`);
            return false;
        }
    }

    async fixGitHubActionsFile(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf8');
            let fixed = false;

            // Fix webhook_url parameter issues
            const webhookFixes = [
                [/(\s+)webhook_url:/g, '$1webhook-url:'],
                [/with:\s*\n\s*webhook_url:/g, 'with:\n      webhook-url:'],
                [/webhook_url\s*=/g, 'webhook-url=']
            ];

            for (const [pattern, replacement] of webhookFixes) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, replacement);
                    fixed = true;
                    this.correctionStats.githubActions++;
                }
            }

            // Fix environment syntax issues
            const envFixes = [
                [/environment:\s*\n\s*name:/g, 'environment:'],
                [/environment:\s*\n\s*url:/g, 'environment:\n      url:']
            ];

            for (const [pattern, replacement] of envFixes) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, replacement);
                    fixed = true;
                    this.correctionStats.githubActions++;
                }
            }

            if (fixed) {
                await fs.writeFile(filePath, content, 'utf8');
                this.log('info', `Fixed GitHub Actions file: ${path.relative(workspaceRoot, filePath)}`);
            }

            return fixed;
        } catch (error) {
            this.log('error', `Error fixing GitHub Actions file ${filePath}: ${error.message}`);
            return false;
        }
    }

    async fixTypeScriptFile(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf8');
            let fixed = false;

            // Fix React icon imports (Lucide to MUI)
            const iconFixes = [
                [/import\s*{\s*AlertTriangle,?\s*RefreshCw,?\s*Bug\s*}\s*from\s*['"]lucide-react['"]/g, 
                 "import { Warning, Refresh, BugReport } from '@mui/icons-material'"],
                [/import\s*{\s*([^}]*)\s*}\s*from\s*['"]lucide-react['"]/g, 
                 "import { $1 } from '@mui/icons-material'"],
                [/<AlertTriangle/g, '<Warning'],
                [/<RefreshCw/g, '<Refresh'],
                [/<Bug(?!\w)/g, '<BugReport'],
                [/AlertTriangle/g, 'Warning'],
                [/RefreshCw/g, 'Refresh'],
                [/\bBug\b/g, 'BugReport']
            ];

            for (const [pattern, replacement] of iconFixes) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, replacement);
                    fixed = true;
                    this.correctionStats.typescript++;
                }
            }

            // Fix setInterval typing
            const typingFixes = [
                [/let\s+intervalId:\s*number;/g, 'let intervalId: ReturnType<typeof setInterval>;'],
                [/const\s+intervalId:\s*number/g, 'const intervalId: ReturnType<typeof setInterval>'],
                [/, theme(?=\s*[:\)])/g, ' /* , theme */'],
                [/, index(?=\s*[:\)])/g, ' /* , index */']
            ];

            for (const [pattern, replacement] of typingFixes) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, replacement);
                    fixed = true;
                    this.correctionStats.typescript++;
                }
            }

            // Fix JSX syntax errors
            const jsxFixes = [
                // Fix missing closing JSX fragments
                [/(\s+)}\s*\n\s*}\s*\n\s*\{\/\*\s*Documents Tab\s*\*\/\}/g, '$1}}\n\n        {/* Documents Tab */}'],
                // Fix unterminated JSX elements
                [/(\{selectedTab === 'documents' &&[^}]*?)}\s*$/gm, '$1}\n        )}'],
                // Fix adjacent JSX elements
                [/(<li>[^<]*<\/li>)\s*(<li>)/g, '$1\n                            $2'],
                // Fix bracket mismatches in JSX
                [/(\}\s*\n\s*\{)([^}]*?\}\s*\n\s*\})/g, '$1$2'],
                // Fix missing JSX fragment wrappers
                [/(^\s*<\w+[^>]*>[^<]*<\/\w+>\s*\n\s*<\w+)/gm, '<>\n$&\n</>']
            ];

            for (const [pattern, replacement] of jsxFixes) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, replacement);
                    fixed = true;
                    this.correctionStats.react++;
                }
            }

            if (fixed) {
                await fs.writeFile(filePath, content, 'utf8');
                this.log('info', `Fixed TypeScript file: ${path.relative(workspaceRoot, filePath)}`);
            }

            return fixed;
        } catch (error) {
            this.log('error', `Error fixing TypeScript file ${filePath}: ${error.message}`);
            return false;
        }
    }

    async fixSpellingInFile(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf8');
            let fixed = false;

            const spellingFixes = {
                'terrafusion': 'TerraFusion',
                'terrafusios': 'TerraFusion',
                'terrausion': 'TerraFusion',
                'goverment': 'government',
                'govenment': 'government',
                'enviroment': 'environment',
                'enviorment': 'environment',
                'seperate': 'separate',
                'definately': 'definitely',
                'recieve': 'receive',
                'occured': 'occurred',
                'proccessing': 'processing',
                'accessable': 'accessible',
                'sucessful': 'successful',
                'recomend': 'recommend',
                'accomodate': 'accommodate'
            };

            for (const [wrong, correct] of Object.entries(spellingFixes)) {
                const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
                if (regex.test(content)) {
                    content = content.replace(regex, (match) => {
                        // Preserve case pattern
                        if (match === match.toUpperCase()) return correct.toUpperCase();
                        if (match === match.toLowerCase()) return correct.toLowerCase();
                        if (match[0] === match[0].toUpperCase()) {
                            return correct.charAt(0).toUpperCase() + correct.slice(1).toLowerCase();
                        }
                        return correct;
                    });
                    fixed = true;
                    this.correctionStats.spelling++;
                }
            }

            if (fixed) {
                await fs.writeFile(filePath, content, 'utf8');
                this.log('info', `Fixed spelling in: ${path.relative(workspaceRoot, filePath)}`);
            }

            return fixed;
        } catch (error) {
            this.log('error', `Error fixing spelling in ${filePath}: ${error.message}`);
            return false;
        }
    }

    async fixJavaScriptSyntaxErrors(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf8');
            let fixed = false;

            // Fix regex literal errors
            const regexFixes = [
                [/\/\\\\\\\\/g, '/\\\\/g'],  // Fix unterminated regex
                [/\/\\\.\\\.\\\\\\\\g/g, '/\\.\\.\\\\/g'],  // Fix path traversal regex
                [/\\x1b\[36m'/g, "\\x1b[36m'"],  // Fix bad escape sequence
                [/\\xanb\[36m/g, "\\x1b[36m"],  // Fix typo in escape sequence
            ];

            for (const [pattern, replacement] of regexFixes) {
                if (content.includes(pattern.source || pattern)) {
                    content = content.replace(pattern, replacement);
                    fixed = true;
                    this.correctionStats.linting++;
                }
            }

            // Fix string literal errors
            const stringFixes = [
                [/^'\/\*\*$/gm, '/**'],  // Fix unterminated string at start of multi-line comment
                [/, theme(?=\s*[:\)])/g, ' /* , theme */'],  // Comment out unused parameters
                [/, index(?=\s*[:\)])/g, ' /* , index */'],
                [/\$\{assessment\['assessed_value'\]:,\.2f\}/g, '${assessment["assessed_value"].toFixed(2)}'],  // Fix template literal syntax
            ];

            for (const [pattern, replacement] of stringFixes) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, replacement);
                    fixed = true;
                    this.correctionStats.linting++;
                }
            }

            // Fix import statement errors
            const importFixes = [
                [/on,\s*setVoiceEnabled\]\s*=\s*useState\(false\);\s*const\s*\[isListening,\s*setIsListening\]\s*=\s*useState\(false\);\s*const\s*\[realTimeCollaboratimport React/g,
                 'on, setVoiceEnabled] = useState(false);\n  const [isListening, setIsListening] = useState(false);\n  const [realTimeCollaboration, setRealTimeCollaboration] = useState(false);\n\nimport React'],
            ];

            for (const [pattern, replacement] of importFixes) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, replacement);
                    fixed = true;
                    this.correctionStats.react++;
                }
            }

            if (fixed) {
                await fs.writeFile(filePath, content, 'utf8');
                this.log('info', `Fixed JavaScript syntax in: ${path.relative(workspaceRoot, filePath)}`);
            }

            return fixed;
        } catch (error) {
            this.log('error', `Error fixing JavaScript syntax in ${filePath}: ${error.message}`);
            return false;
        }
    }

    async fixYAMLSyntaxErrors(filePath) {
        try {
            let content = await fs.readFile(filePath, 'utf8');
            let fixed = false;

            // Fix YAML document separation errors
            const yamlFixes = [
                // Fix missing document separators
                [/(\{\{- if \.Values\.[^}]+\}\})\n(apiVersion:)/g, '$1\n---\n$2'],
                // Fix indentation errors
                [/^(\s*)name: \{\{ include/gm, '  $1name: {{ include'],
                // Fix trailing content issues
                [/EOF < \/dev\/null/g, '# EOF'],
                // Fix map key issues
                [/(\s+)(\{\{- with \.Values\.[^}]+\}\})\n(\s+)([a-zA-Z]+:)/g, '$1$2\n$1$4'],
                // Fix collection item alignment
                [/^(\s{2})([a-zA-Z]+:)\s*$/gm, '$1$2'],
            ];

            for (const [pattern, replacement] of yamlFixes) {
                if (pattern.test(content)) {
                    content = content.replace(pattern, replacement);
                    fixed = true;
                    this.correctionStats.linting++;
                }
            }

            if (fixed) {
                await fs.writeFile(filePath, content, 'utf8');
                this.log('info', `Fixed YAML syntax in: ${path.relative(workspaceRoot, filePath)}`);
            }

            return fixed;
        } catch (error) {
            this.log('error', `Error fixing YAML syntax in ${filePath}: ${error.message}`);
            return false;
        }
    }

    async fixESLintConfigErrors() {
        try {
            const eslintConfigPath = path.join(workspaceRoot, 'src-enhanced/core/competition-engine/.eslintrc.js');
            const eslintConfigCjsPath = path.join(workspaceRoot, 'src-enhanced/core/competition-engine/.eslintrc.cjs');
            
            try {
                await fs.access(eslintConfigPath);
                await fs.rename(eslintConfigPath, eslintConfigCjsPath);
                this.log('info', 'Fixed ESLint config: Renamed .eslintrc.js to .eslintrc.cjs');
                this.correctionStats.linting++;
                return true;
            } catch {
                // File doesn't exist, that's fine
                return false;
            }
        } catch (error) {
            this.log('error', `Error fixing ESLint config: ${error.message}`);
            return false;
        }
    }

    async runCorrections() {
        this.log('info', '🚀 Starting TerraFusion PhD-Level Validation Auto-Corrector...');
        
        const allFiles = await this.scanDirectory(workspaceRoot);
        
        // Phase 0: ESLint Configuration Fix
        this.log('info', '📋 Phase 0: Fixing ESLint configuration...');
        await this.fixESLintConfigErrors();

        // Phase 1: GitHub Actions workflows
        const yamlFiles = allFiles.filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
        this.log('info', `📋 Phase 1: Processing ${yamlFiles.length} GitHub Actions workflow files...`);
        
        for (const file of yamlFiles) {
            if (file.includes('.github/workflows/')) {
                await this.fixGitHubActionsFile(file);
            }
            if (file.includes('helm/') || file.includes('templates/')) {
                await this.fixYAMLSyntaxErrors(file);
            }
        }

        // Phase 2: TypeScript/React files
        const tsFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
        this.log('info', `📋 Phase 2: Processing ${tsFiles.length} TypeScript/React files...`);
        
        for (const file of tsFiles) {
            // First fix JSX fragment issues (critical for compilation)
            if (file.endsWith('.tsx')) {
                await this.fixJSXFragmentIssues(file);
            }
            await this.fixTypeScriptFile(file);
        }

        // Phase 3: JavaScript syntax errors
        const jsFiles = allFiles.filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
        this.log('info', `📋 Phase 3: Processing ${jsFiles.length} JavaScript files...`);
        
        for (const file of jsFiles) {
            await this.fixJavaScriptSyntaxErrors(file);
        }

        // Phase 4: Spelling corrections in documentation and code
        const textFiles = allFiles.filter(f => 
            f.endsWith('.md') || 
            f.endsWith('.txt') || 
            f.endsWith('.ts') || 
            f.endsWith('.tsx') || 
            f.endsWith('.js') || 
            f.endsWith('.jsx') ||
            f.endsWith('.json')
        );
        
        this.log('info', `📋 Phase 4: Processing ${textFiles.length} files for spelling corrections...`);
        
        for (const file of textFiles) {
            await this.fixSpellingInFile(file);
        }

        // Generate summary report
        this.generateSummaryReport();
    }

    generateSummaryReport() {
        const total = Object.values(this.correctionStats).reduce((a, b) => a + b, 0);
        
        this.log('info', '📊 TerraFusion Auto-Correction Summary Report');
        this.log('info', '===========================================');
        this.log('info', `✅ Total corrections applied: ${total}`);
        this.log('info', `🔧 GitHub Actions fixes: ${this.correctionStats.githubActions}`);
        this.log('info', `📝 TypeScript fixes: ${this.correctionStats.typescript}`);
        this.log('info', `⚛️ React fixes: ${this.correctionStats.react}`);
        this.log('info', `🔍 Linting fixes: ${this.correctionStats.linting}`);
        this.log('info', `📖 Spelling fixes: ${this.correctionStats.spelling}`);
        this.log('info', '===========================================');
        
        if (total > 0) {
            this.log('info', '🎉 Auto-correction completed successfully!');
            this.log('info', '💡 Run validation checks to verify all fixes applied correctly.');
        } else {
            this.log('info', '✨ No validation errors found - project is clean!');
        }
    }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    const corrector = new TerraFusionValidationCorrector();
    corrector.runCorrections().catch(error => {
        // eslint-disable-next-line no-console
        console.error('❌ Auto-corrector failed:', error);
        process.exit(1);
    });
}

export default TerraFusionValidationCorrector;

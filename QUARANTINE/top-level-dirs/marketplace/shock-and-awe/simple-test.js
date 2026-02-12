/**
 * Simple Test for Terrafusion Shock-and-Awe Module
 * Tests basic functionality without external dependencies
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class SimpleTestSuite {
    constructor() {
        this.baseUrl = 'http://127.0.0.1:8080';
        this.results = [];
    }

    async testServerConnection() {
        console.log('🔌 Testing server connection...');
        
        return new Promise((resolve) => {
            const req = http.get(this.baseUrl, (res) => {
                console.log(`✅ Server responding with status: ${res.statusCode}`);
                resolve(res.statusCode === 200);
            });
            
            req.on('error', (err) => {
                console.error(`❌ Server connection failed: ${err.message}`);
                resolve(false);
            });
            
            req.setTimeout(5000, () => {
                console.error('❌ Server connection timeout');
                req.destroy();
                resolve(false);
            });
        });
    }

    testFileStructure() {
        console.log('📁 Testing file structure...');
        
        const requiredFiles = [
            'index.html',
            'js/main.js',
            'js/costforge-wizard.js',
            'js/terra-miner.js', 
            'js/hybrid-llm-security.js',
            'styles/main.css',
            'styles/terrafusion-enhanced.css'
        ];
        
        const results = {};
        
        requiredFiles.forEach(file => {
            const fullPath = path.join(__dirname, file);
            const exists = fs.existsSync(fullPath);
            results[file] = exists;
            console.log(`${exists ? '✅' : '❌'} ${file}`);
        });
        
        return results;
    }

    analyzeJavaScriptFiles() {
        console.log('📜 Analyzing JavaScript files...');
        
        const jsFiles = [
            'js/main.js',
            'js/costforge-wizard.js',
            'js/terra-miner.js',
            'js/hybrid-llm-security.js'
        ];
        
        const analysis = {};
        
        jsFiles.forEach(file => {
            const fullPath = path.join(__dirname, file);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                analysis[file] = {
                    size: content.length,
                    hasClassDefinition: /class\s+\w+/.test(content),
                    hasWindowExport: /window\.\w+\s*=/.test(content),
                    hasLaunchFunction: /function\s+launch\w+|window\.launch\w+/.test(content),
                    syntaxErrors: this.checkBasicSyntax(content)
                };
                
                console.log(`📄 ${file}:`);
                console.log(`   Size: ${content.length} bytes`);
                console.log(`   Has class: ${analysis[file].hasClassDefinition}`);
                console.log(`   Has window export: ${analysis[file].hasWindowExport}`);
                console.log(`   Has launch function: ${analysis[file].hasLaunchFunction}`);
                
                if (analysis[file].syntaxErrors.length > 0) {
                    console.log(`   ⚠️  Potential syntax issues: ${analysis[file].syntaxErrors.length}`);
                }
            }
        });
        
        return analysis;
    }

    checkBasicSyntax(content) {
        const issues = [];
        
        // Check for unmatched braces
        const openBraces = (content.match(/\{/g) || []).length;
        const closeBraces = (content.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
            issues.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
        }
        
        // Check for unmatched parentheses
        const openParens = (content.match(/\(/g) || []).length;
        const closeParens = (content.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            issues.push(`Unmatched parentheses: ${openParens} open, ${closeParens} close`);
        }
        
        // Check for common syntax issues
        if (content.includes('window.launch') && !content.includes('function')) {
            issues.push('Window launch functions defined but no function keyword found');
        }
        
        return issues;
    }

    analyzeHTMLStructure() {
        console.log('🏗️  Analyzing HTML structure...');
        
        const htmlPath = path.join(__dirname, 'index.html');
        if (!fs.existsSync(htmlPath)) {
            console.error('❌ index.html not found');
            return null;
        }
        
        const content = fs.readFileSync(htmlPath, 'utf8');
        
        const analysis = {
            hasFeatureButtons: content.includes('feature-access-btn'),
            buttonCount: (content.match(/feature-access-btn/g) || []).length,
            hasScriptTags: content.includes('<script'),
            scriptCount: (content.match(/<script[^>]*src=/g) || []).length,
            hasStylesheets: content.includes('<link rel="stylesheet"'),
            stylesheetCount: (content.match(/<link rel="stylesheet"/g) || []).length,
            hasOnclickHandlers: content.includes('onclick='),
            onclickCount: (content.match(/onclick=/g) || []).length
        };
        
        console.log(`📄 HTML Analysis:`);
        console.log(`   Feature buttons: ${analysis.buttonCount}`);
        console.log(`   Script tags: ${analysis.scriptCount}`);
        console.log(`   Stylesheets: ${analysis.stylesheetCount}`);
        console.log(`   Onclick handlers: ${analysis.onclickCount}`);
        
        // Check for specific onclick handlers
        const onclickHandlers = content.match(/onclick="([^"]*)"/g) || [];
        console.log(`   Onclick functions: ${onclickHandlers.join(', ')}`);
        
        return analysis;
    }

    checkCSSFiles() {
        console.log('🎨 Checking CSS files...');
        
        const cssFiles = [
            'styles/main.css',
            'styles/terrafusion-enhanced.css',
            'styles/terrafusion-icons.css'
        ];
        
        const analysis = {};
        
        cssFiles.forEach(file => {
            const fullPath = path.join(__dirname, file);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                analysis[file] = {
                    size: content.length,
                    hasModalStyles: content.includes('.tf-modal') || content.includes('.costforge-wizard'),
                    hasButtonStyles: content.includes('.feature-access-btn'),
                    hasDisplayNone: content.includes('display: none'),
                    hasZIndex: content.includes('z-index')
                };
                
                console.log(`📄 ${file}: ${content.length} bytes`);
                console.log(`   Has modal styles: ${analysis[file].hasModalStyles}`);
                console.log(`   Has button styles: ${analysis[file].hasButtonStyles}`);
            } else {
                console.log(`❌ ${file}: NOT FOUND`);
            }
        });
        
        return analysis;
    }

    generateDiagnosticReport() {
        console.log('\n🔍 DIAGNOSTIC REPORT');
        console.log('====================');
        
        const fileStructure = this.testFileStructure();
        const jsAnalysis = this.analyzeJavaScriptFiles();
        const htmlAnalysis = this.analyzeHTMLStructure();
        const cssAnalysis = this.checkCSSFiles();
        
        // Identify potential issues
        console.log('\n🚨 POTENTIAL ISSUES:');
        
        let issueCount = 0;
        
        // Check for missing files
        Object.entries(fileStructure).forEach(([file, exists]) => {
            if (!exists) {
                console.log(`❌ Missing file: ${file}`);
                issueCount++;
            }
        });
        
        // Check for JavaScript issues
        Object.entries(jsAnalysis).forEach(([file, info]) => {
            if (info.syntaxErrors && info.syntaxErrors.length > 0) {
                console.log(`⚠️  ${file}: ${info.syntaxErrors.join(', ')}`);
                issueCount++;
            }
            
            if (!info.hasLaunchFunction && file === 'js/main.js') {
                console.log(`❌ ${file}: No launch functions found`);
                issueCount++;
            }
        });
        
        // Check HTML issues
        if (htmlAnalysis && htmlAnalysis.onclickCount === 0) {
            console.log('❌ No onclick handlers found in HTML');
            issueCount++;
        }
        
        if (issueCount === 0) {
            console.log('✅ No obvious structural issues detected');
            console.log('💡 The problem is likely with runtime execution or CSS display');
        }
        
        console.log(`\n📊 Total issues found: ${issueCount}`);
        
        return {
            fileStructure,
            jsAnalysis,
            htmlAnalysis,
            cssAnalysis,
            issueCount
        };
    }

    async run() {
        console.log('🧪 Starting Terrafusion Simple Test Suite');
        console.log('=========================================\n');
        
        // Test server connection
        const serverOk = await this.testServerConnection();
        
        if (!serverOk) {
            console.log('❌ Server not running. Start with: npm run dev');
            return;
        }
        
        // Run diagnostic tests
        const report = this.generateDiagnosticReport();
        
        console.log('\n💡 RECOMMENDATIONS:');
        
        if (report.issueCount === 0) {
            console.log('1. Open browser to http://127.0.0.1:41007');
            console.log('2. Open Developer Tools (F12)');
            console.log('3. Click feature buttons and check console for errors');
            console.log('4. Run debugFeatures() in console to see detailed info');
        } else {
            console.log('1. Fix the structural issues identified above');
            console.log('2. Re-run this test suite');
            console.log('3. Then test in browser');
        }
        
        console.log('\n🏁 Test suite complete');
    }
}

// Run the test suite
const suite = new SimpleTestSuite();
suite.run().catch(console.error);
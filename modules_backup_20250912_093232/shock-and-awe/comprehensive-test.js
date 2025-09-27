/**
 * Comprehensive Feature Test for Terrafusion Shock-and-Awe
 * Tests all features and identifies specific issues
 */

const http = require('http');
const fs = require('fs');
'
'class ComprehensiveFeatureTester {
'    constructor() {
'        this.baseUrl = 'http://127.0.0.1:\${{TF_ADMIN_PORT:-8080}}';
'        this.features = [
'            {
'                name: 'CostForge AI',
'                function: 'launchCostForgeWizard',
'                className: 'CostForgeWizard',
'                file: 'js/costforge-wizard.js',
'                expectedModal: 'costforge-wizard'
'            },
'            {
'                name: 'GIS Pro', 
'                function: 'launchGISViewer',
'                className: 'GISViewer',
'                file: 'js/gis-viewer.js',
'                expectedModal: 'gis-viewer'
'            },
'            {
'                name: 'Terra-Levy',
'                function: 'launchTerraLevy', 
'                className: 'TerraLevy',
'                file: 'js/terra-levy.js',
'                expectedModal: 'terra-levy'
'            },
'            {
'                name: 'Terra-Miner',
'                function: 'launchTerraMiner',
'                className: 'TerraMiner', 
'                file: 'js/terra-miner.js',
'                expectedModal: 'terra-miner'
'            },
'            {
'                name: 'AI Swarm',
'                function: 'showAISwarmViz',
'                className: 'AISwarmVisualization',
'                file: 'js/ai-swarm.js',
'                expectedModal: 'ai-swarm'
'            },
'            {
'                name: 'Hybrid LLM Security',
'                function: 'launchHybridLLMSecurity',
'                className: 'HybridLLMSecurity',
'                file: 'js/hybrid-llm-security.js',
'                expectedModal: 'hybrid-llm'
'            }
'        ];
'    }
'
'    async testJavaScriptFiles() {
'        console.log('📜 Testing JavaScript file integrity...');
'        
'        const results = {};
'        
'        for (const feature of this.features) {
'            const filePath = `/mnt/e/TerraFusion_OS_1.0/modules/shock-and-awe/ + 'feature.file + '`;
'            
'            try {
'                if (fs.existsSync(filePath)) {
'                    const content = fs.readFileSync(filePath, 'utf8');
'                    
'                    const analysis = {
'                        exists: true,
'                        size: content.length,
'                        hasClass: content.includes('class ' + feature.className),
'                        hasWindowExport: content.includes('window.' + feature.className) || content.includes('window.' + feature.function),
'                        hasShowMethod: content.includes('.show()') || content.includes('show:') || content.includes('function show'),
'                        syntaxErrors: this.checkSyntax(content)
'                    };
'                    
'                    results[feature.name] = analysis;
'                    
'                    console.log('📄 ' + feature.name + ' (' + feature.file + '):');
'                    console.log('   ✅ File exists: ' + analysis.size + ' bytes');
'                    console.log('   ' + (analysis.hasClass ? '✅' : '❌') + ' Class ' + feature.className + ': ' + (analysis.hasClass ? 'Found' : 'Missing'));
'                    console.log('   ' + (analysis.hasWindowExport ? '✅' : '❌') + ' Window export: ' + (analysis.hasWindowExport ? 'Found' : 'Missing'));
'                    console.log('   ' + (analysis.hasShowMethod ? '✅' : '❌') + ' Show method: ' + (analysis.hasShowMethod ? 'Found' : 'Missing'));
'                    
'                    if (analysis.syntaxErrors.length > 0) {
'                        console.log(\`   ⚠️  Syntax issues: \ + 'analysis.syntaxErrors.join(', ') + '\`);
'                    }
'                } else {
'                    results[feature.name] = { exists: false };
'                    console.log(\`❌ \ + 'feature.name + ': File not found\`);
'                }
'            } catch (error) {
'                results[feature.name] = { exists: false, error: error.message };
'                console.log(\`❌ \ + 'feature.name + ': Error - \ + 'error.message + '\`);
'            }
'        }
'        
'        return results;
'    }
'
'    checkSyntax(content) {
'        const issues = [];
'        
'        // Basic syntax checks
'        const openBraces = (content.match(/\\{/g) || []).length;
'        const closeBraces = (content.match(/\\}/g) || []).length;
'        if (openBraces !== closeBraces) {
'            issues.push(\`Unmatched braces: \ + 'openBraces + ' open, \ + 'closeBraces + ' close\`);
'        }
'        
'        const openParens = (content.match(/\\(/g) || []).length;
'        const closeParens = (content.match(/\\)/g) || []).length;
'        if (openParens !== closeParens) {
'            issues.push(\`Unmatched parentheses: \ + 'openParens + ' open, \ + 'closeParens + ' close\`);
'        }
'        
'        return issues;
'    }
'
'    async testLaunchFunctions() {
'        console.log('🚀 Testing launch function definitions...');
'        
'        const mainJsPath = '/mnt/e/TerraFusion_OS_1.0/modules/shock-and-awe/js/main.js';
'        
'        if (fs.existsSync(mainJsPath)) {
'            const content = fs.readFileSync(mainJsPath, 'utf8');
'            
'            console.log('📄 Checking main.js for launch functions:');
'            
'            for (const feature of this.features) {
'                const hasFunction = content.includes(\`window.\ + 'feature.function + '\`);
'                const functionPattern = new RegExp(\`window\\\\.\ + 'feature.function + '\\\\s*=\\\\s*function\`);
'                const hasImplementation = functionPattern.test(content);
'                
'                console.log(\`   \ + 'hasFunction ? '✅' : '❌' + ' \ + 'feature.function + ': \ + 'hasFunction ? 'Defined' : 'Missing' + '\`);
'                if (hasFunction && !hasImplementation) {
'                    console.log(\`   ⚠️  Function declared but may not be implemented properly\`);
'                }
'            }
'        } else {
'            console.log('❌ main.js not found');
'        }
'    }
'
'    async identifyMissingComponents() {
'        console.log('\\n🔍 IDENTIFYING MISSING COMPONENTS:');
'        
'        const jsResults = await this.testJavaScriptFiles();
'        
'        console.log('\\n📊 COMPONENT ANALYSIS:');
'        
'        let workingFeatures = 0;
'        let totalFeatures = this.features.length;
'        
'        for (const feature of this.features) {
'            const result = jsResults[feature.name];
'            
'            if (result && result.exists) {
'                if (result.hasClass && result.hasWindowExport) {
'                    console.log(\`✅ \ + 'feature.name + ': READY\`);
'                    workingFeatures++;
'                } else {
'                    console.log(\`⚠️  \ + 'feature.name + ': NEEDS FIXES\`);
'                    if (!result.hasClass) {
'                        console.log(\`     - Missing class \ + 'feature.className + '\`);
'                    }
'                    if (!result.hasWindowExport) {
'                        console.log(\`     - Missing window export\`);
'                    }
'                    if (!result.hasShowMethod) {
'                        console.log(\`     - Missing show method\`);
'                    }
'                }
'            } else {
'                console.log(\`❌ \ + 'feature.name + ': FILE MISSING\`);
'            }
'        }
'        
'        console.log(\`\\n🎯 SUMMARY: \ + 'workingFeatures + '/\ + 'totalFeatures + ' features ready\`);
'        
'        return {
'            workingFeatures,
'            totalFeatures,
'            jsResults
'        };
'    }
'
'    async generateFixPlan(analysisResults) {
'        console.log('\\n🛠️  GENERATING FIX PLAN:');
'        
'        const fixes = [];
'        
'        for (const feature of this.features) {
'            const result = analysisResults.jsResults[feature.name];
'            
'            if (!result || !result.exists) {
'                fixes.push({
'                    feature: feature.name,
'                    priority: 'HIGH',
'                    action: \`Create \ + 'feature.file + ' with \ + 'feature.className + ' class\`
'                });
'            } else if (!result.hasClass) {
'                fixes.push({
'                    feature: feature.name,
'                    priority: 'HIGH', 
'                    action: \`Add \ + 'feature.className + ' class definition\`
'                });
'            } else if (!result.hasWindowExport) {
'                fixes.push({
'                    feature: feature.name,
'                    priority: 'MEDIUM',
'                    action: \`Add window export for \ + 'feature.className + '\`
'                });
'            } else if (!result.hasShowMethod) {
'                fixes.push({
'                    feature: feature.name,
'                    priority: 'MEDIUM',
'                    action: \`Add show() method to \ + 'feature.className + '\`
'                });
'            }
'        }
'        
'        console.log('Priority fixes needed:');
'        fixes.forEach((fix /* , index */) => {
'            console.log(\`\ + 'index + 1 + '. [\ + 'fix.priority + '] \ + 'fix.feature + ': \ + 'fix.action + '\`);
'        });
'        
'        return fixes;
'    }
'
'    async run() {
'        console.log('🧪 COMPREHENSIVE TERRAFUSION FEATURE TESTING');
'        console.log('===========================================\\n');
'        
'        // Test launch function definitions
'        await this.testLaunchFunctions();
'        
'        // Analyze all components
'        const analysisResults = await this.identifyMissingComponents();
'        
'        // Generate fix plan
'        const fixes = await this.generateFixPlan(analysisResults);
'        
'        console.log('\\n🎯 NEXT STEPS:');
'        if (fixes.length === 0) {
'            console.log('✅ All features appear to be properly configured!');
'            console.log('💡 If features still don\\'t work, the issue may be with CSS or runtime execution');
'        } else {
'            console.log('🔧 Apply the fixes listed above in priority order');
'            console.log('🧪 Re-run this test after each fix');
'        }
'        
'        console.log('\\n🏁 Comprehensive test complete!');
'        
'        return {
'            analysisResults,
'            fixes
'        };
'    }
'}
'
'// Run comprehensive test
'const tester = new ComprehensiveFeatureTester();
'tester.run().catch(console.error);
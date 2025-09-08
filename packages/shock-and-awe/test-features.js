/**
 * Test Suite for Terrafusion Shock-and-Awe Module
 * Tests all feature buttons and modal functionality
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class FeatureTestSuite {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.baseUrl = 'http://127.0.0.1:41007';
    }

    async init() {
        console.log('🚀 Initializing Terrafusion Feature Test Suite...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for CI
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Listen for console messages
        this.page.on('console', msg => {
            console.log(`🔍 BROWSER: ${msg.text()}`);
        });
        
        // Listen for errors
        this.page.on('pageerror', err => {
            console.error(`❌ PAGE ERROR: ${err.message}`);
        });
        
        // Set viewport
        await this.page.setViewport({
            width: 1920,
            height: 1080
        });
        
        console.log('✅ Test suite initialized');
    }

    async loadPage() {
        console.log(`📄 Loading page: ${this.baseUrl}`);
        
        try {
            await this.page.goto(this.baseUrl, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            
            // Wait for the main app to initialize
            await this.page.waitForSelector('.hero-features-grid', { timeout: 10000 });
            
            console.log('✅ Page loaded successfully');
            return true;
        } catch (error) {
            console.error(`❌ Failed to load page: ${error.message}`);
            return false;
        }
    }

    async testFeatureAvailability() {
        console.log('🔍 Testing feature availability...');
        
        const result = await this.page.evaluate(() => {
            // Run the debug function we added
            if (typeof window.debugFeatures === 'function') {
                window.debugFeatures();
            }
            
            return {
                classes: {
                    CostForgeWizard: typeof CostForgeWizard,
                    TerraMiner: typeof TerraMiner,
                    HybridLLMSecuritySystem: typeof HybridLLMSecuritySystem
                },
                functions: {
                    launchCostForgeWizard: typeof window.launchCostForgeWizard,
                    launchTerraMiner: typeof window.launchTerraMiner,
                    launchHybridLLMSecurity: typeof window.launchHybridLLMSecurity
                },
                elements: {
                    featureButtons: document.querySelectorAll('.feature-access-btn').length,
                    heroGrid: !!document.querySelector('.hero-features-grid')
                }
            };
        });
        
        this.testResults.push({
            test: 'Feature Availability',
            passed: result.functions.launchCostForgeWizard === 'function',
            details: result
        });
        
        console.log('📊 Feature availability results:', result);
        return result;
    }

    async testFeatureButton(buttonSelector, featureName) {
        console.log(`🔘 Testing ${featureName} button...`);
        
        try {
            // Check if button exists
            const buttonExists = await this.page.$(buttonSelector);
            if (!buttonExists) {
                throw new Error(`Button ${buttonSelector} not found`);
            }
            
            // Get initial modal count
            const initialModals = await this.page.evaluate(() => {
                return document.querySelectorAll('.tf-modal, .costforge-wizard-container, .ai-swarm-container').length;
            });
            
            // Click the button
            await this.page.click(buttonSelector);
            
            // Wait a moment for modal to appear
            await this.page.waitForTimeout(1000);
            
            // Check if modal appeared
            const finalModals = await this.page.evaluate(() => {
                const modals = document.querySelectorAll('.tf-modal, .costforge-wizard-container, .ai-swarm-container');
                return {
                    count: modals.length,
                    visible: Array.from(modals).some(modal => {
                        const style = window.getComputedStyle(modal);
                        return style.display !== 'none';
                    })
                };
            });
            
            const modalAppeared = finalModals.count > initialModals || finalModals.visible;
            
            this.testResults.push({
                test: `${featureName} Button`,
                passed: modalAppeared,
                details: {
                    initialModals,
                    finalModals,
                    modalAppeared
                }
            });
            
            console.log(`${modalAppeared ? '✅' : '❌'} ${featureName}: ${modalAppeared ? 'PASSED' : 'FAILED'}`);
            
            // Close modal if it appeared
            if (modalAppeared) {
                await this.page.evaluate(() => {
                    const closeButtons = document.querySelectorAll('.tf-modal-close, .wizard-close, .swarm-close');
                    if (closeButtons.length > 0) {
                        closeButtons[closeButtons.length - 1].click();
                    }
                });
                await this.page.waitForTimeout(500);
            }
            
            return modalAppeared;
            
        } catch (error) {
            console.error(`❌ Error testing ${featureName}: ${error.message}`);
            this.testResults.push({
                test: `${featureName} Button`,
                passed: false,
                error: error.message
            });
            return false;
        }
    }

    async runAllTests() {
        console.log('🧪 Running comprehensive feature tests...');
        
        const features = [
            { selector: 'button[onclick="launchCostForgeWizard()"]', name: 'CostForge AI' },
            { selector: 'button[onclick="launchGISViewer()"]', name: 'GIS Pro' },
            { selector: 'button[onclick="launchTerraLevy()"]', name: 'Terra-Levy' },
            { selector: 'button[onclick="showAISwarmViz()"]', name: 'AI Swarm' },
            { selector: 'button[onclick="launchTerraMiner()"]', name: 'Terra-Miner' },
            { selector: 'button[onclick="launchHybridLLMSecurity()"]', name: 'Hybrid LLM' }
        ];
        
        // Test feature availability first
        await this.testFeatureAvailability();
        
        // Test each feature button
        for (const feature of features) {
            await this.testFeatureButton(feature.selector, feature.name);
            await this.page.waitForTimeout(1000); // Wait between tests
        }
    }

    async testSpecificIssues() {
        console.log('🔧 Testing specific known issues...');
        
        // Test CSS loading
        const cssLoaded = await this.page.evaluate(() => {
            const stylesheets = Array.from(document.styleSheets);
            return {
                total: stylesheets.length,
                loaded: stylesheets.filter(sheet => {
                    try {
                        return sheet.cssRules && sheet.cssRules.length > 0;
                    } catch (e) {
                        return false;
                    }
                }).length
            };
        });
        
        console.log('📄 CSS Status:', cssLoaded);
        
        // Test JavaScript loading
        const jsLoaded = await this.page.evaluate(() => {
            const scripts = Array.from(document.scripts);
            return {
                total: scripts.length,
                withSrc: scripts.filter(s => s.src).length,
                terrafusionScripts: scripts.filter(s => s.src && s.src.includes('js/')).length
            };
        });
        
        console.log('📜 JavaScript Status:', jsLoaded);
        
        // Test modal CSS classes
        const modalClasses = await this.page.evaluate(() => {
            // Create a test modal to check if styles are applied
            const testModal = document.createElement('div');
            testModal.className = 'tf-modal costforge-wizard-container';
            testModal.style.position = 'fixed';
            testModal.style.display = 'none';
            document.body.appendChild(testModal);
            
            const computedStyle = window.getComputedStyle(testModal);
            const result = {
                position: computedStyle.position,
                display: computedStyle.display,
                zIndex: computedStyle.zIndex,
                hasBackdropFilter: computedStyle.backdropFilter !== 'none'
            };
            
            document.body.removeChild(testModal);
            return result;
        });
        
        console.log('🎨 Modal CSS Status:', modalClasses);
    }

    generateReport() {
        console.log('\n📋 TERRAFUSION FEATURE TEST REPORT');
        console.log('=====================================');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const passRate = ((passed / total) * 100).toFixed(1);
        
        console.log(`Overall: ${passed}/${total} tests passed (${passRate}%)`);
        console.log('');
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.test}`);
            
            if (!result.passed && result.error) {
                console.log(`   Error: ${result.error}`);
            }
            
            if (result.details) {
                console.log(`   Details:`, JSON.stringify(result.details, null, 2));
            }
        });
        
        // Save report to file
        const reportPath = path.join(__dirname, 'test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: { passed, total, passRate },
            results: this.testResults
        }, null, 2));
        
        console.log(`\n💾 Full report saved to: ${reportPath}`);
        
        return { passed, total, passRate };
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Run the test suite
async function runTests() {
    const suite = new FeatureTestSuite();
    
    try {
        await suite.init();
        
        const pageLoaded = await suite.loadPage();
        if (!pageLoaded) {
            console.error('❌ Could not load page - make sure the dev server is running on port 41007');
            return;
        }
        
        await suite.runAllTests();
        await suite.testSpecificIssues();
        
        const summary = suite.generateReport();
        
        if (summary.passed === summary.total) {
            console.log('\n🎉 All tests passed! Features are working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the details above for debugging information.');
        }
        
    } catch (error) {
        console.error('❌ Test suite error:', error);
    } finally {
        await suite.cleanup();
    }
}

// Check if this is being run directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = FeatureTestSuite;
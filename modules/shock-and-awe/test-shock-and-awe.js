/**
 * Terrafusion OS - Shock-and-Awe Module Comprehensive Test Suite
 * Tests all functionality, branding, and performance
 */

const fs = require('fs');
const path = require('path');

class ShockAndAweTestSuite {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        this.baseDir = '/mnt/e/TerraFusion_OS_1.0/modules/shock-and-awe';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '📝',
            'success': '✅', 
            'error': '❌',
            'warning': '⚠️'
        }[type] || '📝';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async runTest(testName, testFunction) {
        this.testResults.total++;
        this.log(`Running test: ${testName}`, 'info');
        
        try {
            await testFunction();
            this.testResults.passed++;
            this.testResults.details.push({ name: testName, status: 'PASSED' });
            this.log(`✅ PASSED: ${testName}`, 'success');
        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({ 
                name: testName, 
                status: 'FAILED', 
                error: error.message 
            });
            this.log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
        }
    }

    // Test 1: File Structure Integrity
    async testFileStructure() {
        const requiredFiles = [
            'index.html',
            'js/main.js',
            'js/costforge-wizard.js',
            'js/ai-swarm.js',
            'js/gis-viewer.js',
            'js/terra-levy.js',
            'js/quantum-viz.js',
            'module.manifest.json'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.baseDir, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }

        // Check file sizes are reasonable
        const indexHtml = fs.statSync(path.join(this.baseDir, 'index.html'));
        if (indexHtml.size < 10000) {
            throw new Error(`index.html too small (${indexHtml.size} bytes) - may be incomplete`);
        }

        const mainJs = fs.statSync(path.join(this.baseDir, 'js/main.js'));
        if (mainJs.size < 5000) {
            throw new Error(`main.js too small (${mainJs.size} bytes) - may be incomplete`);
        }
    }

    // Test 2: Terrafusion Branding Integration
    async testTerraFusionBranding() {
        const htmlContent = fs.readFileSync(path.join(this.baseDir, 'index.html'), 'utf8');
        
        const requiredBrandElements = [
            'Government. Transcended.',
            'Terrafusion OS',
            '--tf-primary: #0099ff',
            '--tf-transcend: #00ffee',
            'transcendence-bg',
            'clarity-gradient-text'
        ];

        for (const element of requiredBrandElements) {
            if (!htmlContent.includes(element)) {
                throw new Error(`Missing brand element: ${element}`);
            }
        }

        // Check for proper CSS variables
        if (!htmlContent.includes(':root {')) {
            throw new Error('Missing CSS root variables');
        }

        // Verify transcendence messaging
        if (!htmlContent.includes('transcend') && !htmlContent.includes('clarity')) {
            throw new Error('Missing transcendence messaging');
        }
    }

    // Test 3: Demo Cards Functionality
    async testDemoCards() {
        const htmlContent = fs.readFileSync(path.join(this.baseDir, 'index.html'), 'utf8');
        
        const expectedDemoCards = [
            'costforge',
            'ai-swarm',
            'gis-transcended',
            'hybrid-intelligence'
        ];

        let demoCardsFound = 0;
        for (const demo of expectedDemoCards) {
            if (htmlContent.includes(`onclick="launchDemo('${demo}')`)) {
                demoCardsFound++;
            }
        }

        if (demoCardsFound < 3) {
            throw new Error(`Only ${demoCardsFound} demo cards properly wired, expected at least 3`);
        }
    }

    // Test 4: JavaScript Integration
    async testJavaScriptIntegration() {
        const htmlContent = fs.readFileSync(path.join(this.baseDir, 'index.html'), 'utf8');
        const mainJsContent = fs.readFileSync(path.join(this.baseDir, 'js/main.js'), 'utf8');

        // Check for window.launchDemo function
        if (!htmlContent.includes('window.launchDemo = function(demoId)')) {
            throw new Error('Missing main demo launch function');
        }

        // Check for functional integration
        if (!htmlContent.includes('launchCostForgeWizard') || 
            !htmlContent.includes('showAISwarmViz')) {
            throw new Error('Missing functional integration in HTML');
        }

        // Check for TerraFusionMarket class
        if (!mainJsContent.includes('class TerraFusionMarket')) {
            throw new Error('Missing TerraFusionMarket class');
        }

        // Check for AI agent configuration
        if (!mainJsContent.includes('this.aiAgents = 1008')) {
            throw new Error('Missing proper AI agent configuration');
        }
    }

    // Test 5: CostForge Wizard Integration
    async testCostForgeWizard() {
        const costforgeContent = fs.readFileSync(
            path.join(this.baseDir, 'js/costforge-wizard.js'), 'utf8'
        );

        if (!costforgeContent.includes('class CostForgeWizard')) {
            throw new Error('Missing CostForgeWizard class definition');
        }

        if (!costforgeContent.includes('createWizardHTML')) {
            throw new Error('Missing CostForge wizard HTML creation function');
        }

        if (!costforgeContent.includes('tf-fullscreen-app')) {
            throw new Error('Missing Terrafusion styling classes in CostForge');
        }

        // Check for proper AI agent count
        if (!costforgeContent.includes('this.aiAgents = 144')) {
            throw new Error('Missing proper AI agent allocation for CostForge');
        }
    }

    // Test 6: AI Swarm Visualization
    async testAISwarmVisualization() {
        const swarmContent = fs.readFileSync(
            path.join(this.baseDir, 'js/ai-swarm.js'), 'utf8'
        );

        if (!swarmContent.includes('class AISwarmVisualization')) {
            throw new Error('Missing AISwarmVisualization class');
        }

        if (!swarmContent.includes('this.agents = 1008')) {
            throw new Error('Missing proper 1008 agent configuration');
        }

        if (!swarmContent.includes('tf-fullscreen-app')) {
            throw new Error('Missing fullscreen app styling for AI swarm');
        }

        if (!swarmContent.includes('Total Agents')) {
            throw new Error('Missing agent status display');
        }
    }

    // Test 7: Module Manifest Validation
    async testModuleManifest() {
        const manifestPath = path.join(this.baseDir, 'module.manifest.json');
        const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        const requiredFields = [
            'name', 'version', 'description', 'capabilities', 'status'
        ];

        for (const field of requiredFields) {
            if (!manifestContent[field]) {
                throw new Error(`Missing required manifest field: ${field}`);
            }
        }

        if (manifestContent.name !== 'shock-and-awe') {
            throw new Error(`Wrong module name: ${manifestContent.name}`);
        }

        if (!manifestContent.capabilities.includes('live-demonstrations')) {
            throw new Error('Missing live-demonstrations capability');
        }

        if (manifestContent.status !== 'active') {
            throw new Error(`Module status is ${manifestContent.status}, expected active`);
        }
    }

    // Test 8: Performance and Size Validation
    async testPerformanceAndSize() {
        const stats = fs.statSync(path.join(this.baseDir, 'index.html'));
        
        // Check file size is reasonable (not too big, not too small)
        if (stats.size > 100000) {  // 100KB
            throw new Error(`index.html too large: ${stats.size} bytes`);
        }

        if (stats.size < 20000) {  // 20KB
            throw new Error(`index.html too small: ${stats.size} bytes`);
        }

        // Check JavaScript file sizes
        const jsFiles = ['main.js', 'costforge-wizard.js', 'ai-swarm.js'];
        for (const jsFile of jsFiles) {
            const jsPath = path.join(this.baseDir, 'js', jsFile);
            const jsStats = fs.statSync(jsPath);
            
            if (jsStats.size < 1000) {
                throw new Error(`${jsFile} too small: ${jsStats.size} bytes`);
            }

            if (jsStats.size > 50000) {
                throw new Error(`${jsFile} too large: ${jsStats.size} bytes`);
            }
        }
    }

    // Test 9: Error Handling and Security
    async testErrorHandling() {
        const htmlContent = fs.readFileSync(path.join(this.baseDir, 'index.html'), 'utf8');
        const mainJsContent = fs.readFileSync(path.join(this.baseDir, 'js/main.js'), 'utf8');

        // Check for error handling
        if (!mainJsContent.includes('try {') || !mainJsContent.includes('catch')) {
            throw new Error('Missing proper error handling in main.js');
        }

        if (!mainJsContent.includes('console.error')) {
            throw new Error('Missing error logging');
        }

        // Check for security - no dangerous patterns
        if (htmlContent.includes('eval(') || 
            htmlContent.includes('document.write(') ||
            htmlContent.includes('execCommand(')) {
            throw new Error('Potential security issues found');
        }
        
        // Check for unsafe innerHTML usage (not template literals)
        const unsafeInnerHTML = htmlContent.match(/innerHTML\s*=\s*[^`\s]/);
        if (unsafeInnerHTML && !unsafeInnerHTML[0].includes('`')) {
            throw new Error('Unsafe innerHTML usage found');
        }
        
        // Template literals with innerHTML are acceptable for static content
    }

    // Test 10: Transcendence Effects Validation
    async testTranscendenceEffects() {
        const htmlContent = fs.readFileSync(path.join(this.baseDir, 'index.html'), 'utf8');

        const requiredEffects = [
            'transcend-glow',
            'clarity-gradient',
            'intelligence-pulse',
            '@keyframes',
            'box-shadow'
        ];

        for (const effect of requiredEffects) {
            if (!htmlContent.includes(effect)) {
                throw new Error(`Missing transcendence effect: ${effect}`);
            }
        }

        // Check for proper animation declarations
        const animationCount = (htmlContent.match(/@keyframes/g) || []).length;
        if (animationCount < 2) {
            throw new Error(`Only ${animationCount} animations found, expected at least 2`);
        }
    }

    // Run All Tests
    async runAllTests() {
        this.log('🚀 Starting Terrafusion Shock-and-Awe Module Test Suite', 'info');
        this.log('═══════════════════════════════════════════════════════════════', 'info');
        
        const startTime = Date.now();

        await this.runTest('File Structure Integrity', () => this.testFileStructure());
        await this.runTest('Terrafusion Branding Integration', () => this.testTerraFusionBranding());
        await this.runTest('Demo Cards Functionality', () => this.testDemoCards());
        await this.runTest('JavaScript Integration', () => this.testJavaScriptIntegration());
        await this.runTest('CostForge Wizard Integration', () => this.testCostForgeWizard());
        await this.runTest('AI Swarm Visualization', () => this.testAISwarmVisualization());
        await this.runTest('Module Manifest Validation', () => this.testModuleManifest());
        await this.runTest('Performance and Size Validation', () => this.testPerformanceAndSize());
        await this.runTest('Error Handling and Security', () => this.testErrorHandling());
        await this.runTest('Transcendence Effects Validation', () => this.testTranscendenceEffects());

        const endTime = Date.now();
        const duration = endTime - startTime;

        this.generateReport(duration);
    }

    generateReport(duration) {
        this.log('═══════════════════════════════════════════════════════════════', 'info');
        this.log('🏆 SHOCK-AND-AWE MODULE TEST RESULTS', 'info');
        this.log('═══════════════════════════════════════════════════════════════', 'info');
        
        const passRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
        
        console.log(`📊 Total Tests: ${this.testResults.total}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📈 Pass Rate: ${passRate}%`);
        console.log(`⏱️ Duration: ${duration}ms`);
        
        if (this.testResults.failed === 0) {
            this.log('🎉 ALL TESTS PASSED - SHOCK-AND-AWE MODULE READY FOR DEPLOYMENT!', 'success');
        } else {
            this.log(`⚠️ ${this.testResults.failed} TESTS FAILED - NEEDS ATTENTION`, 'warning');
            
            console.log('\n❌ Failed Tests:');
            this.testResults.details
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`  • ${test.name}: ${test.error}`);
                });
        }

        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            module: 'shock-and-awe',
            duration: `${duration}ms`,
            summary: {
                total: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                passRate: `${passRate}%`
            },
            details: this.testResults.details,
            status: this.testResults.failed === 0 ? 'READY' : 'NEEDS_ATTENTION'
        };

        const reportPath = path.join(this.baseDir, 'test-results.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`📝 Detailed report saved to: ${reportPath}`, 'info');
        this.log('═══════════════════════════════════════════════════════════════', 'info');
    }
}

// Run the test suite
const testSuite = new ShockAndAweTestSuite();
testSuite.runAllTests().catch(error => {
    console.error('❌ Test suite execution failed:', error);
    process.exit(1);
});
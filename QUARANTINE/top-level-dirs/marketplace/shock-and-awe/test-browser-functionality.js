/**
 * Browser Functionality Test - Tests actual JavaScript execution
 * Run this in the browser console to test if functions are working
 */

// Test all launch functions
function testLaunchFunctions() {
    console.log('🧪 Testing all launch functions...');
    
    const functions = [
        'launchCostForgeWizard',
        'launchGISViewer', 
        'launchTerraLevy',
        'launchTerraMiner',
        'showAISwarmViz',
        'launchHybridLLMSecurity'
    ];
    
    const results = {};
    
    functions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ ${funcName}: Available`);
            results[funcName] = 'available';
            
            // Test if function executes without errors
            try {
                // Call function but capture any modal/UI creation
                const beforeModalCount = document.querySelectorAll('.modal, .wizard-container, .fullscreen-app').length;
                window[funcName]();
                const afterModalCount = document.querySelectorAll('.modal, .wizard-container, .fullscreen-app').length;
                
                if (afterModalCount > beforeModalCount) {
                    console.log(`✅ ${funcName}: Executed successfully (created UI)`);
                    results[funcName] += ' + working';
                    
                    // Close any modals that were created
                    setTimeout(() => {
                        const closeButtons = document.querySelectorAll('.close, .wizard-close, .modal-close');
                        closeButtons.forEach(btn => {
                            if (btn.offsetParent !== null) { // visible
                                btn.click();
                            }
                        });
                    }, 500);
                } else {
                    console.log(`⚠️  ${funcName}: Executed but no UI created`);
                    results[funcName] += ' + no-ui';
                }
            } catch (error) {
                console.error(`❌ ${funcName}: Error executing - ${error.message}`);
                results[funcName] += ' + error';
            }
        } else {
            console.error(`❌ ${funcName}: Not defined`);
            results[funcName] = 'missing';
        }
    });
    
    return results;
}

// Test CSS classes and styling
function testCSSClasses() {
    console.log('🎨 Testing CSS classes...');
    
    const requiredClasses = [
        '.feature-card',
        '.tf-modal',
        '.costforge-wizard-container', 
        '.fullscreen-app',
        '.wizard-backdrop'
    ];
    
    const results = {};
    
    requiredClasses.forEach(className => {
        const elements = document.querySelectorAll(className);
        if (elements.length > 0) {
            console.log(`✅ ${className}: Found ${elements.length} elements`);
            results[className] = elements.length;
        } else {
            console.log(`❌ ${className}: No elements found`);
            results[className] = 0;
        }
    });
    
    return results;
}

// Test event listeners
function testEventListeners() {
    console.log('🎯 Testing event listeners...');
    
    const featureCards = document.querySelectorAll('.feature-card[onclick]');
    console.log(`Found ${featureCards.length} feature cards with onclick handlers`);
    
    featureCards.forEach((card /* , index */) => {
        const onclick = card.getAttribute('onclick');
        console.log(`Card ${index + 1}: ${onclick}`);
        
        // Test click simulation
        try {
            card.click();
            console.log(`✅ Card ${index + 1}: Click simulation successful`);
        } catch (error) {
            console.error(`❌ Card ${index + 1}: Click simulation failed - ${error.message}`);
        }
    });
}

// Main test function
function runFullFunctionalityTest() {
    console.log('🚀 Starting Full Functionality Test');
    console.log('=====================================');
    
    const testResults = {
        functions: testLaunchFunctions(),
        css: testCSSClasses(),
        events: 'see console above'
    };
    
    console.log('🎯 Testing event listeners...');
    testEventListeners();
    
    console.log('📊 Test Results Summary:', testResults);
    
    // Check if Terrafusion main class is initialized
    if (typeof window.terraFusionApp !== 'undefined') {
        console.log('✅ Terrafusion main app: Initialized');
    } else {
        console.log('⚠️  Terrafusion main app: Not found on window object');
    }
    
    return testResults;
}

// Auto-run disabled to prevent interference
// Use debugFeatures() manually in console to run tests

// Export for manual use
window.debugFeatures = runFullFunctionalityTest;
window.testLaunchFunctions = testLaunchFunctions;
window.testCSSClasses = testCSSClasses;
window.testEventListeners = testEventListeners;

console.log('🛠️  Browser test functions loaded. Run debugFeatures() to test everything.');
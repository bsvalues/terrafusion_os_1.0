/**
 * Debug Module Launch Issues
 * Test script to identify what's happening when modules are clicked
 */

console.log('🔍 Starting module debug analysis...');

// Test if all required classes are loaded
const requiredClasses = ['CostForgeWizard', 'AISwarmVisualization', 'TerraFusionMarket'];

const requiredFunctions = [
  'launchCostForgeWizard',
  'showAISwarmViz',
  'launchGISViewer',
  'launchHybridLLMSecurity',
  'launchTerraLevy',
];

setTimeout(() => {
  console.log('=== CLASS AVAILABILITY ===');
  requiredClasses.forEach(className => {
    const exists = typeof window[className] !== 'undefined';
    console.log(`${exists ? '✅' : '❌'} ${className}: ${exists ? 'Available' : 'Missing'}`);
  });

  console.log('\n=== FUNCTION AVAILABILITY ===');
  requiredFunctions.forEach(funcName => {
    const exists = typeof window[funcName] === 'function';
    console.log(`${exists ? '✅' : '❌'} ${funcName}: ${exists ? 'Available' : 'Missing'}`);
  });

  console.log('\n=== TESTING COSTFORGE LAUNCH ===');
  try {
    if (typeof window.launchCostForgeWizard === 'function') {
      // Don't actually launch, just test the class instantiation
      if (typeof CostForgeWizard !== 'undefined') {
        console.log('✅ CostForgeWizard class is available for instantiation');
        // Test if we can create instance (but don't show it)
        const testInstance = new CostForgeWizard();
        console.log('✅ CostForgeWizard instance created successfully');
      } else {
        console.log('❌ CostForgeWizard class not found in global scope');
      }
    } else {
      console.log('❌ launchCostForgeWizard function not found');
    }
  } catch (error) {
    console.log('❌ Error testing CostForge:', error.message);
  }

  console.log('\n=== TESTING AI SWARM ===');
  try {
    if (typeof window.showAISwarmViz === 'function') {
      if (typeof AISwarmVisualization !== 'undefined') {
        console.log('✅ AISwarmVisualization class is available');
      } else {
        console.log('❌ AISwarmVisualization class not found');
      }
    } else {
      console.log('❌ showAISwarmViz function not found');
    }
  } catch (error) {
    console.log('❌ Error testing AI Swarm:', error.message);
  }

  console.log('\n=== DIAGNOSIS COMPLETE ===');
}, 2000); // Wait 2 seconds for all scripts to load

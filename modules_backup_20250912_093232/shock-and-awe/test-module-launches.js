/**
 * Test Module Launches
 * Automated testing of each demo card launch
 */

// Test script to verify module launches work
function testAllModuleLaunches() {
  console.log('🧪 Starting automated module launch testing...');

  const demos = [
    'costforge',
    'ai-swarm',
    'gis-transcended',
    'quantum-core',
    'hybrid-intelligence',
    'levy-optimizer',
  ];

  let testResults = [];

  // Test each demo with a delay
  demos.forEach((demo /* , index */) => {
    setTimeout(() => {
      console.log(`\n🚀 Testing demo: ${demo}`);

      try {
        // Call the enhanced launch function
        if (typeof enhancedLaunchDemo === 'function') {
          enhancedLaunchDemo(demo);
          testResults.push({ demo, status: 'SUCCESS', method: 'enhanced' });
          console.log(`✅ ${demo} launched successfully`);

          // Close any opened modals after 2 seconds
          setTimeout(() => {
            const modals = document.querySelectorAll(
              '[style*="position: fixed"][style*="z-index: 10000"]'
            );
            modals.forEach(modal => modal.remove());
          }, 2000);
        } else {
          console.log(`❌ enhancedLaunchDemo function not available for ${demo}`);
          testResults.push({ demo, status: 'FAILED', error: 'Function not available' });
        }
      } catch (error) {
        console.log(`❌ Error testing ${demo}:`, error.message);
        testResults.push({ demo, status: 'FAILED', error: error.message });
      }

      // Show results after all tests
      if (index === demos.length - 1) {
        setTimeout(() => {
          showTestResults(testResults);
        }, 3000);
      }
    }, index * 5000); // 5 second delay between tests
  });
}

function showTestResults(results) {
  console.log('\n📊 MODULE LAUNCH TEST RESULTS:');
  console.log('================================');

  results.forEach(result => {
    const status = result.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${status} ${result.demo}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const totalCount = results.length;

  console.log('================================');
  console.log(
    `📈 Success Rate: ${successCount}/${totalCount} (${Math.round((successCount / totalCount) * 100)}%)`
  );

  if (successCount === totalCount) {
    console.log('🎉 ALL MODULES WORKING!');
  } else {
    console.log('⚠️ Some modules need fixes');
  }
}

// Wait for everything to load, then test
setTimeout(() => {
  if (typeof enhancedLaunchDemo === 'function') {
    console.log('🔧 Enhanced launcher found - starting tests');
    testAllModuleLaunches();
  } else {
    console.log('❌ Enhanced launcher not found - testing basic functions');

    // Test basic functions
    const basicTests = ['launchCostForgeWizard', 'showAISwarmViz', 'launchGISViewer'];

    basicTests.forEach(funcName => {
      if (typeof window[funcName] === 'function') {
        console.log(`✅ ${funcName} available`);
      } else {
        console.log(`❌ ${funcName} missing`);
      }
    });
  }
}, 3000);

console.log('🧪 Module launch testing script loaded');

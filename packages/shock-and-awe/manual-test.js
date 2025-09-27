/**
 * Manual Module Test
 * Direct testing of module functionality
 */

// Simulate clicking on CostForge demo card
function testCostForgeDirectly() {
  console.log('🧪 Testing CostForge directly...');

  // Check if CostForgeWizard class exists
  if (typeof CostForgeWizard !== 'undefined') {
    console.log('✅ CostForgeWizard class found');

    try {
      const instance = new CostForgeWizard();
      console.log('✅ CostForgeWizard instance created');

      // Test the show method
      if (typeof instance.show === 'function') {
        console.log('✅ show() method exists');
        instance.show();
        console.log('✅ CostForge wizard displayed');
        return true;
      } else {
        console.log('❌ show() method missing');
        return false;
      }
    } catch (error) {
      console.log('❌ Error creating CostForge instance:', error.message);
      return false;
    }
  } else {
    console.log('❌ CostForgeWizard class not found');
    return false;
  }
}

// Test AI Swarm directly
function testAISwarmDirectly() {
  console.log('🧪 Testing AI Swarm directly...');

  if (typeof AISwarmVisualization !== 'undefined') {
    console.log('✅ AISwarmVisualization class found');

    try {
      const instance = new AISwarmVisualization();
      console.log('✅ AISwarmVisualization instance created');

      if (typeof instance.show === 'function') {
        console.log('✅ show() method exists');
        instance.show();
        console.log('✅ AI Swarm visualization displayed');
        return true;
      } else {
        console.log('❌ show() method missing');
        return false;
      }
    } catch (error) {
      console.log('❌ Error creating AI Swarm instance:', error.message);
      return false;
    }
  } else {
    console.log('❌ AISwarmVisualization class not found');
    return false;
  }
}

// Run manual tests
console.log('🔧 Starting manual module tests...');
setTimeout(() => {
  console.log('\n=== MANUAL TEST RESULTS ===');

  const costForgeResult = testCostForgeDirectly();
  setTimeout(() => {
    const aiSwarmResult = testAISwarmDirectly();

    console.log('\n📊 Test Summary:');
    console.log('CostForge:', costForgeResult ? '✅ WORKING' : '❌ NEEDS FIX');
    console.log('AI Swarm:', aiSwarmResult ? '✅ WORKING' : '❌ NEEDS FIX');

    if (costForgeResult && aiSwarmResult) {
      console.log('🎉 Core modules working correctly!');
    } else {
      console.log('⚠️ Some modules need attention');
    }
  }, 2000);
}, 2000);

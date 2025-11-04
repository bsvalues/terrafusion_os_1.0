/**
 * Command Line API Test Runner
 *
 * This script runs API tests from the command line using the universal API test module.
 * Usage: node test-api-cli.js [test-name]
 *
 * Examples:
 *   node test-api-cli.js                 # Run all tests
 *   node test-api-cli.js health          # Run health test only
 *   node test-api-cli.js llm-providers   # Run LLM providers test only
 */

// Import the universal API test module
import * as apiTests from './test-api-browser.js';

// Available tests mapping
const availableTests = {
  health: apiTests.testHealth,
  'llm-providers': apiTests.testLlmProviders,
  'llm-validation': apiTests.testLlmApiKeyValidation,
  'llm-generation': apiTests.testLlmGeneration,
  'agent-status': apiTests.testAgentSystemStatus,
  'gis-layers': apiTests.testGisLayers,
  properties: apiTests.testProperties,
};

// Format and print results
function printResult(name, result) {
  console.log(`\n===== ${name.toUpperCase()} TEST RESULT =====`);

  if (result.success) {
    console.log(`✅ SUCCESS (Status: ${result.status})`);
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log(`❌ ERROR: ${result.error || 'Unknown error'}`);
    if (result.status) {
      console.log(`Status: ${result.status}`);
    }
    if (result.text) {
      console.log(`Response text (truncated): ${result.text.substring(0, 200)}...`);
    } else if (result.data) {
      console.log(JSON.stringify(result.data, null, 2));
    }
  }
}

// Run specified test or all tests
async function main() {
  const testName = process.argv[2];

  if (testName && availableTests[testName]) {
    // Run specific test
    console.log(`Running test: ${testName}`);
    const result = await availableTests[testName]();
    printResult(testName, result);
  } else if (testName) {
    // Unknown test
    console.error(`Error: Unknown test "${testName}"`);
    console.log('Available tests:');
    Object.keys(availableTests).forEach(test => console.log(`  - ${test}`));
  } else {
    // Run all tests
    console.log('Running all tests...');
    const results = await apiTests.runAllTests();

    // Print summary
    console.log('\n===== TEST SUMMARY =====');
    Object.entries(results).forEach(([name, result]) => {
      if (result.success) {
        console.log(`✅ ${name}: SUCCESS`);
      } else {
        console.log(`❌ ${name}: FAILED - ${result.error || 'Unknown error'}`);
      }
    });
  }
}

// Run the script
main().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});

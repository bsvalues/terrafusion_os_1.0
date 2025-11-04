// Basic UI Testing Script
import fetch from 'node-fetch';
import assert from 'assert';

// Base URL for web requests
const BASE_URL = 'http://localhost:5000';

// Test the main page loads
async function testMainPageLoads() {
  console.log('Testing that the main page loads...');

  try {
    const response = await fetch(BASE_URL);
    const html = await response.text();

    assert(response.status === 200, `Expected status 200, but got ${response.status}`);
    assert(html.includes('<div id="root"></div>'), 'Expected page to include root div');

    console.log('✅ Main page load test passed!');
    return true;
  } catch (error) {
    console.error('❌ Main page load test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting UI tests...\n');

  let passedTests = 0;
  let totalTests = 0;

  // Main page load
  totalTests++;
  if (await testMainPageLoads()) passedTests++;

  console.log('\n--------------------------');
  console.log(`Test Results: ${passedTests}/${totalTests} tests passed`);
  console.log('--------------------------');

  // Return a success code only if all tests passed
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the tests
runAllTests();

/**
 * Master Test Runner
 * 
 * This script runs all the test scripts and provides a summary of results.
 */

import { spawn } from 'child_process';
import path from 'path';

// List of test scripts to run
const testScripts = [
  'test-frontend-errors.js',
  'test-agent-functionality.js',
  'test-database-integrity.js',
  'test-llm-integration.js',
  'test-gis-functionality.js'
];

// Helper function to run a test script
function runTestScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n============================================`);
    console.log(`RUNNING TEST: ${path.basename(scriptPath)}`);
    console.log(`============================================\n`);
    
    const testProcess = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: process.env
    });
    
    testProcess.on('close', (code) => {
      const success = code === 0;
      console.log(`\n${path.basename(scriptPath)} completed with status: ${success ? 'SUCCESS' : 'FAILURE'}`);
      resolve({ script: path.basename(scriptPath), success });
    });
    
    testProcess.on('error', (error) => {
      console.error(`Error executing ${scriptPath}:`, error);
      resolve({ script: path.basename(scriptPath), success: false, error: error.message });
    });
  });
}

// Run all tests and collect results
async function runAllTests() {
  console.log('===== STARTING COMPREHENSIVE SYSTEM TESTS =====\n');
  
  const startTime = Date.now();
  const results = [];
  
  for (const script of testScripts) {
    try {
      const result = await runTestScript(script);
      results.push(result);
    } catch (error) {
      console.error(`Unexpected error running ${script}:`, error);
      results.push({ script, success: false, error: error.message });
    }
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Print test summary
  console.log('\n===== TEST RESULTS SUMMARY =====');
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
  console.log(`Time Taken: ${duration.toFixed(2)} seconds`);
  console.log('\nDetailed Results:');
  
  results.forEach(result => {
    console.log(`${result.script}: ${result.success ? 'PASSED' : 'FAILED'}${result.error ? ` (${result.error})` : ''}`);
  });
  
  // Check for any node/puppeteer dependencies
  try {
    // In ESM we can't use require, so we'll assume the packages are available
    // since we've installed them with npm
    console.log('\nPuppeteer should be available for frontend testing');
    console.log('node-fetch should be available for API testing');
  } catch (error) {
    console.warn('\nError checking dependencies:', error);
  }
  
  console.log('\n===== SYSTEM TESTS COMPLETED =====');
}

// Execute all tests
runAllTests().catch(error => {
  console.error('Unhandled error in test runner:', error);
  process.exit(1);
});
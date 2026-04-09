#!/usr/bin/env node

/**
 * Test Runner
 * 
 * This script runs all test suites and reports results.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testsDir = __dirname;
const testFiles = fs.readdirSync(testsDir)
  .filter(file => file.endsWith('.test.js') && file !== 'run-tests.js');

console.log('=======================================');
console.log('🧪 Running Property Intelligence Platform Tests');
console.log('=======================================\n');

// Track test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Run each test file
testFiles.forEach(testFile => {
  const testPath = path.join(testsDir, testFile);
  console.log(`\n📋 Running test suite: ${testFile}`);
  console.log('---------------------------------------');
  
  try {
    // For Jest tests
    if (testFile === 'api.test.js') {
      console.log('API tests require a running server. These will be skipped in this run.');
      console.log('To run API tests, ensure the server is running and execute:');
      console.log('npx jest tests/api.test.js');
      totalTests += 1; // Count as a skipped test
    } 
    // For component tests (mock implementation in this case)
    else if (testFile === 'components.test.js') {
      const output = execSync(`node ${testPath}`, { encoding: 'utf8' });
      console.log(output);
      
      // Simple test counting (in a real scenario, would parse Jest output)
      if (output.includes('ALL COMPONENT TESTS PASSED')) {
        totalTests += 2; // Property and AI component test suites
        passedTests += 2;
      } else {
        totalTests += 2;
        passedTests += output.includes('PROPERTY TESTS PASSED') ? 1 : 0;
        passedTests += output.includes('AI TESTS PASSED') ? 1 : 0;
        failedTests += 2 - (output.includes('PROPERTY TESTS PASSED') ? 1 : 0) - (output.includes('AI TESTS PASSED') ? 1 : 0);
      }
    }
    // For LLM service tests
    else if (testFile === 'llm-service.test.js') {
      const output = execSync(`node ${testPath}`, { encoding: 'utf8' });
      console.log(output);
      
      // Count tests
      const runTests = (output.match(/TEST:/g) || []).length;
      const passedCount = (output.match(/PASSED/g) || []).length;
      
      totalTests += runTests;
      passedTests += passedCount;
      failedTests += runTests - passedCount;
    }
    // For any other test files
    else {
      const output = execSync(`node ${testPath}`, { encoding: 'utf8' });
      console.log(output);
      
      // Simple test counting based on output
      const runTests = (output.match(/TEST:/g) || []).length;
      const passedCount = (output.match(/PASSED/g) || []).length;
      
      totalTests += runTests;
      passedTests += passedCount;
      failedTests += runTests - passedCount;
    }
  } catch (error) {
    console.error(`❌ Error running test suite ${testFile}:`);
    console.error(error.message);
    failedTests += 1;
    totalTests += 1;
  }
});

// Report results
console.log('\n=======================================');
console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests}`);
console.log(`   ⏩ Skipped: ${totalTests - passedTests - failedTests}`);
console.log('=======================================');

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
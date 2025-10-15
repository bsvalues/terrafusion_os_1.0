#!/usr/bin/env node

/**
 * Terrafusion OS - Test Validation Runner
 * Validates test files and structure without requiring full test execution
 * Government. Transcended.
 */

const fs = require('fs');
const path = require('path');

// Color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function print(color, prefix, message) {
  console.log(`${colors[color]}[${prefix}]${colors.reset} ${message}`);
}

function printHeader() {
  console.log(`${colors.blue}
╔══════════════════════════════════════════════════════════════╗
║                Terrafusion OS Test Validation               ║
║                   Government. Transcended.                  ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
}

function validateTestFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = {
      path: filePath,
      size: content.length,
      hasDescribe: content.includes('describe('),
      hasTest: content.includes('test(') || content.includes('it('),
      hasExpect: content.includes('expect('),
      hasGovernmentBranding: content.includes('Government. Transcended'),
      hasBentonCounty: content.includes('Benton'),
      hasHarrisPacs: content.includes('Harris') || content.includes('PACS'),
      valid: true
    };
    
    // Basic validation
    if (!stats.hasTest && !stats.hasDescribe) {
      stats.valid = false;
      stats.error = 'No test functions found';
    }
    
    return stats;
  } catch (error) {
    return {
      path: filePath,
      valid: false,
      error: error.message
    };
  }
}

function findTestFiles(dir) {
  const testFiles = [];
  
  function scanDir(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.test.ts') || item.endsWith('.spec.ts')) {
          testFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }
  
  scanDir(dir);
  return testFiles;
}

function main() {
  printHeader();
  
  const testingDir = path.join(__dirname, '..');
  print('cyan', 'SCAN', `Scanning testing directory: ${testingDir}`);
  
  // Find all test files
  const testFiles = findTestFiles(testingDir);
  print('blue', 'INFO', `Found ${testFiles.length} test files`);
  
  let validTests = 0;
  let invalidTests = 0;
  const results = [];
  
  // Validate each test file
  for (const testFile of testFiles) {
    const result = validateTestFile(testFile);
    results.push(result);
    
    if (result.valid) {
      validTests++;
      print('green', 'VALID', path.relative(testingDir, result.path));
    } else {
      invalidTests++;
      print('red', 'INVALID', `${path.relative(testingDir, result.path)} - ${result.error}`);
    }
  }
  
  // Summary
  console.log(`\n${colors.green}╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║                    VALIDATION SUMMARY                       ║`);
  console.log(`╠══════════════════════════════════════════════════════════════╣`);
  console.log(`║                                                              ║`);
  console.log(`║  📁 Test Files Found: ${String(testFiles.length).padStart(3)} files                        ║`);
  console.log(`║  ✅ Valid Tests: ${String(validTests).padStart(3)} files                            ║`);
  console.log(`║  ❌ Invalid Tests: ${String(invalidTests).padStart(3)} files                          ║`);
  console.log(`║                                                              ║`);
  
  // Test categories found
  const categories = new Set();
  results.forEach(result => {
    if (result.valid) {
      const relativePath = path.relative(testingDir, result.path);
      const category = relativePath.split(path.sep)[0];
      categories.add(category);
    }
  });
  
  console.log(`║  📊 Test Categories: ${String(categories.size).padStart(2)} categories                     ║`);
  categories.forEach(category => {
    console.log(`║     - ${category.padEnd(20)}                              ║`);
  });
  
  console.log(`║                                                              ║`);
  console.log(`║  🏆 STATUS: ${validTests > 0 ? 'OPERATIONAL' : 'NEEDS SETUP'}                              ║`);
  console.log(`║  🏛️  Government. Transcended.                               ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  
  // Detailed analysis
  if (validTests > 0) {
    console.log(`\n${colors.cyan}[ANALYSIS]${colors.reset} Test Infrastructure Analysis:`);
    
    const governmentTests = results.filter(r => r.valid && r.hasGovernmentBranding).length;
    const bentonTests = results.filter(r => r.valid && r.hasBentonCounty).length;
    const harrisTests = results.filter(r => r.valid && r.hasHarrisPacs).length;
    
    console.log(`  🏛️  Government-branded tests: ${governmentTests}`);
    console.log(`  📍 Benton County tests: ${bentonTests}`);
    console.log(`  🔗 Harris PACS tests: ${harrisTests}`);
    
    const totalSize = results.reduce((sum, r) => sum + (r.size || 0), 0);
    console.log(`  📊 Total test code: ${(totalSize / 1024).toFixed(1)} KB`);
  }
  
  return validTests > 0 ? 0 : 1;
}

// Run the validation
process.exit(main());

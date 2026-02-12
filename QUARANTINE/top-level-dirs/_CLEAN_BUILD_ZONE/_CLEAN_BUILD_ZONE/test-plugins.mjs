#!/usr/bin/env node

/**
 * TerraFusion OS Plugin System Validation
 * Tests all 6 government plugins for compatibility and functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 TerraFusion OS Plugin System Validation');
console.log('==========================================');

const pluginsDir = path.join(__dirname, 'src', 'plugins');
const targetPlugins = [
  'cama-core',
  'gis-core',
  'harris-pacs',
  'levy-core',
  'valuation-tools',
  'costforge-ai'
];

let testResults = {
  totalPlugins: targetPlugins.length,
  passedTests: 0,
  failedTests: 0,
  pluginStatus: {},
  performanceMetrics: {},
  securityChecks: {},
  recommendations: []
};

function logResult(plugin, test, status, message = '') {
  const symbol = status === 'PASS' ? '✅' : '❌';
  console.log(`${symbol} ${plugin}: ${test} - ${status} ${message}`);
  
  if (!testResults.pluginStatus[plugin]) {
    testResults.pluginStatus[plugin] = { tests: [], status: 'UNKNOWN' };
  }
  
  testResults.pluginStatus[plugin].tests.push({ test, status, message });
  
  if (status === 'PASS') {
    testResults.passedTests++;
  } else {
    testResults.failedTests++;
  }
}

async function validatePluginStructure(plugin) {
  const pluginPath = path.join(pluginsDir, plugin);
  
  // Check if plugin directory exists
  if (!fs.existsSync(pluginPath)) {
    logResult(plugin, 'Directory Structure', 'FAIL', 'Plugin directory not found');
    return false;
  }
  
  // Check required files
  const requiredFiles = ['index.tsx', 'manifest.json', 'index.module.css'];
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(pluginPath, file);
    if (!fs.existsSync(filePath)) {
      logResult(plugin, `File: ${file}`, 'FAIL', 'Required file missing');
      allFilesExist = false;
    } else {
      logResult(plugin, `File: ${file}`, 'PASS', 'File exists');
    }
  }
  
  return allFilesExist;
}

async function validateManifest(plugin) {
  const manifestPath = path.join(pluginsDir, plugin, 'manifest.json');
  
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    // Check required fields
    const requiredFields = ['name', 'version', 'description', 'permissions', 'entryPoint'];
    let allFieldsPresent = true;
    
    for (const field of requiredFields) {
      if (!manifest[field]) {
        logResult(plugin, `Manifest Field: ${field}`, 'FAIL', 'Required field missing');
        allFieldsPresent = false;
      } else {
        logResult(plugin, `Manifest Field: ${field}`, 'PASS', `Value: ${JSON.stringify(manifest[field])}`);
      }
    }
    
    // Validate name matches directory
    if (manifest.name === plugin) {
      logResult(plugin, 'Name Consistency', 'PASS', 'Name matches directory');
    } else {
      logResult(plugin, 'Name Consistency', 'FAIL', `Expected: ${plugin}, Got: ${manifest.name}`);
      allFieldsPresent = false;
    }
    
    return allFieldsPresent;
  } catch (error) {
    logResult(plugin, 'Manifest Parsing', 'FAIL', error.message);
    return false;
  }
}

async function validateTypeScriptSyntax(plugin) {
  const indexPath = path.join(pluginsDir, plugin, 'index.tsx');
  
  try {
    const content = fs.readFileSync(indexPath, 'utf8');
    
    // Basic syntax checks
    const checks = [
      { name: 'React Import', pattern: /import.*React.*from.*['"]react['"]/ },
      { name: 'Export Default', pattern: /export\s+default/ },
      { name: 'Mount Function', pattern: /mount\s*:.*async/ },
      { name: 'Unmount Function', pattern: /unmount\s*:.*async/ },
      { name: 'createRoot Usage', pattern: /createRoot\s*\(/ },
    ];
    
    let syntaxValid = true;
    
    for (const check of checks) {
      if (check.pattern.test(content)) {
        logResult(plugin, `Syntax: ${check.name}`, 'PASS', 'Pattern found');
      } else {
        logResult(plugin, `Syntax: ${check.name}`, 'FAIL', 'Required pattern missing');
        syntaxValid = false;
      }
    }
    
    return syntaxValid;
  } catch (error) {
    logResult(plugin, 'TypeScript File', 'FAIL', error.message);
    return false;
  }
}

async function validateSecurity(plugin) {
  const indexPath = path.join(pluginsDir, plugin, 'index.tsx');
  const manifestPath = path.join(pluginsDir, plugin, 'manifest.json');
  
  try {
    const content = fs.readFileSync(indexPath, 'utf8');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Security checks
    const securityIssues = [];
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, issue: 'eval() usage detected' },
      { pattern: /innerHTML\s*=/, issue: 'innerHTML assignment detected' },
      { pattern: /document\.write/, issue: 'document.write usage detected' },
      { pattern: /window\.location\s*=/, issue: 'Direct location manipulation detected' }
    ];
    
    for (const { pattern, issue } of dangerousPatterns) {
      if (pattern.test(content)) {
        securityIssues.push(issue);
      }
    }
    
    // Check permissions
    if (manifest.permissions && Array.isArray(manifest.permissions)) {
      const highRiskPermissions = ['admin', 'root', 'system', 'file:write'];
      const risks = manifest.permissions.filter(p => highRiskPermissions.some(hr => p.includes(hr)));
      
      if (risks.length > 0) {
        securityIssues.push(`High-risk permissions: ${risks.join(', ')}`);
      }
    }
    
    if (securityIssues.length === 0) {
      logResult(plugin, 'Security Scan', 'PASS', 'No security issues detected');
      testResults.securityChecks[plugin] = { status: 'SECURE', issues: [] };
      return true;
    } else {
      logResult(plugin, 'Security Scan', 'FAIL', `Issues: ${securityIssues.join('; ')}`);
      testResults.securityChecks[plugin] = { status: 'ISSUES', issues: securityIssues };
      return false;
    }
  } catch (error) {
    logResult(plugin, 'Security Scan', 'FAIL', error.message);
    return false;
  }
}

async function measurePluginSize(plugin) {
  const pluginPath = path.join(pluginsDir, plugin);
  
  try {
    let totalSize = 0;
    const files = fs.readdirSync(pluginPath);
    
    for (const file of files) {
      const filePath = path.join(pluginPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    }
    
    const sizeKB = (totalSize / 1024).toFixed(2);
    testResults.performanceMetrics[plugin] = { sizeKB: parseFloat(sizeKB) };
    
    if (totalSize < 50 * 1024) { // Under 50KB
      logResult(plugin, 'Plugin Size', 'PASS', `${sizeKB} KB (Optimal)`);
      return true;
    } else if (totalSize < 100 * 1024) { // Under 100KB
      logResult(plugin, 'Plugin Size', 'PASS', `${sizeKB} KB (Acceptable)`);
      return true;
    } else {
      logResult(plugin, 'Plugin Size', 'FAIL', `${sizeKB} KB (Too large)`);
      return false;
    }
  } catch (error) {
    logResult(plugin, 'Plugin Size', 'FAIL', error.message);
    return false;
  }
}

async function testPlugin(plugin) {
  console.log(`\n🔍 Testing Plugin: ${plugin}`);
  console.log('─'.repeat(40));
  
  let overallStatus = 'PASS';
  
  // Run all validation tests
  const tests = [
    validatePluginStructure,
    validateManifest,
    validateTypeScriptSyntax,
    validateSecurity,
    measurePluginSize
  ];
  
  for (const test of tests) {
    const result = await test(plugin);
    if (!result) {
      overallStatus = 'FAIL';
    }
  }
  
  testResults.pluginStatus[plugin].status = overallStatus;
  
  return overallStatus === 'PASS';
}

async function generateReport() {
  console.log('\n📊 PLUGIN VALIDATION REPORT');
  console.log('='.repeat(50));
  
  console.log(`\n📈 Summary:`);
  console.log(`  Total Plugins Tested: ${testResults.totalPlugins}`);
  console.log(`  Passed Tests: ${testResults.passedTests}`);
  console.log(`  Failed Tests: ${testResults.failedTests}`);
  console.log(`  Success Rate: ${((testResults.passedTests / (testResults.passedTests + testResults.failedTests)) * 100).toFixed(1)}%`);
  
  console.log(`\n🔧 Plugin Status:`);
  for (const [plugin, status] of Object.entries(testResults.pluginStatus)) {
    const statusSymbol = status.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${statusSymbol} ${plugin}: ${status.status}`);
  }
  
  console.log(`\n⚡ Performance Metrics:`);
  for (const [plugin, metrics] of Object.entries(testResults.performanceMetrics)) {
    console.log(`  📦 ${plugin}: ${metrics.sizeKB} KB`);
  }
  
  console.log(`\n🔒 Security Status:`);
  for (const [plugin, security] of Object.entries(testResults.securityChecks)) {
    const securitySymbol = security.status === 'SECURE' ? '🔒' : '⚠️';
    console.log(`  ${securitySymbol} ${plugin}: ${security.status}`);
    if (security.issues.length > 0) {
      security.issues.forEach(issue => console.log(`    - ${issue}`));
    }
  }
  
  // Generate recommendations
  console.log(`\n💡 Recommendations:`);
  
  const failedPlugins = Object.entries(testResults.pluginStatus)
    .filter(([, status]) => status.status === 'FAIL')
    .map(([plugin]) => plugin);
  
  if (failedPlugins.length > 0) {
    console.log(`  1. Fix issues in failed plugins: ${failedPlugins.join(', ')}`);
  }
  
  const largePlugins = Object.entries(testResults.performanceMetrics)
    .filter(([, metrics]) => metrics.sizeKB > 75)
    .map(([plugin]) => plugin);
  
  if (largePlugins.length > 0) {
    console.log(`  2. Optimize large plugins: ${largePlugins.join(', ')}`);
  }
  
  const securityIssues = Object.entries(testResults.securityChecks)
    .filter(([, security]) => security.status !== 'SECURE')
    .map(([plugin]) => plugin);
  
  if (securityIssues.length > 0) {
    console.log(`  3. Address security issues in: ${securityIssues.join(', ')}`);
  }
  
  if (failedPlugins.length === 0 && largePlugins.length === 0 && securityIssues.length === 0) {
    console.log(`  ✨ All plugins are production ready!`);
  }
  
  console.log(`\n🚀 Plugin System Status: ${failedPlugins.length === 0 ? 'READY FOR PRODUCTION' : 'NEEDS ATTENTION'}`);
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'plugin-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

async function main() {
  try {
    console.log(`\n🎯 Target Plugins: ${targetPlugins.join(', ')}`);
    console.log(`📁 Plugins Directory: ${pluginsDir}`);
    
    if (!fs.existsSync(pluginsDir)) {
      console.error(`❌ Plugins directory not found: ${pluginsDir}`);
      process.exit(1);
    }
    
    // Test each plugin
    for (const plugin of targetPlugins) {
      await testPlugin(plugin);
    }
    
    // Generate comprehensive report
    await generateReport();
    
  } catch (error) {
    console.error('❌ Plugin validation failed:', error.message);
    process.exit(1);
  }
}

// Run the validation
main();
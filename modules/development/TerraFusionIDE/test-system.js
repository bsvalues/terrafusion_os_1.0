#!/usr/bin/env node

console.log('🧪 Terrafusion Hybrid Agent System - System Test');
console.log('================================================');

// Test 1: Check if all required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/components/HybridAgentSystem.tsx',
  'src/orchestrator/HybridAgentOrchestrator.ts',
  'src/orchestrator/AdvancedToolIntegration.ts',
  'src/components/MLOptimizationDashboard.tsx',
  'src/components/GovernmentAgentsDashboard.tsx',
  'src/core/MLOptimizationEngine.ts',
  'src/core/GovernmentSpecializedAgents.ts'
];

console.log('\n📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Test 2: Check package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const requiredDeps = ['react', 'lucide-react'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep} - Available`);
    } else {
      console.log(`❌ ${dep} - Missing from dependencies`);
    }
  });
} catch (error) {
  console.log('❌ Could not read package.json');
}

// Test 3: Check TypeScript compilation
console.log('\n🔧 Checking TypeScript compilation...');
try {
  const { execSync } = require('child_process');
  execSync('npx tsc --noEmit', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  console.log('   This might be expected if dependencies are not installed yet');
}

// Test 4: Check if node_modules exists
console.log('\n📚 Checking node_modules...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules directory exists');
  
  // Check for key packages
  const keyPackages = ['react', 'lucide-react'];
  keyPackages.forEach(pkg => {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (fs.existsSync(pkgPath)) {
      console.log(`✅ ${pkg} package installed`);
    } else {
      console.log(`❌ ${pkg} package not found in node_modules`);
    }
  });
} else {
  console.log('❌ node_modules directory not found');
  console.log('   Run "npm install" to install dependencies');
}

// Test 5: Check for build artifacts
console.log('\n🏗️ Checking build artifacts...');
const buildFiles = [
  'dist',
  'build',
  '.next'
];

buildFiles.forEach(buildDir => {
  const buildPath = path.join(__dirname, buildDir);
  if (fs.existsSync(buildPath)) {
    console.log(`✅ ${buildDir} directory exists`);
  } else {
    console.log(`ℹ️ ${buildDir} directory not found (this is normal for fresh installs)`);
  }
});

// Summary
console.log('\n📊 Test Summary');
console.log('================');
console.log(`Required Files: ${allFilesExist ? '✅ All Present' : '❌ Some Missing'}`);
console.log(`Dependencies: ${fs.existsSync(nodeModulesPath) ? '✅ Installed' : '❌ Not Installed'}`);
console.log(`TypeScript: ${fs.existsSync(path.join(__dirname, 'tsconfig.json')) ? '✅ Configured' : '❌ Not Configured'}`);

if (allFilesExist && fs.existsSync(nodeModulesPath)) {
  console.log('\n🎉 System appears to be ready for testing!');
  console.log('   Run "npm run dev" to start the development server');
} else {
  console.log('\n⚠️ System needs setup before testing');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('   Run "npm install" to install dependencies');
  }
  if (!allFilesExist) {
    console.log('   Some required files are missing - check the file structure');
  }
}

console.log('\n🚀 Terrafusion Hybrid Agent System Test Complete!');

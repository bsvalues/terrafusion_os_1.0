const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const steps = [
  {
    name: 'Cleaning build directory',
    command: 'rimraf dist out .next',
    progress: 10
  },
  {
    name: 'Installing dependencies',
    command: 'npm install',
    progress: 20
  },
  {
    name: 'Building Next.js application',
    command: 'npm run build',
    progress: 40
  },
  {
    name: 'Building Electron application',
    command: 'npm run electron-build',
    progress: 80
  },
  {
    name: 'Creating installer',
    command: 'electron-builder',
    progress: 100
  }
];

console.log('🚀 Starting Terrafusion build process...\n');

let currentStep = 0;

function runStep() {
  if (currentStep >= steps.length) {
    console.log('\n✨ Build completed successfully!');
    console.log('📦 Installer can be found in the dist directory');
    return;
  }

  const step = steps[currentStep];
  console.log(`\n📝 Step ${currentStep + 1}/${steps.length}: ${step.name}`);
  
  try {
    execSync(step.command, { stdio: 'inherit' });
    console.log(`✅ ${step.name} completed (${step.progress}%)`);
    currentStep++;
    runStep();
  } catch (error) {
    console.error(`\n❌ Error in step: ${step.name}`);
    console.error(error.message);
    process.exit(1);
  }
}

runStep(); 
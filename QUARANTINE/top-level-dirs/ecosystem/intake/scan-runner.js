#!/usr/bin/env node

/**
 * TerraFusion Elite Government OS - Legacy Application Intake Runner
 * Zero-Touch Integration Pipeline - Command Runner
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

async function runLegacyScanner(appPath, outputFormat = 'report') {
  console.log(`🔍 TerraFusion Scanner: Analyzing ${appPath}`);

  try {
    // Import the scanner (using dynamic import for ES modules)
    const { legacyScanner } = await import('./legacy-app-scanner.js');

    // Scan the application
    const profile = await legacyScanner.scanApplicationDirectory(appPath);

    // Generate output based on format
    let output;
    switch (outputFormat) {
      case 'json':
        output = JSON.stringify(profile, null, 2);
        break;
      case 'yaml':
        const yaml = await import('yaml');
        output = yaml.stringify(profile);
        break;
      case 'report':
      default:
        output = await legacyScanner.generateIntakeReport(profile);
        break;
    }

    console.log(output);
    return output;
  } catch (error) {
    console.error('❌ Scanner failed:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const appPath = args[0];
const outputFormat = args[1] || 'report';

if (!appPath) {
  console.error('Usage: node scan-runner.js <app-path> [output-format]');
  process.exit(1);
}

// Run the scanner
runLegacyScanner(appPath, outputFormat);

#!/usr/bin/env node

/**
 * Helper script to run JavaScript scripts with TypeScript support
 * 
 * Usage:
 *   node scripts/run-with-ts.cjs scripts/generate-sample-data.js
 */

// Converts TypeScript imports to be usable in CommonJS scripts
require('esbuild-register');

// Get the script path from command line arguments
const scriptPath = process.argv[2];

if (!scriptPath) {
  console.error('Please provide a script path to run');
  process.exit(1);
}

// Run the script
try {
  require(`../${scriptPath}`);
} catch (error) {
  console.error(`Error running script ${scriptPath}:`, error);
  process.exit(1);
}
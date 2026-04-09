#!/usr/bin/env node

// This script is used to run TypeScript files directly using esbuild-register
require('esbuild-register');

// Get the script to run from command line arguments
const scriptPath = process.argv[2];

if (!scriptPath) {
  console.error('Error: Script path is required');
  console.log('Usage: node run-with-ts.js <script-path>');
  process.exit(1);
}

// Run the script
try {
  require(scriptPath);
} catch (error) {
  console.error('Error running script:', error);
  process.exit(1);
}
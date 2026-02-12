#!/usr/bin/env node

/**
 * YAML Include Tool
 *
 * This script reads a YAML file and outputs its content,
 * making it easy to include YAML snippets in other files.
 *
 * Usage: node yaml-inc.js <yaml-file>
 */

const fs = require('fs');
const path = require('path');

// Check if filename is provided
if (process.argv.length < 3) {
  console.error('Usage: node yaml-inc.js <yaml-file>');
  process.exit(1);
}

const filename = process.argv[2];

try {
  // Check if file exists
  if (!fs.existsSync(filename)) {
    console.error(`Error: File ${filename} not found`);
    process.exit(1);
  }

  // Read the file
  const content = fs.readFileSync(filename, 'utf8');

  // Output the content
  process.stdout.write(content);
} catch (error) {
  console.error(`Error reading file: ${error.message}`);
  process.exit(1);
}

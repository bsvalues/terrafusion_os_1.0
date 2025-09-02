#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🎨 Running TerraFusion OS formatting...');

async function formatCode() {
  try {
    // Format TypeScript/JavaScript
    console.log('📝 Formatting TypeScript/JavaScript files...');
    await execAsync('npx prettier --write "**/*.{ts,tsx,js,jsx,json,md,yml,yaml}"');
    
    // Format C# files
    console.log('📝 Formatting C# files...');
    await execAsync('dotnet format backend/ --verbosity minimal');
    
    // Lint TypeScript files
    console.log('🔍 Linting TypeScript files...');
    await execAsync('npx eslint "**/*.{ts,tsx}" --fix');
    
    console.log('✅ Code formatting completed successfully');
  } catch (error) {
    console.error('❌ Formatting failed:', error.message);
    process.exit(1);
  }
}

formatCode();

#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 TerraFusion Plugin Manifest Validator v1.0.0');

async function validateManifest(manifestPath) {
  try {
    // Read manifest file
    const fullPath = path.resolve(manifestPath);
    console.log(`📋 Validating: ${fullPath}`);
    
    const manifestContent = await fs.readFile(fullPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    const errors = [];
    const warnings = [];
    
    // Required fields validation
    const requiredFields = [
      'id', 'name', 'version', 'type', 'category',
      'description', 'author', 'entry', 'permissions'
    ];
    
    for (const field of requiredFields) {
      if (!manifest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Version format validation
    if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      errors.push('Version must follow semver format (x.y.z)');
    }
    
    // PWA specific validations
    if (manifest.pwa) {
      if (!manifest.pwa.manifest) {
        warnings.push('PWA enabled but missing manifest path');
      }
      if (!manifest.pwa.serviceWorker) {
        warnings.push('PWA enabled but missing service worker');
      }
    }
    
    // Consciousness level validation
    if (manifest.consciousness) {
      if (typeof manifest.consciousness.minLevel !== 'number' ||
          manifest.consciousness.minLevel < 1 ||
          manifest.consciousness.minLevel > 5) {
        errors.push('Consciousness level must be between 1 and 5');
      }
    }
    
    // Output results
    if (errors.length === 0) {
      console.log('✅ Manifest validation PASSED');
      
      if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(w => console.log(`   - ${w}`));
      }
      
      console.log('\n📊 Manifest Summary:');
      console.log(`   Name: ${manifest.name}`);
      console.log(`   Version: ${manifest.version}`);
      console.log(`   Type: ${manifest.type}`);
      console.log(`   Category: ${manifest.category}`);
      console.log(`   PWA: ${manifest.pwa?.enabled ? 'Yes' : 'No'}`);
      console.log(`   Quantum: ${manifest.quantum?.enabled ? 'Yes' : 'No'}`);
      
      process.exit(0);
    } else {
      console.log('❌ Manifest validation FAILED\n');
      console.log('Errors:');
      errors.forEach(e => console.log(`   - ${e}`));
      
      if (warnings.length > 0) {
        console.log('\nWarnings:');
        warnings.forEach(w => console.log(`   - ${w}`));
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node validate-manifest.mjs <path-to-manifest>');
  process.exit(1);
}

validateManifest(args[0]);

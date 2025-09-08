#!/usr/bin/env node

/**
 * DUPLICATE ANALYSIS - Terra Migration Audit
 * Check for duplicates and missing systems
 */

import fs from 'fs';
import path from 'path';

// What we claimed to migrate in our summary
const CLAIMED_MIGRATIONS = [
  'terrafusion-dashboard',
  'terrafusion-gis', 
  'mcp-servers-production',
  'terrafusion-sync-backup',
  'terrafusion-playground-main', 
  'terrafusion-gama',
  'terrafusion-pro-plus',
  'terrafusion-prime-view',
  'system-prompts-ai-tools', 
  'terrafusion-v0-demo',
  'terrafusion-nextgen-elite',
  'terrafusion-enterprise-v2',
  'terrafusion-ecosystem',
  'security-production',
  'monitoring-production'
];

// What actually exists in src-enhanced
const ACTUAL_DIRECTORIES = [
  'ai-army',
  'bcbs-gis-production',
  'bcbslevy-production', 
  'bcbswebhub-production',
  'core',
  'mcp-servers',
  'mcp-servers-production',
  'modules',
  'monitoring-production',
  'security-production',
  'system-prompts-ai-tools',
  'terraagent-production',
  'terraflow-production',
  'terrafusion-assessor-production',
  'terrafusion-assistant-production',
  'terrafusion-build-actual',
  'terrafusion-dashboard',
  'terrafusion-development',
  'terrafusion-ecosystem',
  'terrafusion-enterprise-v2',
  'terrafusion-gama',
  'terrafusion-gis',
  'terrafusion-income',
  'terrafusion-nextgen-elite',
  'terrafusion-notebook-production',
  'terrafusion-permit-production',
  'terrafusion-pilt-production',
  'terrafusion-playground-main',
  'terrafusion-playground-production',
  'terrafusion-prime-view',
  'terrafusion-pro-plus',
  'terrafusion-pro-production',
  'terrafusion-prof-production',
  'terrafusion-sync-backup',
  'terrafusion-sync-production',
  'terrafusion-v0-demo',
  'terraminer-production'
];

console.log('🔍 TERRA MIGRATION DUPLICATE ANALYSIS');
console.log('====================================');
console.log('');

// Check for duplicates/similar systems
console.log('⚠️  POTENTIAL DUPLICATES DETECTED:');
console.log('');

const duplicates = [
  {
    systems: ['mcp-servers', 'mcp-servers-production'],
    issue: 'Two MCP server directories - likely duplicated'
  },
  {
    systems: ['terrafusion-playground-main', 'terrafusion-playground-production'], 
    issue: 'Two playground directories - main vs production'
  },
  {
    systems: ['terrafusion-sync-backup', 'terrafusion-sync-production'],
    issue: 'Two sync directories - backup vs production'
  },
  {
    systems: ['terrafusion-pro-plus', 'terrafusion-pro-production', 'terrafusion-prof-production'],
    issue: 'Three similar pro directories - likely overlapping'
  },
  {
    systems: ['bcbs-gis-production', 'terrafusion-gis'],
    issue: 'BCBS GIS appears twice - original and renamed version'
  }
];

duplicates.forEach((dup, index) => {
  console.log(`${index + 1}. ${dup.issue}`);
  dup.systems.forEach(sys => {
    if (ACTUAL_DIRECTORIES.includes(sys)) {
      console.log(`   ✅ EXISTS: src-enhanced/${sys}/`);
    } else {
      console.log(`   ❌ MISSING: src-enhanced/${sys}/`);
    }
  });
  console.log('');
});

// Check what we claimed vs what exists
console.log('📊 CLAIMED vs ACTUAL COMPARISON:');
console.log('');

console.log('✅ CLAIMED SYSTEMS THAT EXIST:');
const existingClaimed = CLAIMED_MIGRATIONS.filter(claimed => 
  ACTUAL_DIRECTORIES.includes(claimed)
);
existingClaimed.forEach(sys => console.log(`   - ${sys}`));

console.log('');
console.log('❌ CLAIMED SYSTEMS MISSING:');
const missingClaimed = CLAIMED_MIGRATIONS.filter(claimed => 
  !ACTUAL_DIRECTORIES.includes(claimed)
);
missingClaimed.forEach(sys => console.log(`   - ${sys}`));

console.log('');
console.log('🆕 EXTRA SYSTEMS NOT IN CLAIMED LIST:');
const extraSystems = ACTUAL_DIRECTORIES.filter(actual => 
  !CLAIMED_MIGRATIONS.includes(actual) && 
  !['claude.md', 'index.md', 'README.md'].includes(actual)
);
extraSystems.forEach(sys => console.log(`   - ${sys}`));

console.log('');
console.log('📈 SUMMARY STATISTICS:');
console.log(`Claimed migrations: ${CLAIMED_MIGRATIONS.length}`);
console.log(`Actual directories: ${ACTUAL_DIRECTORIES.length}`);
console.log(`Existing claimed: ${existingClaimed.length}`);
console.log(`Missing claimed: ${missingClaimed.length}`);
console.log(`Extra systems: ${extraSystems.length}`);
console.log(`Potential duplicates: ${duplicates.length} groups`);

console.log('');
console.log('🎯 RECOMMENDATION:');
console.log('We need to consolidate duplicates and get accurate counts');
console.log('Some systems were migrated multiple times or in different phases');

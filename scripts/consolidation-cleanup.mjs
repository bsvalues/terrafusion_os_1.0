#!/usr/bin/env node

/**
 * CONSOLIDATION CLEANUP - Remove empty stubs and duplicates
 * Based on the analysis showing 22 empty directories with only migration-report.json
 */

import fs from 'fs';
import path from 'path';

const SRC_ENHANCED = path.join(process.cwd(), 'src-enhanced');

// Directories to remove (empty stubs with 0.00MB and 1 file)
const EMPTY_STUBS_TO_REMOVE = [
  'terrafusion-pilt-production',
  'terrafusion-pro-production',
  'terrafusion-prof-production', 
  'terrafusion-sync-production',
  'terrafusion-playground-production',
  'terrafusion-permit-production',
  'ai-army',
  'terrafusion-income',
  'terrafusion-development',
  'terrafusion-build-actual',
  'terrafusion-assistant-production',
  'terrafusion-assessor-production',
  'terraflow-production',
  'terraagent-production',
  'bcbswebhub-production',
  'bcbslevy-production',
  'terrafusion-notebook-production',
  'terraminer-production'
];

// Smaller duplicates to remove (keep the larger version)
const DUPLICATES_TO_REMOVE = [
  'bcbs-gis-production', // Remove 0.20MB, keep terrafusion-gis 306.62MB
  'mcp-servers'          // Remove 0.12MB, keep mcp-servers-production 64.63MB
];

const ALL_TO_REMOVE = [...EMPTY_STUBS_TO_REMOVE, ...DUPLICATES_TO_REMOVE];

console.log('🧹 TERRAFUSION CONSOLIDATION CLEANUP');
console.log('===================================');
console.log('');

function removeDirectory(dirName) {
  const fullPath = path.join(SRC_ENHANCED, dirName);
  
  if (fs.existsSync(fullPath)) {
    try {
      // Get stats before removal
      const stats = fs.statSync(fullPath);
      const files = fs.readdirSync(fullPath, { recursive: true }).length;
      
      console.log(`🗑️  Removing: ${dirName}`);
      console.log(`    Path: ${fullPath}`);
      console.log(`    Files: ${files}`);
      
      // Remove directory recursively
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`    ✅ Removed successfully`);
      
      return { success: true, dirName, files };
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      return { success: false, dirName, error: error.message };
    }
  } else {
    console.log(`    ⚠️  Not found: ${dirName}`);
    return { success: false, dirName, error: 'Directory not found' };
  }
  console.log('');
}

async function main() {
  console.log('🎯 CLEANUP TARGETS:');
  console.log('');
  
  console.log('📋 Empty Stubs to Remove (0.00MB, 1 file each):');
  EMPTY_STUBS_TO_REMOVE.forEach((dir, i) => {
    console.log(`${(i+1).toString().padStart(2, '0')}. ${dir}`);
  });
  
  console.log('');
  console.log('🔄 Duplicates to Remove (keeping larger versions):');
  DUPLICATES_TO_REMOVE.forEach((dir, i) => {
    console.log(`${(i+1).toString().padStart(2, '0')}. ${dir}`);
  });
  
  console.log('');
  console.log(`Total directories to remove: ${ALL_TO_REMOVE.length}`);
  console.log('');
  
  console.log('🚀 STARTING CLEANUP...');
  console.log('');
  
  const results = [];
  
  for (const dirName of ALL_TO_REMOVE) {
    const result = removeDirectory(dirName);
    results.push(result);
  }
  
  console.log('');
  console.log('📊 CLEANUP SUMMARY:');
  console.log('==================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully removed: ${successful.length}`);
  console.log(`❌ Failed to remove: ${failed.length}`);
  console.log(`📁 Total files removed: ${successful.reduce((sum, r) => sum + (r.files || 0), 0)}`);
  
  if (failed.length > 0) {
    console.log('');
    console.log('❌ FAILED REMOVALS:');
    failed.forEach(f => {
      console.log(`   - ${f.dirName}: ${f.error}`);
    });
  }
  
  console.log('');
  console.log('🎯 REMAINING CLEAN DIRECTORIES:');
  
  // List what should remain
  const remaining = fs.readdirSync(SRC_ENHANCED, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => !ALL_TO_REMOVE.includes(name))
    .sort();
    
  remaining.forEach((dir, i) => {
    console.log(`${(i+1).toString().padStart(2, '0')}. ${dir}`);
  });
  
  console.log('');
  console.log(`✅ Clean directories remaining: ${remaining.length}`);
  console.log('🏆 CONSOLIDATION CLEANUP COMPLETE!');
  
  // Save cleanup report
  const report = {
    cleanup_date: new Date().toISOString(),
    directories_removed: successful.length,
    directories_failed: failed.length,
    total_files_removed: successful.reduce((sum, r) => sum + (r.files || 0), 0),
    removed_directories: successful.map(r => r.dirName),
    failed_directories: failed,
    remaining_directories: remaining,
    status: failed.length === 0 ? 'COMPLETED' : 'PARTIAL'
  };
  
  fs.writeFileSync(
    'CONSOLIDATION_CLEANUP_REPORT.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('📄 Cleanup report saved: CONSOLIDATION_CLEANUP_REPORT.json');
}

main().catch(console.error);

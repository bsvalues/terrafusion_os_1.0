#!/usr/bin/env node

/**
 * REAL Migration: TerraFusionPrimeView_PRODUCTION
 * Size: 1.7MB with 191 files
 * Purpose: Actually copy TerraFusionPrimeView files
 */

import fs from 'fs';
import path from 'path';

const CONFIG = {
  system: 'TerraFusionPrimeView_PRODUCTION',
  sourcePath: 'C:\\Users\\bsval\\OneDrive\\Desktop\\from D\\TerraFusionPrimeView_PRODUCTION',
  targetPath: path.join(process.cwd(), 'src-enhanced', 'terrafusion-prime-view'),
  expectedFiles: 191,
  expectedSizeMB: 1.7
};

console.log('🎯 REAL Migration: TerraFusionPrimeView_PRODUCTION');
console.log('=================================================');

async function copyDirectory(src, dest) {
  let copiedFiles = 0;
  let copiedBytes = 0;
  
  function copyRecursive(srcDir, destDir) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const items = fs.readdirSync(srcDir);
    
    for (const item of items) {
      const srcPath = path.join(srcDir, item);
      const destPath = path.join(destDir, item);
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        copiedFiles++;
        copiedBytes += stat.size;
      }
    }
  }
  
  if (fs.existsSync(src)) {
    console.log(`Copying from: ${src}`);
    console.log(`Copying to: ${dest}`);
    copyRecursive(src, dest);
  } else {
    console.log(`❌ Source directory not found: ${src}`);
    return { copiedFiles: 0, copiedBytes: 0 };
  }
  
  return { copiedFiles, copiedBytes };
}

async function main() {
  try {
    console.log(`Source: ${CONFIG.sourcePath}`);
    console.log(`Target: ${CONFIG.targetPath}`);
    console.log(`Expected: ${CONFIG.expectedFiles} files, ${CONFIG.expectedSizeMB}MB`);
    console.log('');
    
    const startTime = Date.now();
    const result = await copyDirectory(CONFIG.sourcePath, CONFIG.targetPath);
    const endTime = Date.now();
    
    const actualSizeMB = (result.copiedBytes / 1024 / 1024).toFixed(2);
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    console.log('');
    console.log('=== MIGRATION RESULTS ===');
    console.log(`Files copied: ${result.copiedFiles}`);
    console.log(`Expected files: ${CONFIG.expectedFiles}`);
    console.log(`Match: ${result.copiedFiles === CONFIG.expectedFiles ? '✅ YES' : '❌ NO'}`);
    console.log(`Size copied: ${actualSizeMB}MB`);
    console.log(`Expected size: ${CONFIG.expectedSizeMB}MB`);
    console.log(`Duration: ${duration} seconds`);
    
    if (result.copiedFiles > 0) {
      const report = {
        system: CONFIG.system,
        migration_date: new Date().toISOString(),
        source_path: CONFIG.sourcePath,
        target_path: CONFIG.targetPath,
        files_copied: result.copiedFiles,
        bytes_copied: result.copiedBytes,
        size_mb: parseFloat(actualSizeMB),
        expected_files: CONFIG.expectedFiles,
        expected_size_mb: CONFIG.expectedSizeMB,
        files_match: result.copiedFiles === CONFIG.expectedFiles,
        duration_seconds: parseFloat(duration),
        status: 'completed'
      };
      
      fs.writeFileSync(
        path.join(CONFIG.targetPath, 'migration-report.json'),
        JSON.stringify(report, null, 2)
      );
      
      console.log('✅ Migration completed successfully');
      console.log('📄 Migration report saved');
    } else {
      console.log('❌ Migration failed - no files copied');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

main();

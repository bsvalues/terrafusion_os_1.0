#!/usr/bin/env node

/**
 * TerraFusion OS - Module Cleanup Script
 * Separates actual modules from deployment packages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGES_TO_MOVE = [
  'government-edition',
  'government-edition-enhanced-MARKED-FOR-REVIEW', 
  'shock-and-awe'
];

const BACKUP_FOLDERS = [
  'terra-agent-backup-20250906-234105',
  'terra-levy-backup-20250906-233232'
];

const ENHANCED_MARKED_FOR_REVIEW = [
  'terra-agent-champion-MARKED-FOR-REVIEW',
  'terra-agent-enhanced-MARKED-FOR-REVIEW',
  'terra-levy-enhanced-MARKED-FOR-REVIEW'
];

console.log('🧹 TerraFusion OS - Module Directory Cleanup');
console.log('============================================\n');

// Create packages directory
const packagesDir = path.join(__dirname, '..', 'packages');
if (!fs.existsSync(packagesDir)) {
  fs.mkdirSync(packagesDir, { recursive: true });
  console.log('✅ Created packages/ directory');
}

// Create archived-modules directory
const archivedDir = path.join(__dirname, '..', 'archived-modules');
if (!fs.existsSync(archivedDir)) {
  fs.mkdirSync(archivedDir, { recursive: true });
  console.log('✅ Created archived-modules/ directory');
}

// Move deployment packages
console.log('\n📦 Moving deployment packages to packages/');
PACKAGES_TO_MOVE.forEach(packageName => {
  const sourcePath = path.join(__dirname, '..', 'modules', packageName);
  const targetPath = path.join(packagesDir, packageName);
  
  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, targetPath);
    console.log(`✅ Moved ${packageName} to packages/`);
  } else {
    console.log(`⚠️  ${packageName} not found in modules/`);
  }
});

// Move backup folders
console.log('\n🗄️  Moving backup folders to archived-modules/');
BACKUP_FOLDERS.forEach(backupName => {
  const sourcePath = path.join(__dirname, '..', 'modules', backupName);
  const targetPath = path.join(archivedDir, backupName);
  
  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, targetPath);
    console.log(`✅ Moved ${backupName} to archived-modules/`);
  } else {
    console.log(`⚠️  ${backupName} not found in modules/`);
  }
});

// Move enhanced marked for review
console.log('\n📋 Moving enhanced marked-for-review to archived-modules/');
ENHANCED_MARKED_FOR_REVIEW.forEach(enhancedName => {
  const sourcePath = path.join(__dirname, '..', 'modules', enhancedName);
  const targetPath = path.join(archivedDir, enhancedName);
  
  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, targetPath);
    console.log(`✅ Moved ${enhancedName} to archived-modules/`);
  } else {
    console.log(`⚠️  ${enhancedName} not found in modules/`);
  }
});

// Generate cleanup report
console.log('\n📊 Generating cleanup report...');

const modulesDir = path.join(__dirname, '..', 'modules');
const remainingModules = fs.readdirSync(modulesDir)
  .filter(item => {
    const itemPath = path.join(modulesDir, item);
    return fs.statSync(itemPath).isDirectory();
  })
  .filter(item => !item.startsWith('.'));

const reportContent = `# TerraFusion OS - Module Cleanup Report

## Actions Taken

### ✅ Deployment Packages Moved to packages/
${PACKAGES_TO_MOVE.map(pkg => `- ${pkg}`).join('\n')}

### ✅ Backup Folders Moved to archived-modules/
${BACKUP_FOLDERS.map(backup => `- ${backup}`).join('\n')}

### ✅ Enhanced Marked-for-Review Moved to archived-modules/
${ENHANCED_MARKED_FOR_REVIEW.map(enhanced => `- ${enhanced}`).join('\n')}

## Current Module Directory Structure

### Remaining Modules (${remainingModules.length})
${remainingModules.map(module => `- ${module}`).join('\n')}

## Directory Structure
\`\`\`
terrafusion_os_1.0/
├── modules/           # Actual TerraFusion OS modules only
├── packages/          # Deployment packages & distributions
└── archived-modules/  # Outdated versions & backups
\`\`\`

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(__dirname, '..', 'MODULE_CLEANUP_REPORT.md'), reportContent);
console.log('✅ Generated MODULE_CLEANUP_REPORT.md');

console.log('\n🎯 CLEANUP COMPLETE');
console.log(`📁 Remaining modules: ${remainingModules.length}`);
console.log(`📦 Packages moved: ${PACKAGES_TO_MOVE.length}`);
console.log(`🗄️  Archived items: ${BACKUP_FOLDERS.length + ENHANCED_MARKED_FOR_REVIEW.length}`);
console.log('\n✨ Module directory is now clean and organized!');

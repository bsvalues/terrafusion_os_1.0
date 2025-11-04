#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 TerraFusion ESLint Auto-Fix Tool');
console.log('=====================================');

const fixes = [
  {
    name: 'Apply ESLint auto-fixes',
    fix: () => {
      console.log('Running ESLint auto-fix...');
      try {
        execSync('npx eslint . --fix --quiet', {
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } catch (e) {
        console.log('Some issues could not be auto-fixed');
      }
    }
  },
  {
    name: 'Comment out console statements in test files',
    fix: () => {
      console.log('Commenting out console statements in test files...');
      const testFiles = [
        'tests/data/test-data-lineage-advanced.mjs',
        'tests/data/test-data-lineage.mjs',
        'tests/future/test-future-value.mjs',
        'tests/websocket/test-team-collaboration-websocket.mjs',
        'tests/websocket/test-websocket-esm.mjs',
        'tests/websocket/test-websocket.mjs',
        'tests/team/test-connection-manager.cjs'
      ];
      
      testFiles.forEach(file => {
        if (fs.existsSync(file)) {
          console.log(`Processing ${file}...`);
          try {
            let content = fs.readFileSync(file, 'utf8');
            content = content.replace(/(\s+)console\.(log|warn|error|info)/g, '$1// console.$2');
            fs.writeFileSync(file, content);
          } catch (e) {
            console.log(`Could not process ${file}: ${e.message}`);
          }
        }
      });
    }
  }
];

async function main() {
  console.log(`Found ${fixes.length} automated fixes to apply...\n`);
  
  for (const fix of fixes) {
    console.log(`🔧 ${fix.name}`);
    try {
      fix.fix();
      console.log('✅ Complete\n');
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
    }
  }
  
  console.log('🎉 ESLint auto-fix completed!');
  console.log('\nRunning final lint check to count remaining issues...');
  
  try {
    execSync('npm run lint 2>&1 | tail -5', { stdio: 'inherit' });
  } catch (e) {
    console.log('\n⚠️  Some issues remain that need manual fixing.');
  }
}

if (require.main === module) {
  main().catch(console.error);
} 
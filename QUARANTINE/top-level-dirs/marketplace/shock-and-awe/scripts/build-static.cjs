#!/usr/bin/env node
/*
  TerraFusion Market - Static Build for Hostinger
  Creates a dist/ folder with all required web assets for terrafusionmarket.io
*/

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

/**
 * Recursively copy a directory
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

/**
 * Copy a single file if it exists
 */
function copyFileIfExists(srcRel, destRel = srcRel) {
  const src = path.join(root, srcRel);
  const dest = path.join(dist, destRel);
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

function main() {
  // Clean dist
  if (fs.existsSync(dist)) {
    fs.rmSync(dist, { recursive: true, force: true });
  }
  fs.mkdirSync(dist, { recursive: true });

  // Required root files for Hostinger deployment
  const rootFiles = [
    'index.html',
    '404.html',
    '500.html',
    'robots.txt',
    'sitemap.xml',
    'manifest.json',
    'sw.js',
    '.htaccess',
    'clean-modules.js',
  ];

  let copied = [];
  for (const file of rootFiles) {
    if (copyFileIfExists(file)) copied.push(file);
  }

  // Required directories
  const dirs = ['assets', 'js', 'styles'];
  for (const dir of dirs) {
    const srcDir = path.join(root, dir);
    const destDir = path.join(dist, dir);
    if (fs.existsSync(srcDir)) {
      copyDir(srcDir, destDir);
      copied.push(dir + '/');
    }
  }

  // Optional: Copy favicon and static icon assets if present
  const faviconCandidates = [
    'favicon.ico',
    'favicon.png',
    'apple-touch-icon.png',
    'site.webmanifest',
  ];
  for (const fav of faviconCandidates) {
    copyFileIfExists(fav);
  }

  // Report
  console.log('TerraFusion Market - Static Build Complete');
  console.log('dist/ created with:');
  for (const item of copied) console.log(' -', item);
}

main();

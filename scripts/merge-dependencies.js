#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Read package.json files
const costforgePkg = JSON.parse(fs.readFileSync('modules/costforge-ai/package.json', 'utf8'));
const terrabuildPkg = JSON.parse(fs.readFileSync('modules/_import/TerraBuild/package.json', 'utf8'));

// Merge dependencies
const mergedDeps = { ...costforgePkg.dependencies, ...terrabuildPkg.dependencies };
const mergedDevDeps = { ...costforgePkg.devDependencies, ...terrabuildPkg.devDependencies };

// Create new package.json
const newPackage = {
  ...costforgePkg,
  dependencies: mergedDeps,
  devDependencies: mergedDevDeps,
  scripts: {
    ...costforgePkg.scripts,
    // Add TerraBuild server scripts
    "server": "tsx server/index.ts",
    "server:dev": "tsx server/index.ts",
    "db:push": "drizzle-kit push"
  }
};

// Write merged package.json
fs.writeFileSync('modules/costforge-ai/package.json', JSON.stringify(newPackage, null, 2));

console.log('✅ Dependencies merged successfully!');
console.log(`📦 Total dependencies: ${Object.keys(mergedDeps).length}`);
console.log(`🔧 Total devDependencies: ${Object.keys(mergedDevDeps).length}`);
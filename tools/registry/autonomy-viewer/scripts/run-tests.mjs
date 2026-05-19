#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const testDir = path.join(packageRoot, 'test');

const passthroughArgs = process.argv.slice(2);
const requestedTestFiles = passthroughArgs.filter((arg) => arg.endsWith('.test.ts'));
const testArgs = passthroughArgs.filter((arg) => !arg.endsWith('.test.ts'));

const discoveredTestFiles = readdirSync(testDir)
  .filter((file) => file.endsWith('.test.ts'))
  .sort()
  .map((file) => path.join('test', file));

const testFiles = requestedTestFiles.length > 0 ? requestedTestFiles : discoveredTestFiles;

if (testFiles.length === 0) {
  console.error('No autonomy-viewer test files found.');
  process.exit(1);
}

function findTsxCli(startDir) {
  let currentDir = startDir;

  while (true) {
    const candidate = path.join(currentDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    if (existsSync(candidate)) {
      return candidate;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  throw new Error('Unable to find tsx CLI from autonomy-viewer package root.');
}

const tsxCli = findTsxCli(packageRoot);
const commandPrefix = [tsxCli, '--test', ...testArgs];
const batches = [];
let currentBatch = [];
let currentLength = commandPrefix.join(' ').length;

for (const testFile of testFiles) {
  const nextLength = currentLength + testFile.length + 1;
  if (currentBatch.length > 0 && nextLength > 4000) {
    batches.push(currentBatch);
    currentBatch = [];
    currentLength = commandPrefix.join(' ').length;
  }

  currentBatch.push(testFile);
  currentLength += testFile.length + 1;
}

if (currentBatch.length > 0) {
  batches.push(currentBatch);
}

for (const batch of batches) {
  const args = [...commandPrefix, ...batch];
  const result = spawnSync(process.execPath, args, {
    cwd: packageRoot,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.exit(0);

#!/usr/bin/env node

import { readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const workspaceRoot = path.resolve(import.meta.dirname, '../../..');
const testsDir = path.resolve(workspaceRoot, 'os-platform/core/tests');

const localAgentTests = readdirSync(testsDir, { withFileTypes: true })
  .filter(entry => entry.isFile() && /^local-agent-.*\.test\.mjs$/i.test(entry.name))
  .map(entry => path.posix.join('os-platform/core/tests', entry.name))
  .sort((left, right) => left.localeCompare(right));

if (localAgentTests.length === 0) {
  console.error('No local-agent test files were found under os-platform/core/tests.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...localAgentTests], {
  cwd: workspaceRoot,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
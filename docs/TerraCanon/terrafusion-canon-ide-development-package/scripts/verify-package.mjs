import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const required = [
  'README.md',
  'docs/01_MASTER_DEVELOPMENT_PACKAGE.md',
  'config/canon-index.json',
  'config/engineering-write-lanes.json',
  'config/launch-surface-contract.json',
  'src/os-platform/canon/canon-query.ts',
  'src/os-platform/agents/task-state-machine.ts',
  'src/os-platform/gates/gate-runner.ts',
  'src/os-platform/trace/evidence-writer.ts',
  'runbooks/FIRST_VERTICAL_SLICE.md'
];

for (const file of required) {
  assert.ok(existsSync(file), `Missing required package file: ${file}`);
}

console.log('TerraFusion Canon/IDE development package structure verified.');

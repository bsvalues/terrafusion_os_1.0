// Slice U — Cockpit drift guard workflow structural test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const workflow = path.join(repoRoot, '.github', 'workflows', 'cockpit-drift-guard.yml');

function read() {
  return readFileSync(workflow, 'utf8');
}

test('cockpit drift-guard workflow file exists', () => {
  assert.ok(existsSync(workflow), 'cockpit-drift-guard.yml must exist');
});

test('workflow triggers on PRs against cockpit + local-agent paths', () => {
  const yml = read();
  assert.match(yml, /^on:/m);
  assert.match(yml, /pull_request:/);
  for (const trigger of [
    'apps/agent-cockpit/**',
    'os-platform/core/pilot/local-agent/**',
    'os-platform/core/tests/local-agent-cockpit-*',
    '.github/workflows/cockpit-drift-guard.yml',
  ]) {
    assert.ok(yml.includes(trigger), `workflow must include path trigger: ${trigger}`);
  }
});

test('workflow runs on ubuntu-latest with pnpm + Node 20', () => {
  const yml = read();
  assert.match(yml, /runs-on:\s*ubuntu-latest/);
  assert.match(yml, /pnpm\/action-setup/);
  assert.match(yml, /actions\/setup-node/);
  assert.match(yml, /node-version:\s*20/);
});

test('workflow uses frozen-lockfile install', () => {
  const yml = read();
  assert.ok(
    yml.includes('pnpm install --frozen-lockfile'),
    'frozen-lockfile install required',
  );
});

test('workflow runs the three required gates', () => {
  const yml = read();
  for (const cmd of [
    'pnpm --filter @terrafusion/agent-cockpit run preflight',
    'pnpm run test:local-agent',
    'pnpm run proof:local-agent:doc-truth',
  ]) {
    assert.ok(yml.includes(cmd), `workflow must run: ${cmd}`);
  }
});

test('workflow does NOT run electron-builder or publish', () => {
  const yml = read();
  for (const banned of ['electron-builder', ' pack', ' dist', 'publish:', 'release:', 'GH_TOKEN', 'NPM_TOKEN']) {
    assert.equal(
      yml.includes(banned),
      false,
      `workflow must not contain: ${banned.trim()}`,
    );
  }
});

test('workflow declares minimal permissions (read-only contents)', () => {
  const yml = read();
  assert.match(yml, /permissions:\s*\n\s*contents:\s*read/);
});

test('workflow sets a timeout', () => {
  const yml = read();
  assert.match(yml, /timeout-minutes:\s*\d+/);
});

test('workflow does not use any secrets', () => {
  const yml = read();
  assert.equal(
    /\$\{\{\s*secrets\./.test(yml),
    false,
    'workflow must not reference any secrets',
  );
});

// Slice N — Electron install smoke test
//
// Verifies that the Electron devDependency is installed and wired into the
// cockpit package, WITHOUT actually launching a window. Window-launch
// integration is a separate slice (Slice O+ Tier-1 UI test).
//
// Founder-safe invariants asserted here:
//  - electron is a devDependency only (never a runtime dep)
//  - electron is scoped to apps/agent-cockpit (not hoisted to root package.json)
//  - the cockpit start script resolves to electron (not the Slice M placeholder)
//  - the electron binary actually exists on disk after `pnpm install`

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const cockpit = path.join(repoRoot, 'apps', 'agent-cockpit');

function readJSON(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

test('electron is declared as a devDependency in the cockpit package', () => {
  const pkg = readJSON(path.join(cockpit, 'package.json'));
  assert.ok(pkg.devDependencies, 'devDependencies block is required');
  assert.ok(
    typeof pkg.devDependencies.electron === 'string',
    'electron must be pinned in devDependencies',
  );
  assert.ok(
    !pkg.dependencies || !('electron' in pkg.dependencies),
    'electron must NOT appear in runtime dependencies',
  );
});

test('cockpit start script invokes electron (placeholder is gone)', () => {
  const pkg = readJSON(path.join(cockpit, 'package.json'));
  const start = pkg.scripts && pkg.scripts.start;
  assert.ok(typeof start === 'string', 'start script is required');
  assert.ok(
    /\belectron\b/.test(start),
    'start script must invoke electron',
  );
  assert.ok(
    !/not installed yet/.test(start),
    'Slice M placeholder string must be removed',
  );
  assert.ok(!/exit 1/.test(start), 'start script must not force-fail');
});

test('electron is NOT added to root package.json (kept scoped to cockpit)', () => {
  const root = readJSON(path.join(repoRoot, 'package.json'));
  const inDeps = root.dependencies && 'electron' in root.dependencies;
  const inDev = root.devDependencies && 'electron' in root.devDependencies;
  assert.equal(inDeps, false, 'root must not depend on electron');
  assert.equal(inDev, false, 'root must not devDepend on electron');
});

test('electron module resolves from apps/agent-cockpit/node_modules', () => {
  const pkgPath = path.join(
    cockpit,
    'node_modules',
    'electron',
    'package.json',
  );
  assert.ok(
    existsSync(pkgPath),
    `expected electron installed at ${pkgPath} (run \`pnpm install\`)`,
  );
  const pkg = readJSON(pkgPath);
  assert.equal(pkg.name, 'electron');
  assert.ok(/^\d+\.\d+\.\d+/.test(pkg.version), 'electron version must be semver');
});

test('electron binary is present in cockpit node_modules/.bin', () => {
  const binDir = path.join(cockpit, 'node_modules', '.bin');
  // Windows uses .cmd shim; POSIX uses extensionless symlink.
  const winBin = path.join(binDir, 'electron.cmd');
  const posixBin = path.join(binDir, 'electron');
  assert.ok(
    existsSync(winBin) || existsSync(posixBin),
    'electron bin shim must exist after install',
  );
});

test('pnpm-workspace includes apps/* so the cockpit joins the workspace', () => {
  const ws = readFileSync(path.join(repoRoot, 'pnpm-workspace.yaml'), 'utf8');
  assert.ok(/['"]?apps\/\*['"]?/.test(ws), 'pnpm-workspace.yaml must include apps/*');
});

test('pnpm-lock.yaml records electron as a resolved dep', () => {
  const lock = readFileSync(path.join(repoRoot, 'pnpm-lock.yaml'), 'utf8');
  assert.ok(/\belectron\b/.test(lock), 'pnpm-lock.yaml must reference electron');
});

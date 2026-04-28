// Slice R — Electron Builder packaging configuration test.
//
// Validates the cockpit's electron-builder config without invoking the
// builder itself (which would download ~150 MB of platform binaries).
// Asserts:
//  - electron-builder is a devDep only (never runtime)
//  - build.appId / productName / files / directories.output set
//  - files glob includes every renderer + main + preload + chatBus source
//  - no remote URLs in config (publish disabled, no remote icons)
//  - pack/dist scripts wired
//  - existing electron + chat-bus invariants from earlier slices are intact

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const cockpitPkgPath = path.join(repoRoot, 'apps', 'agent-cockpit', 'package.json');
const cockpitDir = path.join(repoRoot, 'apps', 'agent-cockpit');

function readPkg() {
  return JSON.parse(readFileSync(cockpitPkgPath, 'utf8'));
}

test('cockpit declares electron-builder as a devDep only', () => {
  const pkg = readPkg();
  assert.ok(pkg.devDependencies, 'devDependencies must exist');
  assert.ok(
    pkg.devDependencies['electron-builder'],
    'electron-builder must be in devDependencies',
  );
  assert.equal(
    pkg.dependencies && pkg.dependencies['electron-builder'],
    undefined,
    'electron-builder must NEVER be in runtime dependencies',
  );
  // Pinned (no caret/tilde — packaging tool should be reproducible).
  const v = pkg.devDependencies['electron-builder'];
  assert.match(v, /^\d+\.\d+\.\d+$/, `electron-builder must be pinned, got ${v}`);
});

test('cockpit declares electron as a devDep only (Slice N invariant preserved)', () => {
  const pkg = readPkg();
  assert.ok(pkg.devDependencies && pkg.devDependencies.electron, 'electron must be devDep');
  assert.equal(
    pkg.dependencies && pkg.dependencies.electron,
    undefined,
    'electron must NEVER be a runtime dep',
  );
});

test('cockpit exposes pack and dist scripts', () => {
  const pkg = readPkg();
  assert.ok(pkg.scripts && pkg.scripts.pack, 'pack script must exist');
  assert.ok(pkg.scripts && pkg.scripts.dist, 'dist script must exist');
  assert.match(pkg.scripts.pack, /electron-builder/);
  assert.match(pkg.scripts.dist, /electron-builder/);
  // pack must be the no-installer variant
  assert.match(pkg.scripts.pack, /--dir/);
});

test('cockpit build config sets appId, productName, output dir', () => {
  const pkg = readPkg();
  const b = pkg.build;
  assert.ok(b, 'package.json must include a build block');
  assert.match(b.appId, /^[a-z0-9.-]+$/i, 'appId must be reverse-DNS-shaped');
  assert.ok(b.productName && b.productName.length > 0, 'productName must be set');
  assert.equal(b.directories && b.directories.output, 'dist', 'output dir must be dist/');
  assert.equal(b.asar, true, 'asar must be enabled');
});

test('cockpit build files glob includes every cockpit source', () => {
  const pkg = readPkg();
  const files = pkg.build.files || [];
  for (const required of ['main.js', 'preload.js', 'chatBus.js', 'renderer/**/*', 'package.json']) {
    assert.ok(
      files.includes(required),
      `build.files must include "${required}"`,
    );
  }
});

test('cockpit build config has zero remote URLs and zero auto-publish', () => {
  const pkg = readPkg();
  const b = pkg.build;
  assert.equal(b.publish, null, 'publish must be null (no auto-release)');
  assert.equal(b.forceCodeSigning, false, 'forceCodeSigning must be false');
  // No http(s) URLs anywhere in the build block.
  const serialized = JSON.stringify(b);
  assert.equal(
    /https?:\/\//i.test(serialized),
    false,
    'build config must not contain remote URLs',
  );
  // No publish providers wired.
  assert.equal(
    /(github|s3|generic|bintray|snapStore|spaces)/i.test(JSON.stringify(b.publish || {})),
    false,
    'no publisher must be configured',
  );
});

test('cockpit build config targets at least Windows portable x64', () => {
  const pkg = readPkg();
  const win = (pkg.build.win && pkg.build.win.target) || [];
  assert.ok(Array.isArray(win) && win.length > 0, 'win.target must be a non-empty array');
  const portable = win.find((t) => t && t.target === 'portable');
  assert.ok(portable, 'win.target must include a portable build');
  assert.ok(
    portable.arch && portable.arch.includes('x64'),
    'portable target must include x64',
  );
});

test('cockpit .gitignore excludes packaged output', () => {
  const ignorePath = path.join(cockpitDir, '.gitignore');
  assert.ok(existsSync(ignorePath), 'apps/agent-cockpit/.gitignore must exist');
  const ignore = readFileSync(ignorePath, 'utf8');
  for (const line of ['dist/', 'release/', 'node_modules/']) {
    assert.ok(
      ignore.split(/\r?\n/).map((l) => l.trim()).includes(line),
      `.gitignore must exclude ${line}`,
    );
  }
});

test('cockpit main.js still enforces sandbox + contextIsolation (Slice N invariant)', () => {
  const main = readFileSync(path.join(cockpitDir, 'main.js'), 'utf8');
  assert.match(main, /contextIsolation\s*:\s*true/, 'contextIsolation must remain true');
  assert.match(main, /nodeIntegration\s*:\s*false/, 'nodeIntegration must remain false');
  assert.match(main, /sandbox\s*:\s*true/, 'sandbox must remain true');
});

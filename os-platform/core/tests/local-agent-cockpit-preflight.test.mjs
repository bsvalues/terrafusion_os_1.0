// Slice S — Cockpit pre-pack preflight test.
//
// Imports runPreflight() in-process and exercises both the happy path
// (real cockpit dir) and several tampered variants in temp dirs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const cockpit = path.join(repoRoot, 'apps', 'agent-cockpit');

// Dynamic import via file URL for cross-platform safety on Windows.
const preflightURL = pathToFileURL(path.join(cockpit, 'scripts', 'preflight.mjs'));
const { runPreflight } = await import(preflightURL.href);

function copyDirShallow(src, dest, opts = {}) {
  const skip = new Set(opts.skip || []);
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    if (skip.has(entry)) continue;
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const st = statSync(s);
    if (st.isDirectory()) {
      copyDirShallow(s, d, opts);
    } else if (st.isFile()) {
      copyFileSync(s, d);
    }
  }
}

function makeFixture(label) {
  const root = mkdtempSync(path.join(os.tmpdir(), `tf-preflight-${label}-`));
  copyDirShallow(cockpit, root, { skip: ['node_modules', 'dist', 'release'] });
  return root;
}

test('preflight passes against the real cockpit directory', async () => {
  const result = await runPreflight({ cockpitDir: cockpit });
  assert.equal(
    result.ok,
    true,
    `preflight should pass on the real cockpit\nerrors:\n  ${result.errors.join('\n  ')}`,
  );
  assert.ok(result.checks.length >= 4, 'should report several passing checks');
});

test('preflight fails when a required source file is missing', async () => {
  const dir = makeFixture('missing-src');
  try {
    rmSync(path.join(dir, 'preload.js'));
    const result = await runPreflight({ cockpitDir: dir });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /preload\.js/.test(e)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('preflight fails when build.appId is removed from package.json', async () => {
  const dir = makeFixture('no-appid');
  try {
    const pkgPath = path.join(dir, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    delete pkg.build.appId;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    const result = await runPreflight({ cockpitDir: dir });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /appId/.test(e)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('preflight fails when CSP is removed from renderer/index.html', async () => {
  const dir = makeFixture('no-csp');
  try {
    const html = readFileSync(path.join(dir, 'renderer', 'index.html'), 'utf8');
    const stripped = html.replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*>/i, '');
    writeFileSync(path.join(dir, 'renderer', 'index.html'), stripped);
    const result = await runPreflight({ cockpitDir: dir });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /CSP/.test(e)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('preflight fails when contextIsolation is weakened in main.js', async () => {
  const dir = makeFixture('weak-iso');
  try {
    const mainPath = path.join(dir, 'main.js');
    const main = readFileSync(mainPath, 'utf8').replace(
      /contextIsolation\s*:\s*true/,
      'contextIsolation: false',
    );
    writeFileSync(mainPath, main);
    const result = await runPreflight({ cockpitDir: dir });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /contextIsolation/.test(e)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('preflight fails when electron is moved to runtime dependencies', async () => {
  const dir = makeFixture('runtime-electron');
  try {
    const pkgPath = path.join(dir, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies.electron = pkg.devDependencies.electron;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    const result = await runPreflight({ cockpitDir: dir });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /electron.*runtime/i.test(e)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('preflight fails when build.publish is set to anything other than null', async () => {
  const dir = makeFixture('publish-set');
  try {
    const pkgPath = path.join(dir, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    pkg.build.publish = { provider: 'github' };
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    const result = await runPreflight({ cockpitDir: dir });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /publish/i.test(e)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('preflight fails when a remote URL is injected into build config', async () => {
  const dir = makeFixture('remote-url');
  try {
    const pkgPath = path.join(dir, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    pkg.build.copyright = 'see https://example.com/license';
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    const result = await runPreflight({ cockpitDir: dir });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /remote URL/i.test(e)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('preflight reports JSON shape with ok/errors/checks', async () => {
  const result = await runPreflight({ cockpitDir: cockpit });
  assert.equal(typeof result.ok, 'boolean');
  assert.ok(Array.isArray(result.errors));
  assert.ok(Array.isArray(result.checks));
});

test('cockpit package.json exposes a preflight script', () => {
  const pkg = JSON.parse(readFileSync(path.join(cockpit, 'package.json'), 'utf8'));
  assert.ok(pkg.scripts && pkg.scripts.preflight, 'preflight script must exist');
  assert.match(pkg.scripts.preflight, /preflight\.mjs/);
});

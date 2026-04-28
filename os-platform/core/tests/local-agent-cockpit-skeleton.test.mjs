import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const cockpit = path.join(repoRoot, 'apps', 'agent-cockpit');

function read(rel) {
  return fs.readFileSync(path.join(cockpit, rel), 'utf8');
}

test('cockpit skeleton: required files exist', () => {
  for (const rel of [
    'package.json',
    'main.js',
    'preload.js',
    'renderer/index.html',
    'renderer/index.css',
    'renderer/index.js',
    'README.md',
  ]) {
    assert.ok(
      fs.existsSync(path.join(cockpit, rel)),
      `expected apps/agent-cockpit/${rel} to exist`,
    );
  }
});

test('cockpit package.json declares the cockpit name and never pins electron at runtime', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.name, '@terrafusion/agent-cockpit');
  assert.equal(pkg.private, true);
  assert.equal(pkg.main, 'main.js');
  assert.equal(pkg.dependencies, undefined, 'cockpit must not declare runtime deps');
  // electron may appear as a devDependency (Slice N+); it must never appear
  // as a runtime dependency.
  if (pkg.devDependencies) {
    assert.ok(
      !('electron' in (pkg.dependencies || {})),
      'electron must stay a devDependency only',
    );
  }
});

test('main.js sets nodeIntegration:false, contextIsolation:true, sandbox:true', () => {
  const src = read('main.js');
  // Allow optional whitespace.
  assert.match(src, /nodeIntegration\s*:\s*false/);
  assert.match(src, /contextIsolation\s*:\s*true/);
  assert.match(src, /sandbox\s*:\s*true/);
});

test('main.js loads renderer via loadFile and never via remote loadURL', () => {
  const src = read('main.js');
  assert.match(src, /loadFile\s*\(/, 'main.js should call win.loadFile(...)');
  assert.equal(/loadURL\s*\(\s*['"`]https?:\/\//.test(src), false,
    'main.js must not call loadURL with http(s) — use loadFile for local renderer');
});

test('preload.js exposes a single contextBridge namespace named "terrafusion"', () => {
  const src = read('preload.js');
  assert.match(src, /contextBridge\.exposeInMainWorld/);
  // Find every exposeInMainWorld('name', ...) call and ensure exactly one,
  // named 'terrafusion'.
  const calls = [...src.matchAll(/exposeInMainWorld\s*\(\s*['"`]([^'"`]+)['"`]/g)];
  assert.equal(calls.length, 1, `expected exactly one exposeInMainWorld call, found ${calls.length}`);
  assert.equal(calls[0][1], 'terrafusion');
});

test('preload API surface is the explicit Slice P list', () => {
  const src = read('preload.js');
  // Required methods this slice promises.
  for (const required of [
    'version',
    'platform',
    'daemonStart',
    'daemonStop',
    'daemonStatus',
    'adapterList',
    'adapterChat',
  ]) {
    assert.match(src, new RegExp(`\\b${required}\\s*\\(`),
      `preload.js must expose ${required}()`);
  }
  // adapterComplete is still deferred (separate slice).
  assert.equal(src.includes('adapterComplete'), false,
    'preload.js must not expose adapterComplete yet (separate slice)');
});

test('renderer html locks CSP and references only local assets', () => {
  const html = read('renderer/index.html');
  assert.match(html, /<meta\s+http-equiv="Content-Security-Policy"/i);
  assert.match(html, /connect-src\s+'none'/);
  assert.match(html, /default-src\s+'self'/);
  // No remote script src / link href.
  assert.equal(/<script[^>]*\ssrc=["'](https?:)?\/\//i.test(html), false,
    'renderer must not load remote scripts');
  assert.equal(/<link[^>]*\shref=["'](https?:)?\/\//i.test(html), false,
    'renderer must not load remote stylesheets');
});

test('renderer html targets the kv slots the renderer js fills', () => {
  const html = read('renderer/index.html');
  assert.match(html, /id="kv-version"/);
  assert.match(html, /id="kv-platform"/);
});

test('renderer js only reads the bridged namespace, no Node API calls', () => {
  const src = read('renderer/index.js');
  assert.match(src, /window\.terrafusion/);
  // Forbid Node APIs in the renderer (sanity guard, not a true sandbox proof).
  for (const forbidden of ['require(', 'process.binding', 'fs.', 'child_process', 'net.create']) {
    assert.equal(src.includes(forbidden), false,
      `renderer/index.js must not reference ${forbidden}`);
  }
});

test('main.js stays CommonJS and is structurally valid (parseable by Node)', async () => {
  const src = read('main.js');
  assert.match(src, /^\s*['"]use strict['"];/m);
  assert.match(src, /require\(\s*['"]node:path['"]\s*\)/);
  // Spawn `node --check` to validate syntax without executing the file.
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, ['--check', path.join(cockpit, 'main.js')], { encoding: 'utf8' });
  assert.equal(result.status, 0, `node --check failed:\n${result.stderr}`);
});

test('preload.js is structurally valid (parseable by Node)', async () => {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, ['--check', path.join(cockpit, 'preload.js')], { encoding: 'utf8' });
  assert.equal(result.status, 0, `node --check failed:\n${result.stderr}`);
});

test('renderer/index.js is structurally valid (parseable by Node)', async () => {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, ['--check', path.join(cockpit, 'renderer', 'index.js')], { encoding: 'utf8' });
  assert.equal(result.status, 0, `node --check failed:\n${result.stderr}`);
});

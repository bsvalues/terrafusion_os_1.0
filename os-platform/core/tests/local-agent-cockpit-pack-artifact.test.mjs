// Slice T — Cockpit pack-artifact verification.
//
// Verifies that the unpacked Electron tree produced by
// `pnpm --filter @terrafusion/agent-cockpit run pack` is well-formed.
// Skip-friendly: when the artifact is absent (fresh clone, CI without
// pack step) the entire test file no-ops with t.skip(). When the artifact
// IS present, the assertions are strict.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const cockpit = path.join(repoRoot, 'apps', 'agent-cockpit');
const distDir = path.join(cockpit, 'dist');
const unpacked = path.join(distDir, 'win-unpacked');

function artifactPresent() {
  return existsSync(unpacked) && statSync(unpacked).isDirectory();
}

test('cockpit pack artifact: win-unpacked tree exists', (t) => {
  if (!artifactPresent()) {
    t.skip('dist/win-unpacked not present — run `pnpm --filter @terrafusion/agent-cockpit run pack` first');
    return;
  }
  assert.ok(existsSync(unpacked), 'win-unpacked dir must exist');
  const entries = readdirSync(unpacked);
  assert.ok(entries.length > 0, 'win-unpacked must not be empty');
});

test('cockpit pack artifact: portable .exe exists and is non-trivial size', (t) => {
  if (!artifactPresent()) {
    t.skip('artifact not present');
    return;
  }
  const entries = readdirSync(unpacked);
  const exe = entries.find((e) => /\.exe$/i.test(e));
  assert.ok(exe, 'a .exe must exist in win-unpacked');
  // Cockpit name comes from build.productName.
  assert.match(exe, /TerraFusion/i);
  const size = statSync(path.join(unpacked, exe)).size;
  // Electron app runtime is ~150 MB at minimum.
  assert.ok(
    size > 50 * 1024 * 1024,
    `cockpit .exe should be > 50 MB, got ${size} bytes`,
  );
});

test('cockpit pack artifact: app.asar bundle present in resources/', (t) => {
  if (!artifactPresent()) {
    t.skip('artifact not present');
    return;
  }
  const asar = path.join(unpacked, 'resources', 'app.asar');
  assert.ok(existsSync(asar), 'resources/app.asar must exist');
  const size = statSync(asar).size;
  assert.ok(size > 0, 'app.asar must be non-empty');
});

test('cockpit pack artifact: required Electron runtime DLLs and paks present', (t) => {
  if (!artifactPresent()) {
    t.skip('artifact not present');
    return;
  }
  const required = [
    'ffmpeg.dll',
    'icudtl.dat',
    'resources.pak',
    'v8_context_snapshot.bin',
  ];
  for (const f of required) {
    assert.ok(
      existsSync(path.join(unpacked, f)),
      `Electron runtime asset missing: ${f}`,
    );
  }
});

test('cockpit pack artifact: no rogue auto-update / publisher artifacts', (t) => {
  if (!artifactPresent()) {
    t.skip('artifact not present');
    return;
  }
  // electron-builder writes latest.yml / app-update.yml when publish is configured.
  // We forced publish: null, so neither should appear at the dist root or unpacked root.
  for (const dir of [distDir, unpacked]) {
    const entries = readdirSync(dir);
    for (const banned of ['latest.yml', 'app-update.yml', 'latest-mac.yml', 'latest-linux.yml']) {
      assert.equal(
        entries.includes(banned),
        false,
        `${banned} must not appear in ${dir} (publish must remain null)`,
      );
    }
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

/**
 * D-010 / WO-0004: `applications/` was deliberately quarantined (a5f902389). The generator must treat
 * its absence as an accepted state (verify committed output, warn-skip, exit 0) while preserving
 * normal generation when an applications/ tree exists.
 */
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCRIPT = path.join(REPO_ROOT, 'tools', 'registry', 'generate-modules.ts');
const OUT_REAL = path.join(REPO_ROOT, 'frontend/apps/os-shell/src/config/generatedModules.ts');
const tsxCli = createRequire(path.join(REPO_ROOT, 'package.json')).resolve('tsx/cli');

function runGen(args, cwd) {
  // spawnSync so we capture BOTH stdout and stderr on success — the tolerate skip
  // message is emitted via console.warn (stderr).
  const r = spawnSync(process.execPath, [tsxCli, SCRIPT, ...args], { cwd, encoding: 'utf8' });
  return { out: `${r.stdout || ''}${r.stderr || ''}`, code: r.status ?? 1 };
}

test('applications/ absent (quarantined): warn-skip, exit 0, committed output untouched', () => {
  assert.ok(!existsSync(path.join(REPO_ROOT, 'applications')), 'precondition: applications/ absent');
  const before = readFileSync(OUT_REAL, 'utf8');
  const r = runGen([], REPO_ROOT);
  assert.equal(r.code, 0, `expected exit 0, got ${r.code}: ${r.out.slice(0, 300)}`);
  assert.match(r.out, /SKIP/i, 'announces skip');
  assert.match(r.out, /quarantin/i, 'explains the quarantine');
  const after = readFileSync(OUT_REAL, 'utf8');
  assert.equal(after, before, 'committed generatedModules.ts must remain byte-identical');
});

test('applications/ present: generation behavior preserved', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'genmod-'));
  try {
    const appDir = path.join(tmp, 'applications', 'demoapp');
    mkdirSync(appDir, { recursive: true });
    writeFileSync(
      path.join(appDir, 'terrafusion.app.json'),
      JSON.stringify({
        id: 'demoapp',
        displayName: 'Demo App',
        description: 'fixture for WO-0004 tolerate test',
        iconName: 'Box',
        version: '0.0.1',
        category: 'system',
        status: 'alpha',
        intent: 'legacy',
        runnable: false,
        tier: 3,
        pinned: false,
        entry: { type: 'route', route: '/demoapp' },
      })
    );
    const outFile = path.join(tmp, 'generated.ts');
    const r = runGen(['--out', outFile], tmp);
    assert.equal(r.code, 0, `expected exit 0, got ${r.code}: ${r.out.slice(0, 300)}`);
    assert.ok(existsSync(outFile), 'generates output when sources exist');
    assert.match(readFileSync(outFile, 'utf8'), /demoapp/, 'output contains the fixture app');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

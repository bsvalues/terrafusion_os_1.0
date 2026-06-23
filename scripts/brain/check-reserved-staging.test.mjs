import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = path.join(REPO_ROOT, 'scripts', 'brain', 'check-reserved-staging.mjs');

function run() {
  try {
    const out = execFileSync('node', [CLI], { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'pipe' });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

test('reserved-staging check finds nested reserved controllers recursively', () => {
  const dir = path.join(
    REPO_ROOT,
    'backend',
    'src',
    'TerraFusion.API',
    'Controllers',
    '__brain_tmp_nested__'
  );
  const file = path.join(dir, 'RecorderController.cs');
  mkdirSync(dir, { recursive: true });
  try {
    writeFileSync(file, '// nested reserved controller test\n', 'utf8');
    const r = run();
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /reserved-staging:/);
    assert.match(
      r.out,
      /backend\/src\/TerraFusion\.API\/Controllers\/__brain_tmp_nested__\/RecorderController\.cs/
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

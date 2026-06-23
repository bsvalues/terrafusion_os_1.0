import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = path.join(REPO_ROOT, 'scripts', 'brain', 'check-agent-passport.mjs');
const PASSPORT_DIR = path.join(REPO_ROOT, 'docs', 'brain', 'passports', '.tmp-tests');
const BASE = JSON.parse(
  readFileSync(
    path.join(REPO_ROOT, 'docs', 'brain', 'passports', 'TFB-2026-0001.agent-passport.json'),
    'utf8'
  )
);

function runPassport(obj, name) {
  mkdirSync(PASSPORT_DIR, { recursive: true });
  const file = path.join(PASSPORT_DIR, name);
  writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  try {
    const out = execFileSync('node', [CLI, file], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  } finally {
    rmSync(file, { force: true });
  }
}

test('passport validator rejects missing affected_layer', () => {
  const p = { ...BASE };
  delete p.affected_layer;
  const r = runPassport(p, 'missing-affected-layer.agent-passport.json');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /affected_layer/);
});

test('passport validator rejects empty required strings', () => {
  const p = { ...BASE, work_order: '' };
  const r = runPassport(p, 'empty-work-order.agent-passport.json');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /work_order/);
});

test('passport validator rejects work_order outside docs/brain/workorders', () => {
  const p = { ...BASE, work_order: 'README.md' };
  const r = runPassport(p, 'outside-workorder-tree.agent-passport.json');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /work_order.*docs\/brain\/workorders/i);
});

test('passport validator rejects os feature ids in affected_suite', () => {
  const p = { ...BASE, affected_suite: 'pilot' };
  const r = runPassport(p, 'pilot-is-not-suite.agent-passport.json');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /affected_suite/);
});

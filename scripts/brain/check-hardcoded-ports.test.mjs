import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = path.join(REPO_ROOT, 'scripts', 'brain', 'check-hardcoded-ports.mjs');

function run(args) {
  try {
    const out = execFileSync('node', [CLI, ...args], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` };
  }
}

test('hardcoded-port check does not treat plain fallback comments as an allowlist bypass', () => {
  const dir = path.join(REPO_ROOT, 'frontend', 'src', '__brain_tmp_ports__');
  const file = path.join(dir, 'FallbackBypass.ts');
  const rel = path.relative(REPO_ROOT, file).replaceAll('\\', '/');
  mkdirSync(dir, { recursive: true });
  try {
    writeFileSync(file, 'export const api = "http://localhost:3000"; // fallback\n', 'utf8');
    const r = run([rel]);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /hardcoded-ports:/);
    assert.match(r.out, /localhost:3000/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('hardcoded-port check still allows explicit env-driven fallback forms', () => {
  const dir = path.join(REPO_ROOT, 'frontend', 'src', '__brain_tmp_ports__');
  const file = path.join(dir, 'EnvDriven.ts');
  const rel = path.relative(REPO_ROOT, file).replaceAll('\\', '/');
  mkdirSync(dir, { recursive: true });
  try {
    writeFileSync(file, 'export const api = process.env.TF_API_PORT ?? 5046;\n', 'utf8');
    const r = run([rel]);
    assert.equal(r.code, 0, r.out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

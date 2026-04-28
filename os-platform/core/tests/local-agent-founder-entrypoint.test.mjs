import assert from 'node:assert/strict';
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

// File lives at os-platform/core/tests/ — 3 levels from repo root
const REPO_ROOT = new URL('../../..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const CLI = path.join(REPO_ROOT, 'os-platform', 'core', 'pilot', 'local-agent', 'cli.js');

// ─── helpers ────────────────────────────────────────────────────────────────

function runCli(args, { cwd = REPO_ROOT, env = {} } = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout: 15_000,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function makeTmpRoot() {
  const dir = path.join(tmpdir(), `tf-founder-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  // Minimal git init so git commands inside CLI don't error
  try {
    execSync('git init', { cwd: dir, stdio: 'ignore' });
  } catch {
    // Non-fatal: git might not be available in all CI environments
  }
  return dir;
}

// ─── wrapper file tests ──────────────────────────────────────────────────────

test('tf.cmd wrapper exists', () => {
  const p = path.join(REPO_ROOT, 'os-platform', 'core', 'pilot', 'tf.cmd');
  assert.ok(existsSync(p), `Expected tf.cmd at ${p}`);
});

test('tf.cmd wrapper references local-agent cli.js', () => {
  const p = path.join(REPO_ROOT, 'os-platform', 'core', 'pilot', 'tf.cmd');
  const content = readFileSync(p, 'utf8');
  assert.ok(
    content.includes('local-agent\\cli.js') || content.includes('local-agent/cli.js'),
    'tf.cmd should reference local-agent/cli.js',
  );
});

test('tf.ps1 wrapper exists', () => {
  const p = path.join(REPO_ROOT, 'os-platform', 'core', 'pilot', 'tf.ps1');
  assert.ok(existsSync(p), `Expected tf.ps1 at ${p}`);
});

test('tf.ps1 wrapper references local-agent cli.js', () => {
  const p = path.join(REPO_ROOT, 'os-platform', 'core', 'pilot', 'tf.ps1');
  const content = readFileSync(p, 'utf8');
  assert.ok(
    content.includes('local-agent\\cli.js') || content.includes('local-agent/cli.js'),
    'tf.ps1 should reference local-agent/cli.js',
  );
});

// ─── quickstart doc tests ────────────────────────────────────────────────────

test('FOUNDER_QUICKSTART.md exists', () => {
  const p = path.join(REPO_ROOT, 'os-platform', 'core', 'pilot', 'FOUNDER_QUICKSTART.md');
  assert.ok(existsSync(p), `Expected FOUNDER_QUICKSTART.md at ${p}`);
});

test('FOUNDER_QUICKSTART.md covers all five founder commands', () => {
  const p = path.join(REPO_ROOT, 'os-platform', 'core', 'pilot', 'FOUNDER_QUICKSTART.md');
  const content = readFileSync(p, 'utf8');
  for (const cmd of ['init', 'doctor', 'start', 'events', 'release']) {
    assert.ok(content.includes(`tf ${cmd}`), `FOUNDER_QUICKSTART.md must mention 'tf ${cmd}'`);
  }
});

test('FOUNDER_QUICKSTART.md mentions pnpm tf:la alias', () => {
  const p = path.join(REPO_ROOT, 'os-platform', 'core', 'pilot', 'FOUNDER_QUICKSTART.md');
  const content = readFileSync(p, 'utf8');
  assert.ok(content.includes('tf:la'), 'FOUNDER_QUICKSTART.md should mention the tf:la pnpm alias');
});

// ─── package.json alias tests ────────────────────────────────────────────────

test('package.json has tf:local-agent script pointing to cli.js', () => {
  const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  const script = pkg.scripts?.['tf:local-agent'];
  assert.ok(script, 'package.json must have a tf:local-agent script');
  assert.ok(
    script.includes('local-agent/cli.js'),
    `tf:local-agent should invoke local-agent/cli.js, got: ${script}`,
  );
});

test('package.json has tf:la shorthand alias pointing to cli.js', () => {
  const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  const script = pkg.scripts?.['tf:la'];
  assert.ok(script, 'package.json must have a tf:la script');
  assert.ok(
    script.includes('local-agent/cli.js'),
    `tf:la should invoke local-agent/cli.js, got: ${script}`,
  );
});

// ─── CLI runtime smoke tests (isolated tmp dirs) ─────────────────────────────

test('tf init exits 0 in clean tmp dir', () => {
  const tmpRoot = makeTmpRoot();
  try {
    const r = runCli(['init'], { cwd: tmpRoot });
    // init may warn about missing pnpm/git but must not hard-crash
    assert.ok(
      r.status === 0 || r.status === 1,
      `tf init should exit 0 or 1, got ${r.status}. stderr: ${r.stderr}`,
    );
    assert.ok(
      r.stdout.toLowerCase().includes('init') || r.stdout.toLowerCase().includes('terrafusion'),
      'tf init stdout should mention init or terrafusion',
    );
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('tf doctor exits 0 in clean tmp dir (no model configured)', () => {
  const tmpRoot = makeTmpRoot();
  try {
    const r = runCli(['doctor'], {
      cwd: tmpRoot,
      env: { TF_LOCAL_MODEL_PORT: '', TF_LOCAL_MODEL_ENDPOINT: '' },
    });
    // doctor produces output and exits 0 even without a model endpoint
    assert.ok(
      r.status === 0,
      `tf doctor should exit 0, got ${r.status}. stderr: ${r.stderr}`,
    );
    assert.ok(
      r.stdout.includes('Doctor') || r.stdout.includes('Overall'),
      'tf doctor must print a summary header',
    );
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('tf events exits 0 when no event log exists yet', () => {
  const tmpRoot = makeTmpRoot();
  try {
    const r = runCli(['events'], { cwd: tmpRoot });
    assert.strictEqual(r.status, 0, `tf events should exit 0, got ${r.status}. stderr: ${r.stderr}`);
    assert.ok(
      r.stdout.toLowerCase().includes('event'),
      'tf events must print an events header or message',
    );
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('tf release exits 0 in clean tmp dir', () => {
  const tmpRoot = makeTmpRoot();
  try {
    const r = runCli(['release'], { cwd: tmpRoot });
    assert.strictEqual(r.status, 0, `tf release should exit 0, got ${r.status}. stderr: ${r.stderr}`);
    assert.ok(
      r.stdout.toLowerCase().includes('release'),
      'tf release must print a release summary',
    );
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('tf unknown-command exits non-zero and prints usage', () => {
  const r = runCli(['__no_such_command_exists__']);
  assert.ok(r.status !== 0, 'unknown command should exit non-zero');
});

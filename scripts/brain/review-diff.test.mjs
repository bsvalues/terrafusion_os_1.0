import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CLI = path.join(REPO_ROOT, 'scripts', 'brain', 'brain.mjs');
const run = args => {
  try {
    return {
      out: execFileSync('node', [CLI, ...args], { cwd: REPO_ROOT, encoding: 'utf8' }),
      code: 0,
    };
  } catch (e) {
    return { out: `${e.stdout || ''}${e.stderr || ''}`, code: e.status ?? 1 };
  }
};
const git = args => execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });

test('brain review-diff includes staged and untracked test files in its reviewed surface', () => {
  const dir = path.join(REPO_ROOT, 'docs', 'brain', 'tmp-review-diff-test');
  const staged = path.join(dir, 'staged.md');
  const untracked = path.join(dir, 'untracked.md');
  const relStaged = path.relative(REPO_ROOT, staged).replaceAll('\\', '/');
  const relUntracked = path.relative(REPO_ROOT, untracked).replaceAll('\\', '/');
  mkdirSync(dir, { recursive: true });
  try {
    writeFileSync(staged, '# staged\n', 'utf8');
    writeFileSync(untracked, '# untracked\n', 'utf8');
    git(['add', relStaged]);
    const { out } = run(['review-diff']);
    assert.match(out, new RegExp(`staged: ${relStaged.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    const changed = out.match(/Changed files:\s+(\d+)\b/);
    assert.ok(changed, out);
    assert.ok(Number(changed[1]) >= 2, out);
  } finally {
    try {
      git(['reset', 'HEAD', '--', relStaged]);
    } catch {}
    rmSync(dir, { recursive: true, force: true });
  }
});

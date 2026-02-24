import { execFileSync } from 'node:child_process';

function getRepoRoot(): string {
  const out = execFileSync('git', ['rev-parse', '--show-toplevel'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  }).trim();

  if (!out) throw new Error('Unable to resolve repo root via git rev-parse.');
  return out;
}

function listUntrackedLeakGuardTests(repoRoot: string): string[] {
  const out = execFileSync('git', ['status', '--porcelain'], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });

  const lines = out
    .split('\n')
    .map(s => s.trimEnd())
    .filter(Boolean);

  const untracked = lines
    .filter(l => l.startsWith('?? '))
    .map(l => l.slice(3).trim())
    .filter(p => /^os-platform\/core\/tests\/.*-leak-guard\.test\.(ts|tsx)$/i.test(p))
    .sort();

  return untracked;
}

describe('Determinism: no untracked leak-guard tests', () => {
  it('fails if untracked *-leak-guard.test.ts(x) files exist', () => {
    const repoRoot = getRepoRoot();
    const untracked = listUntrackedLeakGuardTests(repoRoot);

    if (untracked.length > 0) {
      const MAX = 60;
      const msg = [
        `Untracked leak-guard test files detected (${untracked.length}).`,
        `These can break deterministic governance by appearing/disappearing across runs.`,
        `Fix: either 'git add' them intentionally (and commit), or delete/quarantine them.`,
        ...untracked.slice(0, MAX).map(p => `  - ${p}`),
        ...(untracked.length > MAX ? [`  ...and ${untracked.length - MAX} more`] : []),
      ].join('\n');

      throw new Error(msg);
    }
  });
});

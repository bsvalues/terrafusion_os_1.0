import assert from 'node:assert';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { before, describe, it } from 'node:test';

let LocalAgentCardLockStore;
let LocalAgentSaveStateWriter;

before(async () => {
  const saveStateModule = await import('../pilot/local-agent/saveState.js');
  const cardLockModule = await import('../pilot/local-agent/cardLock.js');
  LocalAgentSaveStateWriter = saveStateModule.LocalAgentSaveStateWriter;
  LocalAgentCardLockStore = cardLockModule.LocalAgentCardLockStore;
});

function initRepo(root) {
  spawnSync('git', ['init'], { cwd: root, encoding: 'utf8', windowsHide: true });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root, encoding: 'utf8', windowsHide: true });
  spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: root, encoding: 'utf8', windowsHide: true });
}

function lockCard(root) {
  new LocalAgentCardLockStore(root).lock({
    id: 'local-agent-runtime',
    mode: 'Plan',
    task: 'Build local agent runtime',
    why: 'Validate save-state behavior',
    readiness: 'R1',
    truthPosture: 'test',
    allowedFiles: ['os-platform/core/pilot/local-agent/**'],
    forbiddenFiles: ['backend/**', '.env', '.env.*', 'secrets/**'],
    proofGates: ['git diff --check', 'pnpm run type-check'],
    successCriteria: ['Save state is readable'],
    risks: ['Founder handoff can get noisy in temp roots'],
    confidence: 1,
    notes: ['test note'],
  });
}

function writeProofResults(root, results) {
  mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
  writeFileSync(resolve(root, '.terrafusion/proof-results.json'), JSON.stringify({
    ok: results.every(result => result.ok),
    workCardId: 'local-agent-runtime',
    task: 'Build local agent runtime',
    startedAt: 1,
    finishedAt: 2,
    results,
  }, null, 2), 'utf8');
}

describe('Local agent save state', () => {
  it('records non-git repos cleanly without leaking git usage output', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-save-state-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      lockCard(root);
      writeProofResults(root, [
        {
          command: 'git diff --check',
          ok: false,
          skipped: false,
          decision: 'allow',
          exitCode: 129,
          output: 'Git unavailable: not a git repository at the selected repo root.',
          reason: 'git unavailable',
        },
        {
          command: 'pnpm run type-check',
          ok: false,
          skipped: false,
          decision: 'allow',
          exitCode: 127,
          output: 'Command not found: pnpm',
          reason: 'command unavailable',
        },
      ]);

      const report = new LocalAgentSaveStateWriter(root).write('Runtime smoke completed', 'Review smoke artifacts');
      const markdown = readFileSync(resolve(root, '.terrafusion/save-state.md'), 'utf8');

      assert.equal(report.git.branch, 'git: unavailable');
      assert.equal(report.git.statusShort, 'git: unavailable (not a git repo)');
      assert.deepEqual(report.git.changedFiles, []);
      assert.match(markdown, /Branch: git: unavailable/);
      assert.doesNotMatch(markdown, /usage: git diff|Diff output format options|error: unknown option `cached`/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('keeps changed files in a valid git repo', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-save-state-'));
    initRepo(root);
    writeFileSync(resolve(root, 'tracked.txt'), 'one\n', 'utf8');
    spawnSync('git', ['add', 'tracked.txt'], { cwd: root, encoding: 'utf8', windowsHide: true });
    spawnSync('git', ['commit', '-m', 'initial'], { cwd: root, encoding: 'utf8', windowsHide: true });
    writeFileSync(resolve(root, 'tracked.txt'), 'two\n', 'utf8');
    writeFileSync(resolve(root, 'new-file.txt'), 'new\n', 'utf8');

    try {
      lockCard(root);
      writeProofResults(root, [
        {
          command: 'git diff --check',
          ok: true,
          skipped: false,
          decision: 'allow',
          exitCode: 0,
          output: '',
          reason: 'command passed',
        },
      ]);

      const report = new LocalAgentSaveStateWriter(root).write('Git repo snapshot captured', 'Review changed files');
      assert.notEqual(report.git.branch, 'git: unavailable');
      assert.ok(report.git.changedFiles.includes('tracked.txt'));
      assert.ok(report.git.changedFiles.includes('new-file.txt'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
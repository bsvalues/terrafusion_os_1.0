import assert from 'node:assert';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { before, describe, it } from 'node:test';

let LocalAgentCardLockStore;
let LocalAgentFinalizeRunner;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;

  LocalAgentCardLockStore = pilot.LocalAgentCardLockStore;
  LocalAgentFinalizeRunner = pilot.LocalAgentFinalizeRunner;
});

function initRepo(root) {
  spawnSync('git', ['init'], { cwd: root, encoding: 'utf8', windowsHide: true });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root, encoding: 'utf8', windowsHide: true });
  spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: root, encoding: 'utf8', windowsHide: true });
}

function makeCard() {
  return {
    id: 'local-agent-runtime',
    mode: 'Plan',
    task: 'Build local agent runtime',
    why: 'Validate finalize mode',
    readiness: 'R1',
    truthPosture: 'test',
    allowedFiles: ['os-platform/core/pilot/local-agent/**'],
    forbiddenFiles: ['backend/**', '.env', '.env.*', 'secrets/**'],
    proofGates: ['git diff --check'],
    successCriteria: ['Finalize works'],
    risks: ['No model loop yet'],
    confidence: 1,
    notes: ['test note'],
  };
}

function writeProofResults(root, ok = true, workCardId = 'local-agent-runtime') {
  mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
  writeFileSync(resolve(root, '.terrafusion/proof-results.json'), JSON.stringify({
    ok,
    workCardId,
    task: 'Build local agent runtime',
    startedAt: 1,
    finishedAt: 2,
    results: [
      {
        command: 'git diff --check',
        ok,
        skipped: false,
        decision: 'allow',
        exitCode: ok ? 0 : 1,
        output: '',
        reason: ok ? 'command passed' : 'command failed',
      },
    ],
  }, null, 2), 'utf8');
}

function writeSaveState(root) {
  mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
  writeFileSync(resolve(root, '.terrafusion/save-state.md'), '# Save State\n\nReady.\n', 'utf8');
}

function readEvents(root) {
  return readFileSync(resolve(root, '.terrafusion/agent-events.jsonl'), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

function runCli(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

describe('Local agent finalize mode', () => {
  it('requires a locked card, proof results, and save state', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-finalize-'));

    try {
      const runner = new LocalAgentFinalizeRunner(root);
      assert.throws(() => runner.finalize(), /Locked work card required/i);

      LocalAgentCardLockStore.prototype.lock.call(new LocalAgentCardLockStore(root), makeCard());
      assert.throws(() => runner.finalize(), /Proof results are required/i);

      writeProofResults(root, true);
      assert.throws(() => runner.finalize(), /Save State is required/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('blocks failed proof or mismatched proof card ids', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-finalize-'));

    try {
      LocalAgentCardLockStore.prototype.lock.call(new LocalAgentCardLockStore(root), makeCard());
      writeSaveState(root);
      writeProofResults(root, false);
      const runner = new LocalAgentFinalizeRunner(root);
      assert.throws(() => runner.finalize(), /Proof did not pass/i);

      writeProofResults(root, true, 'different-card');
      assert.throws(() => runner.finalize(), /do not match/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('writes final reports, commit message, changed files, and audit event', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-finalize-'));
    initRepo(root);
    writeFileSync(resolve(root, 'tracked.txt'), 'one\n', 'utf8');
    spawnSync('git', ['add', 'tracked.txt'], { cwd: root, encoding: 'utf8', windowsHide: true });
    spawnSync('git', ['commit', '-m', 'initial'], { cwd: root, encoding: 'utf8', windowsHide: true });
    writeFileSync(resolve(root, 'tracked.txt'), 'two\n', 'utf8');
    writeFileSync(resolve(root, 'new_file.txt'), 'new\n', 'utf8');

    try {
      LocalAgentCardLockStore.prototype.lock.call(new LocalAgentCardLockStore(root), makeCard());
      writeProofResults(root, true);
      writeSaveState(root);

      const report = new LocalAgentFinalizeRunner(root).finalize();
      assert.equal(report.ok, true);
      assert.equal(report.workCardId, 'local-agent-runtime');
      assert.ok(report.commitMessage.includes('feat(ai)'));
      assert.ok(report.changedFiles.includes('tracked.txt'));
      assert.ok(report.changedFiles.includes('new_file.txt'));
      assert.ok(readFileSync(resolve(root, '.terrafusion/final-report.md'), 'utf8').includes('TerraFusion Final Report'));

      const eventTypes = readEvents(root).map(event => event.type);
      assert.ok(eventTypes.includes('finalize_completed'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('supports the CLI finalize flow once proof and save state exist', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-finalize-'));
    initRepo(root);

    try {
      LocalAgentCardLockStore.prototype.lock.call(new LocalAgentCardLockStore(root), {
        ...makeCard(),
        proofGates: ['git diff --check'],
      });
      const proof = runCli(root, 'proof');
      assert.equal(proof.status, 0);

      const save = runCli(root, 'save-state', 'Runtime slice ready to finalize', '--next-step', 'Commit the finalized runtime slice');
      assert.equal(save.status, 0);

      const final = runCli(root, 'finalize');
      assert.equal(final.status, 0);
      assert.match(final.stdout, /Overall: PASS/);
      assert.match(final.stdout, /git commit -m/);
      assert.ok(readFileSync(resolve(root, '.terrafusion/final-report.json'), 'utf8').includes('commitMessage'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
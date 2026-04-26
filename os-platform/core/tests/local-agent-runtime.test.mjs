import assert from 'node:assert';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

let LocalAgentCardLockStore;
let LocalAgentPatchPreview;
let LocalAgentPermissionPolicy;
let LocalAgentProofRunner;
let LocalAgentSaveStateWriter;
let LocalAgentToolRunner;
let LocalAgentWorkCardFactory;
let loadFounderLocalAgentPolicy;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;

  LocalAgentCardLockStore = pilot.LocalAgentCardLockStore;
  LocalAgentPatchPreview = pilot.LocalAgentPatchPreview;
  LocalAgentPermissionPolicy = pilot.LocalAgentPermissionPolicy;
  LocalAgentProofRunner = pilot.LocalAgentProofRunner;
  LocalAgentSaveStateWriter = pilot.LocalAgentSaveStateWriter;
  LocalAgentToolRunner = pilot.LocalAgentToolRunner;
  LocalAgentWorkCardFactory = pilot.LocalAgentWorkCardFactory;
  loadFounderLocalAgentPolicy = pilot.loadFounderLocalAgentPolicy;
});

function initRepo(root) {
  spawnSync('git', ['init'], { cwd: root, encoding: 'utf8', windowsHide: true });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root, encoding: 'utf8', windowsHide: true });
  spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: root, encoding: 'utf8', windowsHide: true });
}

describe('Local agent runtime', () => {
  it('builds a local-agent work card with governed proof gates', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-runtime-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
    mkdirSync(resolve(root, 'os-platform/core/tests'), { recursive: true });
    writeFileSync(resolve(root, 'os-platform/core/tests/local-agent-policy.test.mjs'), '', 'utf8');
    writeFileSync(resolve(root, 'os-platform/core/tests/local-agent-runtime.test.mjs'), '', 'utf8');

    try {
      const card = new LocalAgentWorkCardFactory(root).build('Build the local agent permission harness');
      assert.equal(card.id, 'local-agent-runtime');
      assert.ok(card.allowedFiles.includes('os-platform/core/pilot/local-agent/**'));
      assert.ok(card.proofGates.includes('pnpm run test:local-agent'));
      assert.ok(card.notes.some(note => /Prometheus is the internal codename/i.test(note)));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('locks and reloads work cards', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-runtime-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
    mkdirSync(resolve(root, 'os-platform/core/tests'), { recursive: true });
    writeFileSync(resolve(root, 'os-platform/core/tests/local-agent-policy.test.mjs'), '', 'utf8');
    writeFileSync(resolve(root, 'os-platform/core/tests/local-agent-runtime.test.mjs'), '', 'utf8');

    try {
      const store = new LocalAgentCardLockStore(root);
      const card = store.lockFromTask('Build the local agent permission harness');
      const loaded = store.load();

      assert.equal(loaded.id, card.id);
      assert.equal(loaded.task, card.task);
      assert.ok(readFileSync(resolve(root, '.terrafusion/current-work-card.md'), 'utf8').includes('# Work Card: local-agent-runtime'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('previews and applies in-scope patches while blocking forbidden files', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-runtime-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
    mkdirSync(resolve(root, 'os-platform/core/tests'), { recursive: true });
    writeFileSync(resolve(root, 'os-platform/core/tests/local-agent-policy.test.mjs'), '', 'utf8');
    writeFileSync(resolve(root, 'os-platform/core/tests/local-agent-runtime.test.mjs'), '', 'utf8');
    mkdirSync(resolve(root, 'os-platform/core/pilot/local-agent'), { recursive: true });
    writeFileSync(resolve(root, 'os-platform/core/pilot/local-agent/example.ts'), 'old\n', 'utf8');

    try {
      new LocalAgentCardLockStore(root).lockFromTask('Build the local agent permission harness');
      const patcher = new LocalAgentPatchPreview(root);
      const proposal = patcher.previewReplacement('os-platform/core/pilot/local-agent/example.ts', 'new\n');

      assert.ok(proposal.diff.includes('-old'));
      assert.ok(proposal.diff.includes('+new'));
      patcher.applyPatch(proposal.id, true);
      assert.equal(readFileSync(resolve(root, 'os-platform/core/pilot/local-agent/example.ts'), 'utf8'), 'new\n');

      mkdirSync(resolve(root, 'backend'), { recursive: true });
      writeFileSync(resolve(root, 'backend/blocked.cs'), 'old\n', 'utf8');
      assert.throws(() => patcher.previewReplacement('backend/blocked.cs', 'new\n'), /forbidden|allowedFiles/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('runs proof and writes integrated save state', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-runtime-'));
    initRepo(root);
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const store = new LocalAgentCardLockStore(root);
      store.lock({
        id: 'local-agent-runtime',
        mode: 'Plan',
        task: 'Run proof',
        why: 'Validate proof mode',
        readiness: 'R1',
        truthPosture: 'plan-only',
        allowedFiles: ['os-platform/core/pilot/local-agent/**'],
        forbiddenFiles: ['backend/**', '.env', '.env.*', 'secrets/**'],
        proofGates: ['git diff --check'],
        successCriteria: ['Proof gates run'],
        risks: ['test risk'],
        confidence: 1,
        notes: ['test'],
      });

      const report = new LocalAgentProofRunner(root).run();
      assert.equal(report.ok, true);

      const saveState = new LocalAgentSaveStateWriter(root).write(
        'Proof completed',
        'Add finalize mode',
        ['No model loop yet'],
      );

      assert.equal(saveState.proof.ok, true);
      assert.ok(readFileSync(resolve(root, '.terrafusion/save-state.md'), 'utf8').includes('Add finalize mode'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('runs the governed read tool without reading secrets', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-runtime-'));
    writeFileSync(resolve(root, 'visible.txt'), 'hello', 'utf8');
    writeFileSync(resolve(root, '.env'), 'secret', 'utf8');

    try {
      const policy = new LocalAgentPermissionPolicy(loadFounderLocalAgentPolicy(), root);
      const runner = new LocalAgentToolRunner(root, policy);
      const allowed = runner.readFile('visible.txt');
      const denied = runner.readFile('.env');

      assert.equal(allowed.ok, true);
      assert.equal(denied.ok, false);
      assert.equal(denied.decision, 'deny');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
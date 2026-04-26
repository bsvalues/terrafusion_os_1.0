import assert from 'node:assert';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { before, describe, it } from 'node:test';

let LocalAgentCardLockStore;
let LocalAgentFounderWizard;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;

  LocalAgentCardLockStore = pilot.LocalAgentCardLockStore;
  LocalAgentFounderWizard = pilot.LocalAgentFounderWizard;
});

function initRepo(root) {
  spawnSync('git', ['init'], { cwd: root, encoding: 'utf8', windowsHide: true });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root, encoding: 'utf8', windowsHide: true });
  spawnSync('git', ['config', 'user.name', 'Test User'], { cwd: root, encoding: 'utf8', windowsHide: true });
}

function createTestIo(responses) {
  const output = [];
  return {
    io: {
      async prompt(message) {
        output.push(message);
        return responses.shift() ?? '';
      },
      write(message) {
        output.push(message);
      },
    },
    output,
  };
}

function runCli(repoRoot, inputText) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, 'start'], {
    cwd: repoRoot,
    input: inputText,
    encoding: 'utf8',
    windowsHide: true,
  });
}

function runCliWithArgs(cwd, inputText, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, ...args], {
    cwd,
    input: inputText,
    encoding: 'utf8',
    windowsHide: true,
  });
}

describe('Local agent founder wizard', () => {
  it('quits cleanly and shows missing save state', async () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-wizard-'));
    const { io, output } = createTestIo(['1', '', 'q']);

    try {
      const result = await new LocalAgentFounderWizard(root, io).run();
      assert.equal(result, 0);
      assert.ok(output.some(line => line.includes('TerraFusion Local Agent')));
      assert.ok(output.some(line => line.includes('No save state found')));
      assert.ok(output.some(line => line.includes('Exiting TerraFusion Local Agent.')));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('shows existing save state and can lock or display a work card', async () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-wizard-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
    mkdirSync(resolve(root, '.terrafusion'), { recursive: true });
    writeFileSync(resolve(root, '.terrafusion/save-state.md'), '# Save State\n\nHello founder.\n', 'utf8');
    const { io, output } = createTestIo(['1', '', '2', 'Build local agent runtime', '', '3', '', 'q']);

    try {
      const result = await new LocalAgentFounderWizard(root, io).run();
      assert.equal(result, 0);
      assert.ok(output.some(line => line.includes('Hello founder')));
      assert.ok(output.some(line => line.includes('Work card locked.')));
      assert.ok(output.some(line => line.includes('# Work Card: local-agent-runtime')));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('can run proof, save state, finalize, and clear a card', async () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-wizard-'));
    initRepo(root);
    LocalAgentCardLockStore.prototype.lock.call(new LocalAgentCardLockStore(root), {
      id: 'local-agent-runtime',
      mode: 'Plan',
      task: 'Build local agent runtime',
      why: 'wizard test',
      readiness: 'R1',
      truthPosture: 'test',
      allowedFiles: ['os-platform/core/pilot/local-agent/**'],
      forbiddenFiles: ['backend/**', '.env', '.env.*', 'secrets/**'],
      proofGates: ['git diff --check'],
      successCriteria: ['wizard works'],
      risks: ['No model loop yet'],
      confidence: 1,
      notes: ['test'],
    });

    const { io, output } = createTestIo([
      '4', '',
      '5', 'Built wizard slice', 'Finalize runtime slice', '', '',
      '6', '',
      '7', 'y', '',
      'q',
    ]);

    try {
      const result = await new LocalAgentFounderWizard(root, io).run();
      assert.equal(result, 0);
      assert.ok(output.some(line => line.includes('Proof Result: PASS')));
      assert.ok(output.some(line => line.includes('Save State written.')));
      assert.ok(output.some(line => line.includes('Finalize PASS')));
      assert.ok(output.some(line => line.includes('Current work card cleared.')));
      assert.ok(!readFileSync(resolve(root, '.terrafusion/agent-events.jsonl'), 'utf8').includes('nonexistent'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('supports the start CLI for quit and lock-card flows', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-wizard-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const quit = runCli(root, 'q\n');
      assert.equal(quit.status, 0);
      assert.match(quit.stdout, /TerraFusion Local Agent/);
      assert.match(quit.stdout, /Exiting TerraFusion Local Agent/);

      const lock = runCli(root, '2\nBuild local agent runtime\n\nq\n');
      assert.equal(lock.status, 0);
      assert.ok(readFileSync(resolve(root, '.terrafusion/current-work-card.json'), 'utf8').includes('local-agent-runtime'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits cleanly when scripted stdin ends after a declined overwrite', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-wizard-'));
    initRepo(root);
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');
    new LocalAgentCardLockStore(root).lockFromTask('Build local agent runtime');

    try {
      const result = runCli(root, '2\nBuild local agent runtime\n\n\n');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Could not lock card: A work card is already locked/);
      assert.match(result.stdout, /Input stream ended\. Exiting TerraFusion Local Agent\./);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('supports --repo-root so scripted runs can target a temp repo without changing cwd', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-wizard-'));
    const externalCwd = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-external-cwd-'));
    initRepo(root);
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const result = runCliWithArgs(
        externalCwd,
        '2\nBuild local agent runtime\n\nq\n',
        '--repo-root',
        root,
        'start',
      );

      assert.equal(result.status, 0);
      assert.match(result.stdout, /Work card locked\./);
      assert.ok(readFileSync(resolve(root, '.terrafusion/current-work-card.json'), 'utf8').includes('local-agent-runtime'));
      assert.throws(() => readFileSync(resolve(externalCwd, '.terrafusion/current-work-card.json'), 'utf8'));
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(externalCwd, { recursive: true, force: true });
    }
  });
});
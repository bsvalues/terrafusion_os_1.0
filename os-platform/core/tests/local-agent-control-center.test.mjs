import assert from 'node:assert';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

let LocalAgentControlCenterStateBuilder;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentControlCenterStateBuilder = pilot.LocalAgentControlCenterStateBuilder;
});

function runCli(repoRoot, ...args) {
  const cliPath = resolve(process.cwd(), 'os-platform/core/pilot/local-agent/cli.js');
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}

describe('Local agent control center contract', () => {
  it('writes control-center state json and markdown', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-control-center-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const state = new LocalAgentControlCenterStateBuilder(root).build();
      assert.equal(state.version, '0.1.0');
      assert.equal(state.identity.productName, 'TerraFusion Local Agent Runtime');
      assert.equal(state.identity.internalCodename, 'Prometheus');
      assert.equal(state.policy.profile, 'founder');
      assert.equal(state.commandRegistryPath, '.terrafusion/command-registry.json');
      assert.ok(state.commandCount >= 10);
      assert.ok(readFileSync(resolve(root, '.terrafusion/control-center-state.md'), 'utf8').includes('Authority Boundary'));
      assert.ok(readFileSync(resolve(root, '.terrafusion/control-center-state.md'), 'utf8').includes('Prometheus is not a model'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reads exported policy, doctor, and model artifacts when present', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-control-center-'));
    mkdirSync(resolve(root, '.terrafusion'), { recursive: true });

    try {
      writeFileSync(
        resolve(root, '.terrafusion/active-policy.json'),
        JSON.stringify({
          name: 'airgap-appliance',
          purpose: 'Locked-down offline mode.',
          modelEndpoints: {
            allowCloud: false,
            allowPrivateLan: false,
            defaultEndpoint: 'http://127.0.0.1:8008/v1',
          },
        }),
        'utf8',
      );
      writeFileSync(
        resolve(root, '.terrafusion/doctor-report.json'),
        JSON.stringify({ overallStatus: 'warn', criticalFailures: 0, warnings: 2 }),
        'utf8',
      );
      writeFileSync(
        resolve(root, '.terrafusion/model-runtime-status.json'),
        JSON.stringify({
          healthy: false,
          endpoint: 'http://127.0.0.1:8008/v1',
          model: 'local-coder',
          startupMode: 'manual-airgap',
          warnings: ['Local model endpoint is unavailable.'],
        }),
        'utf8',
      );

      const state = new LocalAgentControlCenterStateBuilder(root).build();
      assert.equal(state.policy.profile, 'airgap-appliance');
      assert.equal(state.doctor.overallStatus, 'warn');
      assert.equal(state.model.available, true);
      assert.equal(state.model.healthy, false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('enables and disables UI actions from local state', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-control-center-'));
    mkdirSync(resolve(root, '.terrafusion'), { recursive: true });

    try {
      let state = new LocalAgentControlCenterStateBuilder(root).build();
      let actions = Object.fromEntries(state.actions.map(action => [action.id, action]));
      assert.equal(actions.proof.enabled, false);
      assert.match(actions.proof.reason, /Locked work card/);
      assert.equal(actions.finalize.enabled, false);

      writeFileSync(resolve(root, '.terrafusion/current-work-card.json'), '{}', 'utf8');
      state = new LocalAgentControlCenterStateBuilder(root).build();
      actions = Object.fromEntries(state.actions.map(action => [action.id, action]));
      assert.equal(actions.proof.enabled, true);
      assert.equal(actions.finalize.enabled, false);

      writeFileSync(resolve(root, '.terrafusion/proof-results.json'), '{}', 'utf8');
      writeFileSync(resolve(root, '.terrafusion/save-state.md'), '# Save State\n', 'utf8');
      state = new LocalAgentControlCenterStateBuilder(root).build();
      actions = Object.fromEntries(state.actions.map(action => [action.id, action]));
      assert.equal(actions.finalize.enabled, true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('writes an audit event and supports the CLI command', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-control-center-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const result = runCli(root, 'control-center-state');
      assert.equal(result.status, 0);
      assert.match(result.stdout, /TerraFusion Control Center State/);

      const events = readFileSync(resolve(root, '.terrafusion/agent-events.jsonl'), 'utf8');
      assert.match(events, /control_center_state_written/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
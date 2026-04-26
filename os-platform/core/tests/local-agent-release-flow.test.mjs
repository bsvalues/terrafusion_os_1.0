import assert from 'node:assert';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';

let LocalAgentCommandRegistryBuilder;
let LocalAgentControlCenterStateBuilder;
let LocalAgentReleaseApprovalRunner;
let LocalAgentReleaseRunbookBuilder;
let LocalAgentShipMvpRunner;
let LocalAgentTagCommandRunner;
let LocalAgentTagGateRunner;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentCommandRegistryBuilder = pilot.LocalAgentCommandRegistryBuilder;
  LocalAgentControlCenterStateBuilder = pilot.LocalAgentControlCenterStateBuilder;
  LocalAgentReleaseApprovalRunner = pilot.LocalAgentReleaseApprovalRunner;
  LocalAgentReleaseRunbookBuilder = pilot.LocalAgentReleaseRunbookBuilder;
  LocalAgentShipMvpRunner = pilot.LocalAgentShipMvpRunner;
  LocalAgentTagCommandRunner = pilot.LocalAgentTagCommandRunner;
  LocalAgentTagGateRunner = pilot.LocalAgentTagGateRunner;
});

describe('Local agent release flow integration', () => {
  it('integrates release commands into registry and control center actions', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-flow-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      new LocalAgentShipMvpRunner(root).run('release', true);
      new LocalAgentTagGateRunner(root).run('0.1.0');
      new LocalAgentReleaseApprovalRunner(root).approve('0.1.0', 'Founder');
      new LocalAgentTagCommandRunner(root).build('0.1.0');
      new LocalAgentReleaseRunbookBuilder(root).build('0.1.0');

      const registry = new LocalAgentCommandRegistryBuilder(root).build();
      const names = new Set(registry.commands.map(command => command.name));
      assert.ok(names.has('release-notes'));
      assert.ok(names.has('release-freeze'));
      assert.ok(names.has('tag-gate'));
      assert.ok(names.has('release-approve'));
      assert.ok(names.has('tag-command'));
      assert.ok(names.has('release-runbook'));

      const state = new LocalAgentControlCenterStateBuilder(root).build();
      const actions = Object.fromEntries(state.actions.map(action => [action.id, action]));
      assert.equal(actions['release-freeze'].enabled, true);
      assert.equal(actions['tag-gate'].enabled, true);
      assert.equal(actions['release-approve'].enabled, true);
      assert.equal(actions['tag-command'].enabled, true);
      assert.equal(actions['release-runbook'].enabled, true);

      const shipReport = JSON.parse(readFileSync(resolve(root, '.terrafusion/ship-report.json'), 'utf8'));
      assert.ok(shipReport.steps.some(step => step.name === 'Release Notes'));
      assert.ok(shipReport.steps.some(step => step.name === 'Docs Index'));
      assert.equal(spawnSync('git', ['tag', '--list', 'v0.1.0'], { cwd: root, encoding: 'utf8', windowsHide: true }).stdout.trim(), '');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
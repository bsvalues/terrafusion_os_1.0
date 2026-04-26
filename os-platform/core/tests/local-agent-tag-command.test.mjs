import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';

let LocalAgentReleaseApprovalRunner;
let LocalAgentShipMvpRunner;
let LocalAgentTagCommandRunner;
let LocalAgentTagGateRunner;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentReleaseApprovalRunner = pilot.LocalAgentReleaseApprovalRunner;
  LocalAgentShipMvpRunner = pilot.LocalAgentShipMvpRunner;
  LocalAgentTagCommandRunner = pilot.LocalAgentTagCommandRunner;
  LocalAgentTagGateRunner = pilot.LocalAgentTagGateRunner;
});

describe('Local agent tag command', () => {
  it('prints manual tag instructions without creating a tag', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-tag-command-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      new LocalAgentShipMvpRunner(root).run('release', true);
      new LocalAgentTagGateRunner(root).run('0.1.0');
      new LocalAgentReleaseApprovalRunner(root).approve('0.1.0', 'Founder');
      const report = new LocalAgentTagCommandRunner(root).build('0.1.0');
      assert.equal(report.productName, 'TerraFusion Local Agent Runtime');
      assert.equal(report.internalCodename, 'Prometheus');
      assert.match(report.tagCommand, /git tag -a v0\.1\.0/);
      assert.ok(report.verificationCommands.some(command => /git show --stat/.test(command)));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
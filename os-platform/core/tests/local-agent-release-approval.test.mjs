import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';

let LocalAgentReleaseApprovalRunner;
let LocalAgentShipMvpRunner;
let LocalAgentTagGateRunner;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentReleaseApprovalRunner = pilot.LocalAgentReleaseApprovalRunner;
  LocalAgentShipMvpRunner = pilot.LocalAgentShipMvpRunner;
  LocalAgentTagGateRunner = pilot.LocalAgentTagGateRunner;
});

describe('Local agent release approval', () => {
  it('requires passing tag gate and writes approval artifacts', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-approval-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      new LocalAgentShipMvpRunner(root).run('release', true);
      new LocalAgentTagGateRunner(root).run('0.1.0');
      const approval = new LocalAgentReleaseApprovalRunner(root).approve('0.1.0', 'Founder');
      assert.equal(approval.version, '0.1.0');
      assert.equal(approval.productName, 'TerraFusion Local Agent Runtime');
      assert.equal(approval.internalCodename, 'Prometheus');
      assert.equal(approval.approverName, 'Founder');
      assert.match(approval.tagCommand, /git tag -a v0\.1\.0/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
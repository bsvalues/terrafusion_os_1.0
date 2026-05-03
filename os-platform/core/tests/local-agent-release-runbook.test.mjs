import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';

let LocalAgentReleaseApprovalRunner;
let LocalAgentReleaseRunbookBuilder;
let LocalAgentShipMvpRunner;
let LocalAgentTagCommandRunner;
let LocalAgentTagGateRunner;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentReleaseApprovalRunner = pilot.LocalAgentReleaseApprovalRunner;
  LocalAgentReleaseRunbookBuilder = pilot.LocalAgentReleaseRunbookBuilder;
  LocalAgentShipMvpRunner = pilot.LocalAgentShipMvpRunner;
  LocalAgentTagCommandRunner = pilot.LocalAgentTagCommandRunner;
  LocalAgentTagGateRunner = pilot.LocalAgentTagGateRunner;
});

describe('Local agent release runbook', () => {
  it('writes final manual release instructions without tagging', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-release-runbook-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      new LocalAgentShipMvpRunner(root).run('release', true);
      new LocalAgentTagGateRunner(root).run('0.1.0');
      new LocalAgentReleaseApprovalRunner(root).approve('0.1.0', 'Founder');
      new LocalAgentTagCommandRunner(root).build('0.1.0');
      const runbook = new LocalAgentReleaseRunbookBuilder(root).build('0.1.0');
      assert.equal(runbook.releaseStatus, 'ready-for-human-tag');
      assert.equal(runbook.productName, 'TerraFusion Local Agent Runtime');
      assert.equal(runbook.internalCodename, 'Prometheus');
      assert.ok(runbook.rollbackCommands.some(command => /git tag -d v0\.1\.0/.test(command)));
      assert.match(runbook.notes.join('\n'), /No git tag was created/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
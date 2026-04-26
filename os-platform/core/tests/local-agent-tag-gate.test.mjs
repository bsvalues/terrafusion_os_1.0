import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';

let LocalAgentShipMvpRunner;
let LocalAgentTagGateRunner;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentShipMvpRunner = pilot.LocalAgentShipMvpRunner;
  LocalAgentTagGateRunner = pilot.LocalAgentTagGateRunner;
});

describe('Local agent tag gate', () => {
  it('requires release artifacts and writes reports without tagging', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-tag-gate-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      new LocalAgentShipMvpRunner(root).run('release', true);
      const report = new LocalAgentTagGateRunner(root).run('0.1.0');
      assert.equal(report.version, '0.1.0');
      assert.equal(report.productName, 'TerraFusion Local Agent Runtime');
      assert.equal(report.internalCodename, 'Prometheus');
      assert.match(report.tagCommand, /git tag -a v0\.1\.0/);
      assert.ok(report.items.some(item => item.name === 'Release Notes'));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
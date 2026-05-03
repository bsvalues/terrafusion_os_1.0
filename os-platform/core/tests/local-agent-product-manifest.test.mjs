import assert from 'node:assert';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import { before, describe, it } from 'node:test';

let LocalAgentProductManifestBuilder;

before(async () => {
  const pilotModule = await import('../pilot/index.js');
  const pilot = pilotModule.default || pilotModule;
  LocalAgentProductManifestBuilder = pilot.LocalAgentProductManifestBuilder;
});

describe('Local agent product manifest', () => {
  it('declares manual release governance and no auto tag or push', () => {
    const root = mkdtempSync(resolve(os.tmpdir(), 'tf-local-agent-product-manifest-'));
    writeFileSync(resolve(root, 'package.json'), '{}', 'utf8');

    try {
      const manifest = new LocalAgentProductManifestBuilder(root).build();
      assert.equal(manifest.productName, 'TerraFusion Local Agent Runtime');
      assert.equal(manifest.internalCodename, 'Prometheus');
      assert.equal(manifest.releaseGovernance.requiresTagGate, true);
      assert.equal(manifest.releaseGovernance.requiresReleaseApproval, true);
      assert.equal(manifest.releaseGovernance.printsTagCommandOnly, true);
      assert.equal(manifest.releaseGovernance.createsGitTag, false);
      assert.equal(manifest.releaseGovernance.pushesGitTag, false);
      assert.match(manifest.knownLimitations.join('\n').toLowerCase(), /do not create or push git tags/);
      assert.match(manifest.countySafePosture.join('\n'), /OpenMythos is only one optional local model backend/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
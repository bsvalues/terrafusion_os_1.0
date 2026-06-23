import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const workflow = readFileSync(
  join(ROOT, '.github', 'workflows', 'terraforge-production-matrix-proof.yml'),
  'utf8',
);
const smokeScriptPath = join(ROOT, 'scripts', 'terraforge-production-matrix-smoke.mjs');

describe('TerraForge production proof workflow', () => {
  it('is manual, production-scoped, and checks out the deployed release SHA', () => {
    assert.ok(workflow.includes('workflow_dispatch:'));
    assert.ok(workflow.includes('environment: production'));
    assert.ok(workflow.includes('ref: ${{ inputs.release_sha }}'));
    assert.ok(workflow.includes('persist-credentials: false'));
    assert.ok(workflow.includes('TF_EXPECTED_RELEASE_SHA=%s'));
  });

  it('runs the authenticated TerraForge production matrix smoke with production secrets', () => {
    assert.ok(existsSync(smokeScriptPath));
    assert.ok(workflow.includes('TF_PROVISIONED_AUTH_EMAIL: ${{ secrets.TF_PROVISIONED_AUTH_EMAIL }}'));
    assert.ok(workflow.includes('TF_PROVISIONED_AUTH_PASSWORD: ${{ secrets.TF_PROVISIONED_AUTH_PASSWORD }}'));
    assert.ok(workflow.includes('test -f scripts/terraforge-production-matrix-smoke.mjs'));
    assert.ok(workflow.includes('node scripts/terraforge-production-matrix-smoke.mjs'));
    assert.ok(workflow.includes('--expected-sha "$TF_EXPECTED_RELEASE_SHA"'));
  });

  it('restricts production secrets to the trusted production URL', () => {
    assert.ok(workflow.includes('Production base URL must use https.'));
    assert.ok(workflow.includes('base_url must match production PUBLIC_URL before using production secrets.'));
    assert.ok(workflow.includes('Missing production PUBLIC_URL variable; refusing to run production proof with secrets.'));
  });

  it('pins GitHub Actions and disables persisted or implicit package-manager credentials/cache', () => {
    const actionRefs = [...workflow.matchAll(/uses:\s*([^\s#]+)/g)].map((match) => match[1]);

    assert.ok(workflow.includes('package-manager-cache: false'));
    assert.deepEqual(actionRefs, [
      'actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd',
      'actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444',
      'actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
    ]);

    for (const actionRef of actionRefs) {
      assert.match(actionRef, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[a-f0-9]{40}$/);
    }
  });

  it('does not contain deploy, provisioner, or DB mutation paths', () => {
    assert.doesNotMatch(workflow, /docker compose .*up -d/);
    assert.doesNotMatch(workflow, /AuthProvisioner/);
    assert.doesNotMatch(workflow, /allow_db_mutation/i);
    assert.doesNotMatch(workflow, /MigrateAsync|database update|SaveChangesAsync/i);
  });

  it('uploads durable TerraForge production proof artifacts', () => {
    assert.ok(workflow.includes('actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a'));
    assert.ok(workflow.includes('terraforge-production-matrix-proof-${{ inputs.release_sha }}'));
    assert.ok(workflow.includes('if-no-files-found: error'));
  });
});

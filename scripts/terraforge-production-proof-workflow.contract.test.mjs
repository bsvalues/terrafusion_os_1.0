import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const workflow = readFileSync(
  join(ROOT, '.github', 'workflows', 'terraforge-production-matrix-proof.yml'),
  'utf8',
);

describe('TerraForge production proof workflow', () => {
  it('is manual, production-scoped, and checks out the deployed release SHA', () => {
    assert.ok(workflow.includes('workflow_dispatch:'));
    assert.ok(workflow.includes('environment: production'));
    assert.ok(workflow.includes('ref: ${{ inputs.release_sha }}'));
    assert.ok(workflow.includes('TF_EXPECTED_RELEASE_SHA=%s'));
  });

  it('runs the authenticated TerraForge production matrix smoke with production secrets', () => {
    assert.ok(workflow.includes('TF_PROVISIONED_AUTH_EMAIL: ${{ secrets.TF_PROVISIONED_AUTH_EMAIL }}'));
    assert.ok(workflow.includes('TF_PROVISIONED_AUTH_PASSWORD: ${{ secrets.TF_PROVISIONED_AUTH_PASSWORD }}'));
    assert.ok(workflow.includes('node scripts/terraforge-production-matrix-smoke.mjs'));
    assert.ok(workflow.includes('--expected-sha "$TF_EXPECTED_RELEASE_SHA"'));
  });

  it('does not contain deploy, provisioner, or DB mutation paths', () => {
    assert.doesNotMatch(workflow, /docker compose .*up -d/);
    assert.doesNotMatch(workflow, /AuthProvisioner/);
    assert.doesNotMatch(workflow, /allow_db_mutation/i);
    assert.doesNotMatch(workflow, /MigrateAsync|database update|SaveChangesAsync/i);
  });

  it('uploads durable TerraForge production proof artifacts', () => {
    assert.ok(workflow.includes('actions/upload-artifact@v7'));
    assert.ok(workflow.includes('terraforge-production-matrix-proof-${{ inputs.release_sha }}'));
    assert.ok(workflow.includes('if-no-files-found: error'));
  });
});

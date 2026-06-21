import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..', '..');
const workflow = readFileSync(
  join(ROOT, '.github', 'workflows', 'os-production-acceptance.yml'),
  'utf8'
);
const contract = JSON.parse(
  readFileSync(
    join(ROOT, 'os-platform', 'core', 'pilot', 'os-production-acceptance-contract.json'),
    'utf8'
  )
);
const acceptanceScriptPath = join(
  ROOT,
  'os-platform',
  'core',
  'pilot',
  'os-production-acceptance-smoke.mjs'
);
const terraforgeScriptPath = join(ROOT, 'scripts', 'terraforge-production-matrix-smoke.mjs');

describe('OS production acceptance contract', () => {
  it('captures the canonical public OS surfaces without parcel-scoped suite proof', () => {
    assert.equal(contract.guardrails.suiteCount, 5);
    assert.equal(contract.guardrails.featureCount, 3);
    assert.equal(contract.guardrails.supportRouteCount, 1);
    assert.equal(contract.suiteRoutes.length, 5);
    assert.equal(contract.featureRoutes.length, 3);
    assert.equal(contract.supportRoutes.length, 1);
    assert.equal(contract.supportRoutes[0].path, '/property?openTab=forge');
    assert.match(contract.guardrails.parcelScopedWorkbenchRouteForbiddenPattern, /^\^\/property\//);
  });

  it('requires authenticated public production smoke and TerraForge sub-proof', () => {
    assert.equal(contract.guardrails.authenticatedPublicProductionSmokeRequired, true);
    assert.equal(contract.guardrails.terraforgeMatrixProofRequired, true);
    assert.ok(existsSync(acceptanceScriptPath));
    assert.ok(existsSync(terraforgeScriptPath));
  });
});

describe('OS production acceptance workflow', () => {
  it('is manual, production-scoped, and checks out the acceptance harness commit', () => {
    assert.ok(workflow.includes('workflow_dispatch:'));
    assert.ok(workflow.includes('environment: production'));
    assert.ok(workflow.includes('ref: ${{ github.sha }}'));
    assert.ok(workflow.includes('persist-credentials: false'));
    assert.ok(workflow.includes('TF_EXPECTED_RELEASE_SHA=%s'));
  });

  it('runs TerraForge proof before the broader OS acceptance smoke', () => {
    assert.ok(
      workflow.includes('test -f os-platform/core/pilot/os-production-acceptance-smoke.mjs')
    );
    assert.ok(workflow.includes('test -f scripts/terraforge-production-matrix-smoke.mjs'));
    assert.ok(workflow.includes('node scripts/terraforge-production-matrix-smoke.mjs'));
    assert.ok(workflow.includes('node os-platform/core/pilot/os-production-acceptance-smoke.mjs'));
    assert.ok(
      workflow.indexOf('node scripts/terraforge-production-matrix-smoke.mjs') <
        workflow.indexOf('node os-platform/core/pilot/os-production-acceptance-smoke.mjs')
    );
  });

  it('restricts production secrets to the trusted production URL and smoke steps only', () => {
    const jobEnvBlock = workflow.match(/jobs:\s+acceptance:[\s\S]*?env:\n([\s\S]*?)\n\s+steps:/)?.[1] ?? '';

    assert.ok(workflow.includes('Production base URL must use https.'));
    assert.ok(
      workflow.includes(
        'base_url must match production PUBLIC_URL before using production secrets.'
      )
    );
    assert.ok(
      workflow.includes(
        'Missing production PUBLIC_URL variable; refusing to run production proof with secrets.'
      )
    );
    assert.doesNotMatch(jobEnvBlock, /TF_PROVISIONED_AUTH_EMAIL/);
    assert.doesNotMatch(jobEnvBlock, /TF_PROVISIONED_AUTH_PASSWORD/);
    assert.match(
      workflow,
      /Run TerraForge production matrix smoke[\s\S]*?env:[\s\S]*?TF_PROVISIONED_AUTH_EMAIL: \$\{\{ secrets\.TF_PROVISIONED_AUTH_EMAIL \}\}/
    );
    assert.match(
      workflow,
      /Run TerraFusion OS production acceptance smoke[\s\S]*?env:[\s\S]*?TF_PROVISIONED_AUTH_PASSWORD: \$\{\{ secrets\.TF_PROVISIONED_AUTH_PASSWORD \}\}/
    );
  });

  it('pins GitHub Actions and disables persisted or implicit package-manager credentials/cache', () => {
    const actionRefs = [...workflow.matchAll(/uses:\s*([^\s#]+)/g)].map(match => match[1]);

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
});

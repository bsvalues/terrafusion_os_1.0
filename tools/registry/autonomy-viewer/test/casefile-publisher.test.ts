/**
 * Phase 4N35 – Casefile Publisher Contract Tests
 * ================================================
 *
 * Validation invariants:
 *   1. Correct triggers (workflow_call only)
 *   2. Minimal permissions (contents: write, id-token: write)
 *   3. Asset naming canonicalization
 *   4. Strict verification hard-gated
 *   5. Immutable URLs only
 *   6. Fail-closed if casefile cannot be generated
 */

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as yaml from 'yaml';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Workflow path
const WORKFLOW_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '.github',
  'workflows',
  'autonomy-casefile-publisher.yml'
);

// Load workflow
function loadWorkflow(): Record<string, unknown> {
  const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
  return yaml.parse(content) as Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Trigger Configuration
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N35 – Casefile Publisher Triggers', () => {
  it('uses workflow_call trigger only', () => {
    const workflow = loadWorkflow();
    assert.ok(workflow.on, 'workflow must have on trigger');

    const triggers = workflow.on as Record<string, unknown>;
    assert.ok(triggers.workflow_call, 'must have workflow_call trigger');

    // Should not have direct triggers like push, pull_request
    assert.strictEqual(triggers.push, undefined, 'should not trigger on push');
    assert.strictEqual(triggers.pull_request, undefined, 'should not trigger on pull_request');
  });

  it('requires release_tag input', () => {
    const workflow = loadWorkflow();
    const triggers = workflow.on as Record<string, unknown>;
    const workflowCall = triggers.workflow_call as Record<string, unknown>;
    const inputs = workflowCall.inputs as Record<string, unknown>;

    assert.ok(inputs.release_tag, 'must have release_tag input');
    const releaseTag = inputs.release_tag as Record<string, unknown>;
    assert.strictEqual(releaseTag.required, true, 'release_tag must be required');
    assert.strictEqual(releaseTag.type, 'string', 'release_tag must be string type');
  });

  it('requires run_id input', () => {
    const workflow = loadWorkflow();
    const triggers = workflow.on as Record<string, unknown>;
    const workflowCall = triggers.workflow_call as Record<string, unknown>;
    const inputs = workflowCall.inputs as Record<string, unknown>;

    assert.ok(inputs.run_id, 'must have run_id input');
    const runId = inputs.run_id as Record<string, unknown>;
    assert.strictEqual(runId.required, true, 'run_id must be required');
    assert.strictEqual(runId.type, 'string', 'run_id must be string type');
  });

  it('requires tier input', () => {
    const workflow = loadWorkflow();
    const triggers = workflow.on as Record<string, unknown>;
    const workflowCall = triggers.workflow_call as Record<string, unknown>;
    const inputs = workflowCall.inputs as Record<string, unknown>;

    assert.ok(inputs.tier, 'must have tier input');
    const tier = inputs.tier as Record<string, unknown>;
    assert.strictEqual(tier.required, true, 'tier must be required');
    assert.strictEqual(tier.type, 'string', 'tier must be string type');
  });

  it('requires evidence_bundle_name input', () => {
    const workflow = loadWorkflow();
    const triggers = workflow.on as Record<string, unknown>;
    const workflowCall = triggers.workflow_call as Record<string, unknown>;
    const inputs = workflowCall.inputs as Record<string, unknown>;

    assert.ok(inputs.evidence_bundle_name, 'must have evidence_bundle_name input');
    const bundleName = inputs.evidence_bundle_name as Record<string, unknown>;
    assert.strictEqual(bundleName.required, true, 'evidence_bundle_name must be required');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Minimal Permissions
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N35 – Casefile Publisher Permissions', () => {
  it('job has contents: write permission', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const permissions = publishJob.permissions as Record<string, unknown>;

    assert.ok(permissions, 'publish job must have permissions');
    assert.strictEqual(permissions.contents, 'write', 'must have contents: write');
  });

  it('job has id-token: write permission for OIDC', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const permissions = publishJob.permissions as Record<string, unknown>;

    assert.strictEqual(permissions['id-token'], 'write', 'must have id-token: write for OIDC');
  });

  it('does not have excessive permissions', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const permissions = publishJob.permissions as Record<string, unknown>;

    // Whitelist of allowed permissions
    const allowedPermissions = ['contents', 'id-token'];
    const actualPermissions = Object.keys(permissions);

    for (const perm of actualPermissions) {
      assert.ok(
        allowedPermissions.includes(perm),
        `unexpected permission: ${perm} (only ${allowedPermissions.join(', ')} allowed)`
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Hard Gates
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N35 – Casefile Publisher Hard Gates', () => {
  it('has verify-bundle step with --strict', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const verifyBundleStep = steps.find(
      s =>
        (s.name as string)?.includes('Verify Evidence Bundle') ||
        (s.run as string)?.includes('verify-bundle')
    );

    assert.ok(verifyBundleStep, 'must have verify-bundle step');
    const run = verifyBundleStep.run as string;
    assert.ok(run.includes('--strict'), 'verify-bundle must use --strict');
    assert.ok(run.includes('--verify-signatures'), 'verify-bundle must use --verify-signatures');
    assert.ok(run.includes('--policy-from-index'), 'verify-bundle must use --policy-from-index');
  });

  it('has verify-custody step with --strict', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const verifyCustodyStep = steps.find(
      s =>
        (s.name as string)?.includes('Verify Custody') ||
        (s.run as string)?.includes('verify-custody')
    );

    assert.ok(verifyCustodyStep, 'must have verify-custody step');
    const run = verifyCustodyStep.run as string;
    assert.ok(run.includes('--strict'), 'verify-custody must use --strict');
    assert.ok(run.includes('--verify-signatures'), 'verify-custody must use --verify-signatures');
  });

  it('has Rekor verification step for merged/incident tiers', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const rekorStep = steps.find(
      s => (s.name as string)?.includes('Rekor') || (s.run as string)?.includes('--verify-rekor')
    );

    assert.ok(rekorStep, 'must have Rekor verification step');

    // Check it's conditional on tier
    const condition = rekorStep.if as string;
    assert.ok(
      condition?.includes('merged') && condition?.includes('incident'),
      'Rekor step should be conditional on merged/incident tier'
    );
  });

  it('exits with error on verification failure', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    // Check that verification steps exit with error on failure
    const verifySteps = steps.filter(
      s => (s.name as string)?.includes('Verify') || (s.name as string)?.includes('Hard Gate')
    );

    for (const step of verifySteps) {
      const run = step.run as string;
      if (run) {
        assert.ok(
          run.includes('exit 1') || run.includes('exit $VERIFY_EXIT'),
          `step "${step.name}" must exit with error on failure`
        );
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Asset Naming
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N35 – Casefile Publisher Asset Naming', () => {
  it('uses canonical casefile naming pattern', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const casefileStep = steps.find(s => (s.name as string)?.includes('Generate Casefile'));

    assert.ok(casefileStep, 'must have casefile generation step');
    const run = casefileStep.run as string;

    // Check canonical naming pattern
    assert.ok(
      run.includes('autonomy-casefile-') && run.includes('-sealed.zip'),
      'must use canonical naming: autonomy-casefile-<runId>-sealed.zip'
    );
  });

  it('uses canonical manifest naming pattern', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const manifestStep = steps.find(s => (s.name as string)?.includes('Extract Casefile Manifest'));

    assert.ok(manifestStep, 'must have manifest extraction step');
    const run = manifestStep.run as string;

    assert.ok(
      run.includes('autonomy-casefile-manifest-'),
      'must use canonical manifest naming: autonomy-casefile-manifest-<runId>.json'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Outputs
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N35 – Casefile Publisher Outputs', () => {
  it('outputs casefile_name', () => {
    const workflow = loadWorkflow();
    const triggers = workflow.on as Record<string, unknown>;
    const workflowCall = triggers.workflow_call as Record<string, unknown>;
    const outputs = workflowCall.outputs as Record<string, unknown>;

    assert.ok(outputs.casefile_name, 'must output casefile_name');
  });

  it('outputs casefile_sha256', () => {
    const workflow = loadWorkflow();
    const triggers = workflow.on as Record<string, unknown>;
    const workflowCall = triggers.workflow_call as Record<string, unknown>;
    const outputs = workflowCall.outputs as Record<string, unknown>;

    assert.ok(outputs.casefile_sha256, 'must output casefile_sha256');
  });

  it('outputs manifest_sha256', () => {
    const workflow = loadWorkflow();
    const triggers = workflow.on as Record<string, unknown>;
    const workflowCall = triggers.workflow_call as Record<string, unknown>;
    const outputs = workflowCall.outputs as Record<string, unknown>;

    assert.ok(outputs.manifest_sha256, 'must output manifest_sha256');
  });

  it('outputs success indicator', () => {
    const workflow = loadWorkflow();
    const triggers = workflow.on as Record<string, unknown>;
    const workflowCall = triggers.workflow_call as Record<string, unknown>;
    const outputs = workflowCall.outputs as Record<string, unknown>;

    assert.ok(outputs.success, 'must output success indicator');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Fail-Closed Behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N35 – Casefile Publisher Fail-Closed', () => {
  it('verifies casefile assets after upload', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const verifyAssetsStep = steps.find(s =>
      (s.name as string)?.includes('Verify Casefile Assets')
    );

    assert.ok(verifyAssetsStep, 'must have asset verification step');
    const run = verifyAssetsStep.run as string;
    assert.ok(run.includes('exit 1'), 'asset verification must fail-closed on missing assets');
  });

  it('sets success=false on casefile generation failure', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const casefileStep = steps.find(s => (s.name as string)?.includes('Generate Casefile'));

    assert.ok(casefileStep, 'must have casefile generation step');
    const run = casefileStep.run as string;
    assert.ok(run.includes('success=false'), 'must set success=false on failure');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Phase 4N36 – Signature Triplet Parity
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N36 – Casefile Signature Triplet Parity', () => {
  it('installs Cosign for keyless signing', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const cosignStep = steps.find(
      s =>
        (s.name as string)?.includes('Install Cosign') ||
        (s.uses as string)?.includes('sigstore/cosign-installer')
    );

    assert.ok(cosignStep, 'must have Cosign installation step');
    const uses = cosignStep.uses as string;
    assert.ok(uses.includes('sigstore/cosign-installer'), 'must use sigstore/cosign-installer');
  });

  it('has casefile signing step (Phase 4N36)', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const signStep = steps.find(s => (s.name as string)?.toLowerCase().includes('sign casefile'));

    assert.ok(signStep, 'must have casefile signing step');
    const run = signStep.run as string;
    assert.ok(run.includes('cosign sign-blob'), 'must use cosign sign-blob');
    assert.ok(run.includes('--bundle'), 'must create .bundle file');
    assert.ok(run.includes('--output-signature'), 'must create .sig file');
    assert.ok(run.includes('--output-certificate'), 'must create .crt file');
  });

  it('signs both casefile ZIP and manifest JSON', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const signStep = steps.find(s => (s.name as string)?.toLowerCase().includes('sign casefile'));

    assert.ok(signStep, 'must have signing step');
    const run = signStep.run as string;
    // Should sign both casefile and manifest
    assert.ok(
      (run.match(/cosign sign-blob/g) || []).length >= 2,
      'must sign both casefile and manifest (2+ cosign sign-blob calls)'
    );
  });

  it('verifies triplet completeness before upload', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const signStep = steps.find(s => (s.name as string)?.toLowerCase().includes('sign casefile'));

    assert.ok(signStep, 'must have signing step');
    const run = signStep.run as string;
    assert.ok(
      run.includes('.sig') && run.includes('.crt') && run.includes('.bundle'),
      'must check for all three triplet files (.sig, .crt, .bundle)'
    );
    assert.ok(run.includes('triplet'), 'must reference triplet concept');
  });

  it('uploads signature triplet for casefile', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const uploadStep = steps.find(s => (s.name as string)?.includes('Upload Casefile'));

    assert.ok(uploadStep, 'must have upload step');
    const run = uploadStep.run as string;
    // Should upload triplet files
    assert.ok(run.includes('.sig'), 'must upload .sig file');
    assert.ok(run.includes('.crt'), 'must upload .crt file');
    assert.ok(run.includes('.bundle'), 'must upload .bundle file');
  });

  it('verifies triplet parity in asset verification', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const verifyStep = steps.find(s => (s.name as string)?.includes('Verify Casefile Assets'));

    assert.ok(verifyStep, 'must have asset verification step');
    const run = verifyStep.run as string;
    // Expected assets should include triplet
    assert.ok(run.includes('.sig"') || run.includes('.sig}'), 'expected assets must include .sig');
    assert.ok(run.includes('.crt"') || run.includes('.crt}'), 'expected assets must include .crt');
    assert.ok(
      run.includes('.bundle"') || run.includes('.bundle}'),
      'expected assets must include .bundle'
    );
  });

  it('outputs signed status', () => {
    const workflow = loadWorkflow();
    const triggers = workflow.on as Record<string, unknown>;
    const workflowCall = triggers.workflow_call as Record<string, unknown>;
    const outputs = workflowCall.outputs as Record<string, unknown>;

    assert.ok(outputs.signed, 'must output signed status');
  });

  it('fails-closed on signature triplet incompleteness', () => {
    const workflow = loadWorkflow();
    const jobs = workflow.jobs as Record<string, unknown>;
    const publishJob = jobs.publish as Record<string, unknown>;
    const steps = publishJob.steps as Array<Record<string, unknown>>;

    const signStep = steps.find(s => (s.name as string)?.toLowerCase().includes('sign casefile'));

    assert.ok(signStep, 'must have signing step');
    const run = signStep.run as string;
    // Should exit 1 if triplet incomplete
    assert.ok(run.includes('exit 1'), 'must fail-closed if triplet incomplete');
  });
});

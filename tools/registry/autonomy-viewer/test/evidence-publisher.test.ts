/**
 * Evidence Publisher Contract Tests (Phase 4N8)
 *
 * These tests validate the contract for the autonomy-evidence-publisher workflow.
 * The workflow is YAML-based but these tests ensure the logic and expectations
 * are documented as executable contracts.
 *
 * SECURITY CONTRACTS (Non-negotiable):
 * - Only runs on merged PRs to main
 * - Requires strict verification before publish
 * - Release naming scheme is stable and predictable
 * - No elevated permissions beyond contents:write
 */

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as yaml from 'yaml';

// =============================================================================
// Test Fixtures
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKFLOW_PATH = path.resolve(
  __dirname,
  '../../../../.github/workflows/autonomy-evidence-publisher.yml'
);

interface WorkflowYaml {
  name: string;
  on: {
    pull_request?: {
      types?: string[];
      branches?: string[];
    };
    push?: {
      branches?: string[];
    };
  };
  jobs: {
    [key: string]: {
      permissions?: Record<string, string>;
      if?: string;
      needs?: string[];
      steps?: Array<{
        name?: string;
        run?: string;
        uses?: string;
        with?: Record<string, unknown>;
      }>;
    };
  };
  env?: Record<string, string>;
}

function loadWorkflow(): WorkflowYaml {
  const content = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
  return yaml.parse(content) as WorkflowYaml;
}

// =============================================================================
// Contract: Workflow Trigger Conditions
// =============================================================================

describe('Evidence Publisher: Trigger Contracts', () => {
  it('should trigger on pull_request closed event', () => {
    const workflow = loadWorkflow();
    const trigger = workflow.on.pull_request;

    assert.ok(trigger, 'pull_request trigger must be defined');
    assert.ok(trigger.types?.includes('closed'), 'must trigger on closed event');
  });

  it('should only trigger for main branch', () => {
    const workflow = loadWorkflow();
    const trigger = workflow.on.pull_request;

    assert.ok(trigger?.branches?.includes('main'), 'must only trigger for main branch');
  });

  it('should have gate job that checks merged condition', () => {
    const workflow = loadWorkflow();
    const gateJob = workflow.jobs.gate;

    assert.ok(gateJob, 'gate job must exist');
    assert.ok(gateJob.if?.includes('merged'), 'gate job must check merged condition');
    assert.ok(gateJob.if?.includes('true'), 'gate job must require merged == true');
  });
});

// =============================================================================
// Contract: Security Posture
// =============================================================================

describe('Evidence Publisher: Security Contracts', () => {
  it('should have minimal permissions (contents:write, pull-requests:read)', () => {
    const workflow = loadWorkflow();
    const publishJob = workflow.jobs.publish;

    assert.ok(publishJob?.permissions, 'publish job must define permissions');
    assert.strictEqual(
      publishJob.permissions?.contents,
      'write',
      'must have contents:write for releases'
    );
    assert.strictEqual(
      publishJob.permissions?.['pull-requests'],
      'read',
      'must have pull-requests:read only'
    );

    // Must NOT have elevated permissions (except id-token for keyless signing)
    assert.ok(
      !publishJob.permissions?.actions || publishJob.permissions.actions === 'read',
      'must not have actions:write'
    );
    assert.ok(
      !publishJob.permissions?.packages || publishJob.permissions.packages === 'read',
      'must not have packages:write'
    );
    // Phase 4N16: id-token:write is REQUIRED for keyless OIDC signing
    assert.strictEqual(
      publishJob.permissions?.['id-token'],
      'write',
      'must have id-token:write for keyless signing (Phase 4N16)'
    );
  });

  it('publish job should depend on gate job', () => {
    const workflow = loadWorkflow();
    const publishJob = workflow.jobs.publish;

    assert.ok(publishJob?.needs?.includes('gate'), 'publish must depend on gate job');
  });

  it('publish job should only run if gate outputs should_publish=true', () => {
    const workflow = loadWorkflow();
    const publishJob = workflow.jobs.publish;

    assert.ok(publishJob?.if?.includes('should_publish'), 'must check gate output');
    assert.ok(
      publishJob.if?.includes("'true'") || publishJob.if?.includes('true'),
      'must require should_publish == true'
    );
  });
});

// =============================================================================
// Contract: Verification Before Publish
// =============================================================================

describe('Evidence Publisher: Verification Contracts', () => {
  it('should have a verify step before release step', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const verifyIndex = steps.findIndex(s => s.name?.toLowerCase().includes('verify'));
    const releaseIndex = steps.findIndex(s => s.name?.toLowerCase().includes('release'));

    assert.ok(verifyIndex >= 0, 'must have verify step');
    assert.ok(releaseIndex >= 0, 'must have release step');
    assert.ok(verifyIndex < releaseIndex, 'verify step must come before release step');
  });

  it('verify step should use strict mode', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const verifyStep = steps.find(s => s.name?.toLowerCase().includes('verify'));
    assert.ok(verifyStep?.run?.includes('--strict'), 'verify step must use --strict flag');
  });

  it('verify step should fail the workflow on verification failure', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const verifyStep = steps.find(s => s.name?.toLowerCase().includes('verify'));
    assert.ok(verifyStep?.run?.includes('exit 1'), 'verify step must exit 1 on failure');
  });
});

// =============================================================================
// Contract: Release Naming Scheme
// =============================================================================

describe('Evidence Publisher: Release Naming Contracts', () => {
  it('should use autonomy-evidence/ tag namespace', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.gate?.steps ?? [];

    const checkStep = steps.find(s => s.id === 'check');
    const releaseTagLine = checkStep?.run?.match(/RELEASE_TAG=["']?([^"'\n]+)["']?/);

    assert.ok(releaseTagLine, 'must define RELEASE_TAG');
    assert.ok(
      releaseTagLine[1].includes('autonomy-evidence/'),
      'release tag must use autonomy-evidence/ namespace'
    );
  });

  it('should use YYYY-MM format for monthly rollup', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.gate?.steps ?? [];

    const checkStep = steps.find(s => s.id === 'check');
    assert.ok(checkStep?.run?.includes('%Y-%m'), 'release tag should use YYYY-MM format');
  });

  it('bundle name should include run_id', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const bundleStep = steps.find(s => s.id === 'bundle');
    assert.ok(
      bundleStep?.run?.includes('run_id'),
      'bundle name must include run_id for uniqueness'
    );
  });
});

// =============================================================================
// Contract: Required Assets
// =============================================================================

describe('Evidence Publisher: Asset Contracts', () => {
  it('should publish evidence bundle ZIP', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const assetsStep = steps.find(
      s => s.name?.toLowerCase().includes('prepare') && s.name?.toLowerCase().includes('asset')
    );
    // bundle_path variable contains the .zip path from bundle step
    assert.ok(
      assetsStep?.run?.includes('bundle_path') || assetsStep?.run?.includes('.zip'),
      'must include ZIP bundle in assets (via bundle_path or .zip)'
    );
  });

  it('should publish manifest JSON', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const assetsStep = steps.find(
      s => s.name?.toLowerCase().includes('prepare') && s.name?.toLowerCase().includes('asset')
    );
    assert.ok(
      assetsStep?.run?.includes('manifest.json') || assetsStep?.run?.includes('MANIFEST.json'),
      'must include manifest in assets'
    );
  });

  it('should publish evidence index JSON', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const assetsStep = steps.find(
      s => s.name?.toLowerCase().includes('prepare') && s.name?.toLowerCase().includes('asset')
    );
    assert.ok(assetsStep?.run?.includes('evidence-index'), 'must include evidence index in assets');
  });

  it('should publish dashboard HTML', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const assetsStep = steps.find(
      s => s.name?.toLowerCase().includes('prepare') && s.name?.toLowerCase().includes('asset')
    );
    assert.ok(
      assetsStep?.run?.includes('dashboard') && assetsStep?.run?.includes('.html'),
      'must include dashboard HTML in assets'
    );
  });
});

// =============================================================================
// Contract: Release Action Configuration
// =============================================================================

describe('Evidence Publisher: Release Action Contracts', () => {
  it('should use softprops/action-gh-release', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    assert.ok(releaseStep, 'must use action-gh-release');
    assert.ok(
      releaseStep.uses?.includes('softprops/action-gh-release'),
      'must use softprops/action-gh-release'
    );
  });

  it('release should not be draft', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    assert.strictEqual(releaseStep?.with?.draft, false, 'release must not be a draft');
  });

  it('release should not be prerelease', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    assert.strictEqual(releaseStep?.with?.prerelease, false, 'release must not be a prerelease');
  });

  it('release body should include verify command', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    const body = releaseStep?.with?.body as string | undefined;

    assert.ok(body?.includes('perf:verify-bundle'), 'release body must include verify command');
  });

  it('release body should mention retention tier', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    const body = releaseStep?.with?.body as string | undefined;

    assert.ok(body?.includes('1 year'), 'release body must mention 1-year retention');
  });
});

// =============================================================================
// Contract: No Tier 1 Flags in Apply Paths
// =============================================================================

describe('Evidence Publisher: Tier 1 Safety Contracts', () => {
  it('should not use --force in any step', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    for (const step of steps) {
      if (step.run) {
        assert.ok(!step.run.includes('--force'), `step "${step.name}" must not use --force flag`);
      }
    }
  });

  it('should not use OVERRIDE_ environment variables', () => {
    const workflow = loadWorkflow();

    // Check global env
    if (workflow.env) {
      for (const key of Object.keys(workflow.env)) {
        assert.ok(!key.startsWith('OVERRIDE_'), `env "${key}" must not be an OVERRIDE_ variable`);
      }
    }

    // Check step runs
    const steps = workflow.jobs.publish?.steps ?? [];
    for (const step of steps) {
      if (step.run) {
        assert.ok(
          !step.run.includes('OVERRIDE_'),
          `step "${step.name}" must not set OVERRIDE_ variables`
        );
      }
    }
  });

  it('should not skip verification with exit 0 tricks', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const verifyStep = steps.find(s => s.name?.toLowerCase().includes('verify'));
    if (verifyStep?.run) {
      // Check that failure path still exits with non-zero
      assert.ok(
        !verifyStep.run.match(/exit 0.*verify/i),
        'verify step must not exit 0 before verification'
      );
    }
  });
});

// =============================================================================
// Contract: Checkout Configuration
// =============================================================================

describe('Evidence Publisher: Checkout Contracts', () => {
  it('should checkout main branch explicitly', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const checkoutStep = steps.find(s => s.uses?.includes('actions/checkout'));
    assert.ok(checkoutStep?.with?.ref === 'main', 'checkout must explicitly use ref: main');
  });

  it('should use shallow clone (fetch-depth: 1)', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const checkoutStep = steps.find(s => s.uses?.includes('actions/checkout'));
    assert.strictEqual(
      checkoutStep?.with?.['fetch-depth'],
      1,
      'checkout should use fetch-depth: 1 for speed'
    );
  });
});

// =============================================================================
// Contract: Workflow Metadata
// =============================================================================

describe('Evidence Publisher: Metadata Contracts', () => {
  it('should have descriptive name', () => {
    const workflow = loadWorkflow();
    assert.ok(workflow.name.includes('Evidence'), 'workflow name must include "Evidence"');
  });

  it('should have concurrency group to prevent parallel runs', () => {
    const workflowContent = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
    assert.ok(
      workflowContent.includes('concurrency'),
      'workflow must define concurrency to prevent parallel runs'
    );
  });
});

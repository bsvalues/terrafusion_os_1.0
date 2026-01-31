/**
 * Incident Publisher Contract Tests (Phase 4N9)
 *
 * These tests validate the contract for the autonomy-incident-publisher workflow.
 * The workflow promotes evidence bundles to 7-year incident retention when the
 * 'incident' label is applied to a merged PR.
 *
 * SECURITY CONTRACTS (Non-negotiable):
 * - Only runs on merged PRs to main with 'incident' label
 * - Requires strict verification before publish
 * - Release naming scheme is stable and predictable
 * - No elevated permissions beyond contents:write
 * - Never modifies original monthly release
 */

import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'yaml';

// =============================================================================
// Test Fixtures
// =============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKFLOW_PATH = path.resolve(__dirname, '../../../../.github/workflows/autonomy-incident-publisher.yml');

interface WorkflowYaml {
  name: string;
  on: {
    pull_request?: {
      types?: string[];
      branches?: string[];
    };
  };
  jobs: {
    [key: string]: {
      permissions?: Record<string, string>;
      if?: string;
      needs?: string[];
      outputs?: Record<string, string>;
      steps?: Array<{
        id?: string;
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

describe('Incident Publisher: Trigger Contracts', () => {
  it('should trigger on pull_request closed event', () => {
    const workflow = loadWorkflow();
    const trigger = workflow.on.pull_request;

    assert.ok(trigger, 'pull_request trigger must be defined');
    assert.ok(trigger.types?.includes('closed'), 'must trigger on closed event');
  });

  it('should trigger on pull_request labeled event (retroactive promotion)', () => {
    const workflow = loadWorkflow();
    const trigger = workflow.on.pull_request;

    assert.ok(trigger?.types?.includes('labeled'),
      'must trigger on labeled event for retroactive incident promotion');
  });

  it('should only trigger for main branch', () => {
    const workflow = loadWorkflow();
    const trigger = workflow.on.pull_request;

    assert.ok(trigger?.branches?.includes('main'), 'must only trigger for main branch');
  });

  it('should have gate job that checks merged AND incident label conditions', () => {
    const workflow = loadWorkflow();
    const gateJob = workflow.jobs.gate;

    assert.ok(gateJob, 'gate job must exist');

    // Find the check step
    const checkStep = gateJob.steps?.find(s => s.id === 'check');
    assert.ok(checkStep?.run?.includes('merged'), 'gate must check merged condition');
    assert.ok(checkStep?.run?.includes('incident'), 'gate must check incident label');
  });
});

// =============================================================================
// Contract: Incident Label Detection
// =============================================================================

describe('Incident Publisher: Label Detection Contracts', () => {
  it('should use canonical "incident" label name', () => {
    const workflow = loadWorkflow();
    const env = workflow.env;

    assert.strictEqual(env?.INCIDENT_LABEL, 'incident',
      'must use canonical "incident" label name');
  });

  it('gate should skip if incident label is not present', () => {
    const workflow = loadWorkflow();
    const gateJob = workflow.jobs.gate;
    const checkStep = gateJob?.steps?.find(s => s.id === 'check');

    assert.ok(checkStep?.run?.includes('should_publish=false'),
      'must output should_publish=false when label missing');
    assert.ok(checkStep?.run?.includes('incident'),
      'must check for incident label specifically');
  });
});

// =============================================================================
// Contract: Security Posture
// =============================================================================

describe('Incident Publisher: Security Contracts', () => {
  it('should have minimal permissions (contents:write, pull-requests:read)', () => {
    const workflow = loadWorkflow();
    const publishJob = workflow.jobs.publish;

    assert.ok(publishJob?.permissions, 'publish job must define permissions');
    assert.strictEqual(publishJob.permissions?.contents, 'write', 'must have contents:write for releases');
    assert.strictEqual(publishJob.permissions?.['pull-requests'], 'read', 'must have pull-requests:read only');

    // Must NOT have elevated permissions
    assert.ok(!publishJob.permissions?.actions || publishJob.permissions.actions === 'read',
      'must not have actions:write');
    assert.ok(!publishJob.permissions?.packages || publishJob.permissions.packages === 'read',
      'must not have packages:write');
    assert.ok(!publishJob.permissions?.['id-token'],
      'must not request id-token (OIDC)');
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
    assert.ok(publishJob.if?.includes("'true'") || publishJob.if?.includes('true'),
      'must require should_publish == true');
  });
});

// =============================================================================
// Contract: Verification Before Publish
// =============================================================================

describe('Incident Publisher: Verification Contracts', () => {
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
// Contract: Incident Release Naming Scheme
// =============================================================================

describe('Incident Publisher: Release Naming Contracts', () => {
  it('should use autonomy-incident/ tag namespace', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.gate?.steps ?? [];

    const checkStep = steps.find(s => s.id === 'check');
    assert.ok(checkStep?.run?.includes('autonomy-incident/'),
      'release tag must use autonomy-incident/ namespace');
  });

  it('should use yearly format for 7-year incident tier', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.gate?.steps ?? [];

    const checkStep = steps.find(s => s.id === 'check');
    // Should use %Y not %Y-%m for yearly rollup
    assert.ok(checkStep?.run?.includes('%Y'),
      'release tag should use yearly format');
  });

  it('bundle name should include PR number for incident traceability', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const bundleStep = steps.find(s => s.id === 'bundle');
    assert.ok(bundleStep?.run?.includes('PR_NUMBER') || bundleStep?.run?.includes('pr_number'),
      'bundle name must include PR number for incident traceability');
  });
});

// =============================================================================
// Contract: Required Assets
// =============================================================================

describe('Incident Publisher: Asset Contracts', () => {
  it('should publish incident evidence bundle ZIP', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const assetsStep = steps.find(s => s.name?.toLowerCase().includes('prepare') &&
                                       s.name?.toLowerCase().includes('incident'));
    assert.ok(assetsStep?.run?.includes('bundle_path') || assetsStep?.run?.includes('.zip'),
      'must include incident ZIP bundle in assets');
  });

  it('should publish incident manifest JSON', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const assetsStep = steps.find(s => s.name?.toLowerCase().includes('prepare') &&
                                       s.name?.toLowerCase().includes('incident'));
    assert.ok(assetsStep?.run?.includes('manifest'),
      'must include incident manifest in assets');
  });

  it('should publish incident evidence index JSON', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const assetsStep = steps.find(s => s.name?.toLowerCase().includes('prepare') &&
                                       s.name?.toLowerCase().includes('incident'));
    assert.ok(assetsStep?.run?.includes('index'),
      'must include incident evidence index in assets');
  });

  it('should publish incident dashboard HTML', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const assetsStep = steps.find(s => s.name?.toLowerCase().includes('prepare') &&
                                       s.name?.toLowerCase().includes('incident'));
    assert.ok(assetsStep?.run?.includes('dashboard') &&
              assetsStep?.run?.includes('.html'),
      'must include incident dashboard HTML in assets');
  });
});

// =============================================================================
// Contract: Release Action Configuration
// =============================================================================

describe('Incident Publisher: Release Action Contracts', () => {
  it('should use softprops/action-gh-release', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    assert.ok(releaseStep, 'must use action-gh-release');
    assert.ok(releaseStep.uses?.includes('softprops/action-gh-release'),
      'must use softprops/action-gh-release');
  });

  it('release should not be draft', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    assert.strictEqual(releaseStep?.with?.draft, false,
      'incident release must not be a draft');
  });

  it('release should not be prerelease', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    assert.strictEqual(releaseStep?.with?.prerelease, false,
      'incident release must not be a prerelease');
  });

  it('release body should include verify command', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    const body = releaseStep?.with?.body as string | undefined;

    assert.ok(body?.includes('perf:verify-bundle'),
      'incident release body must include verify command');
  });

  it('release body should mention 7-year retention', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    const body = releaseStep?.with?.body as string | undefined;

    assert.ok(body?.includes('7 year'),
      'incident release body must mention 7-year retention');
  });

  it('release body should include rollback command', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const releaseStep = steps.find(s => s.uses?.includes('action-gh-release'));
    const body = releaseStep?.with?.body as string | undefined;

    assert.ok(body?.includes('perf:rollback'),
      'incident release body must include rollback command');
  });
});

// =============================================================================
// Contract: Evidence Index Incident Fields
// =============================================================================

describe('Incident Publisher: Evidence Index Contracts', () => {
  it('should generate evidence index with incident flag', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const indexStep = steps.find(s => s.name?.toLowerCase().includes('evidence index'));
    assert.ok(indexStep?.run?.includes('--incident'),
      'must generate index with --incident flag');
  });

  it('should set retention tier to incident', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const indexStep = steps.find(s => s.name?.toLowerCase().includes('evidence index'));
    assert.ok(indexStep?.run?.includes('--retention-tier') &&
              indexStep?.run?.includes('incident'),
      'must set retention tier to incident');
  });

  it('should include incident PR number', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const indexStep = steps.find(s => s.name?.toLowerCase().includes('evidence index'));
    assert.ok(indexStep?.run?.includes('--incident-pr'),
      'must include incident PR number in index');
  });
});

// =============================================================================
// Contract: No Tier 1 Flags in Apply Paths
// =============================================================================

describe('Incident Publisher: Tier 1 Safety Contracts', () => {
  it('should not use --force in any step', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    for (const step of steps) {
      if (step.run) {
        assert.ok(!step.run.includes('--force'),
          `step "${step.name}" must not use --force flag`);
      }
    }
  });

  it('should not use OVERRIDE_ environment variables', () => {
    const workflow = loadWorkflow();

    // Check global env
    if (workflow.env) {
      for (const key of Object.keys(workflow.env)) {
        assert.ok(!key.startsWith('OVERRIDE_'),
          `env "${key}" must not be an OVERRIDE_ variable`);
      }
    }

    // Check step runs
    const steps = workflow.jobs.publish?.steps ?? [];
    for (const step of steps) {
      if (step.run) {
        assert.ok(!step.run.includes('OVERRIDE_'),
          `step "${step.name}" must not set OVERRIDE_ variables`);
      }
    }
  });

  it('should not skip verification with exit 0 tricks', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const verifyStep = steps.find(s => s.name?.toLowerCase().includes('verify'));
    if (verifyStep?.run) {
      assert.ok(!verifyStep.run.match(/exit 0.*verify/i),
        'verify step must not exit 0 before verification');
    }
  });
});

// =============================================================================
// Contract: Checkout Configuration
// =============================================================================

describe('Incident Publisher: Checkout Contracts', () => {
  it('should checkout main branch explicitly', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const checkoutStep = steps.find(s => s.uses?.includes('actions/checkout'));
    assert.ok(checkoutStep?.with?.ref === 'main',
      'checkout must explicitly use ref: main');
  });

  it('should use shallow clone (fetch-depth: 1)', () => {
    const workflow = loadWorkflow();
    const steps = workflow.jobs.publish?.steps ?? [];

    const checkoutStep = steps.find(s => s.uses?.includes('actions/checkout'));
    assert.strictEqual(checkoutStep?.with?.['fetch-depth'], 1,
      'checkout should use fetch-depth: 1 for speed');
  });
});

// =============================================================================
// Contract: Workflow Metadata
// =============================================================================

describe('Incident Publisher: Metadata Contracts', () => {
  it('should have descriptive name including "Incident"', () => {
    const workflow = loadWorkflow();
    assert.ok(workflow.name.includes('Incident'),
      'workflow name must include "Incident"');
  });

  it('should have concurrency group to prevent parallel runs for same PR', () => {
    const workflowContent = fs.readFileSync(WORKFLOW_PATH, 'utf-8');
    assert.ok(workflowContent.includes('concurrency'),
      'workflow must define concurrency to prevent parallel runs');
    assert.ok(workflowContent.includes('pull_request.number'),
      'concurrency group should include PR number');
  });
});

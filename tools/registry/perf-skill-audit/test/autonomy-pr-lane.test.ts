/**
 * Phase 4N0 — Autonomy PR Lane Contract Tests
 *
 * Validates workflow invariants for the autonomy-pr-lane.yml workflow.
 * These tests ensure governance compliance without requiring workflow execution.
 */

import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as yaml from 'yaml';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the workflow file
const WORKFLOW_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '.github',
  'workflows',
  'autonomy-pr-lane.yml'
);

function loadWorkflow(): any {
  if (!fs.existsSync(WORKFLOW_PATH)) {
    throw new Error(`Workflow not found: ${WORKFLOW_PATH}`);
  }
  const content = fs.readFileSync(WORKFLOW_PATH, 'utf8');
  return yaml.parse(content);
}

console.log('✅ Phase 4N0 autonomy PR lane contract tests loaded');

describe('Phase 4N0 — Autonomy PR Lane Contract', () => {
  test('Workflow file exists', () => {
    assert.ok(fs.existsSync(WORKFLOW_PATH), 'autonomy-pr-lane.yml must exist');
  });

  test('Workflow has correct name', () => {
    const workflow = loadWorkflow();
    assert.ok(workflow.name?.includes('Autonomy'), 'Workflow name must include "Autonomy"');
  });

  test('Workflow has concurrency with cancel-in-progress', () => {
    const workflow = loadWorkflow();
    assert.ok(workflow.concurrency, 'Workflow must have concurrency settings');
    assert.equal(
      workflow.concurrency['cancel-in-progress'],
      true,
      'Concurrency must have cancel-in-progress: true'
    );
  });

  test('Workflow triggers include workflow_dispatch', () => {
    const workflow = loadWorkflow();
    assert.ok(workflow.on?.workflow_dispatch, 'Must support manual dispatch');
  });

  test('Workflow triggers include schedule', () => {
    const workflow = loadWorkflow();
    assert.ok(workflow.on?.schedule, 'Must have scheduled trigger');
    assert.ok(workflow.on.schedule.length > 0, 'Must have at least one cron schedule');
  });

  test('Gate check job exists and blocks protected branches', () => {
    const workflow = loadWorkflow();
    const gateJob = workflow.jobs?.gate_check;
    assert.ok(gateJob, 'gate_check job must exist');

    // Check that the job has steps that validate branch
    const steps = gateJob.steps || [];
    const checkStep = steps.find(
      (s: any) => s.id === 'check' || s.name?.includes('branch governance')
    );
    assert.ok(checkStep, 'Must have branch governance check step');

    // Verify the step references main/master
    const run = checkStep.run || '';
    assert.ok(run.includes('main'), 'Step must check for main branch');
    assert.ok(run.includes('master'), 'Step must check for master branch');
  });

  test('Autonomy apply job has write permissions', () => {
    const workflow = loadWorkflow();
    const applyJob = workflow.jobs?.autonomy_apply;
    assert.ok(applyJob, 'autonomy_apply job must exist');
    assert.ok(applyJob.permissions, 'Job must specify permissions');
    assert.equal(applyJob.permissions.contents, 'write', 'Must have contents: write permission');
    assert.equal(
      applyJob.permissions['pull-requests'],
      'write',
      'Must have pull-requests: write permission'
    );
  });

  test('Autonomy apply job uses --max=1', () => {
    const workflow = loadWorkflow();
    const applyJob = workflow.jobs?.autonomy_apply;
    assert.ok(applyJob, 'autonomy_apply job must exist');

    const steps = applyJob.steps || [];
    const applyStep = steps.find((s: any) => s.id === 'apply' || s.name?.includes('ralph-apply'));
    assert.ok(applyStep, 'Must have ralph-apply step');

    const run = applyStep.run || '';
    assert.ok(run.includes('--max=1'), 'Must use --max=1 flag');
  });

  test('Autonomy apply job uses --emit-proof', () => {
    const workflow = loadWorkflow();
    const applyJob = workflow.jobs?.autonomy_apply;
    const steps = applyJob?.steps || [];
    const applyStep = steps.find((s: any) => s.id === 'apply' || s.name?.includes('ralph-apply'));

    const run = applyStep?.run || '';
    assert.ok(run.includes('--emit-proof'), 'Must use --emit-proof flag');
  });

  test('Autonomy apply job does NOT use --enable-tier1', () => {
    const workflow = loadWorkflow();
    const applyJob = workflow.jobs?.autonomy_apply;
    const steps = applyJob?.steps || [];
    const applyStep = steps.find((s: any) => s.id === 'apply' || s.name?.includes('ralph-apply'));

    const run = applyStep?.run || '';
    assert.ok(!run.includes('--enable-tier1'), 'Must NOT use --enable-tier1 flag (Tier 0 only)');
  });

  test('Open PR job has conditional on outcome=applied', () => {
    const workflow = loadWorkflow();
    const prJob = workflow.jobs?.open_pr;
    assert.ok(prJob, 'open_pr job must exist');

    const ifCondition = prJob.if || '';
    assert.ok(ifCondition.includes('applied'), 'PR job must only run when outcome=applied');
  });

  test('Artifacts are uploaded even on failure', () => {
    const workflow = loadWorkflow();
    const applyJob = workflow.jobs?.autonomy_apply;
    const steps = applyJob?.steps || [];

    const uploadStep = steps.find((s: any) => s.name?.toLowerCase().includes('upload'));
    assert.ok(uploadStep, 'Must have artifact upload step');
    assert.equal(uploadStep.if, 'always()', 'Upload must run on always()');
  });

  test('Workflow has summary job', () => {
    const workflow = loadWorkflow();
    assert.ok(workflow.jobs?.summary, 'summary job must exist');
  });

  test('Dependabot actor is skipped', () => {
    const workflow = loadWorkflow();
    const gateJob = workflow.jobs?.gate_check;
    const steps = gateJob?.steps || [];
    const checkStep = steps.find((s: any) => s.id === 'check');

    const run = checkStep?.run || '';
    assert.ok(run.includes('dependabot'), 'Must skip dependabot actor');
  });

  test('Snyk branches are skipped', () => {
    const workflow = loadWorkflow();
    const gateJob = workflow.jobs?.gate_check;
    const steps = gateJob?.steps || [];
    const checkStep = steps.find((s: any) => s.id === 'check');

    const run = checkStep?.run || '';
    assert.ok(run.includes('snyk-'), 'Must skip snyk branches');
  });

  test('PR is created with governance labels', () => {
    const workflow = loadWorkflow();
    const prJob = workflow.jobs?.open_pr;
    const steps = prJob?.steps || [];

    const createPrStep = steps.find((s: any) => s.uses?.includes('create-pull-request'));
    assert.ok(createPrStep, 'Must use create-pull-request action');

    const labels = createPrStep.with?.labels || '';
    assert.ok(labels.includes('autonomy'), 'PR must have autonomy label');
    assert.ok(labels.includes('tier-0'), 'PR must have tier-0 label');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Phase 4N2: PR Body "Change Capsule" Contract Tests
  // ─────────────────────────────────────────────────────────────────────────────

  test('PR body contains pnpm perf:rollback command', () => {
    const workflow = loadWorkflow();
    const prJob = workflow.jobs?.open_pr;
    const steps = prJob?.steps || [];

    const bodyStep = steps.find((s: any) => s.id === 'pr_body' || s.name?.includes('PR body'));
    assert.ok(bodyStep, 'Must have PR body creation step');

    const run = bodyStep.run || '';
    assert.ok(
      run.includes('pnpm perf:rollback'),
      'PR body must include pnpm perf:rollback command'
    );
  });

  test('PR body contains dry-run rollback command', () => {
    const workflow = loadWorkflow();
    const prJob = workflow.jobs?.open_pr;
    const steps = prJob?.steps || [];

    const bodyStep = steps.find((s: any) => s.id === 'pr_body' || s.name?.includes('PR body'));
    const run = bodyStep?.run || '';

    assert.ok(
      run.includes('--dry-run'),
      'PR body must include --dry-run rollback command for preview'
    );
  });

  test('PR body contains post-rollback gates', () => {
    const workflow = loadWorkflow();
    const prJob = workflow.jobs?.open_pr;
    const steps = prJob?.steps || [];

    const bodyStep = steps.find((s: any) => s.id === 'pr_body' || s.name?.includes('PR body'));
    const run = bodyStep?.run || '';

    assert.ok(run.includes('type-check'), 'PR body must reference type-check gate');
    assert.ok(
      run.includes('phase83-tools'),
      'PR body must reference phase83-tools gate'
    );
  });

  test('PR body contains "What Autonomy Will NOT Do" section', () => {
    const workflow = loadWorkflow();
    const prJob = workflow.jobs?.open_pr;
    const steps = prJob?.steps || [];

    const bodyStep = steps.find((s: any) => s.id === 'pr_body' || s.name?.includes('PR body'));
    const run = bodyStep?.run || '';

    assert.ok(
      run.includes('Will NOT Do') || run.includes('will NOT do'),
      'PR body must include "What Autonomy Will NOT Do" section'
    );
  });

  test('PR body explains proof artifacts and their purpose', () => {
    const workflow = loadWorkflow();
    const prJob = workflow.jobs?.open_pr;
    const steps = prJob?.steps || [];

    const bodyStep = steps.find((s: any) => s.id === 'pr_body' || s.name?.includes('PR body'));
    const run = bodyStep?.run || '';

    assert.ok(run.includes('apply-proofs.json'), 'PR body must reference apply-proofs.json');
    assert.ok(run.includes('autonomy-report.json'), 'PR body must reference autonomy-report.json');
    assert.ok(run.includes('perf.plan.json'), 'PR body must reference perf.plan.json');
  });

  test('PR body references --proof flag with plan item ID', () => {
    const workflow = loadWorkflow();
    const prJob = workflow.jobs?.open_pr;
    const steps = prJob?.steps || [];

    const bodyStep = steps.find((s: any) => s.id === 'pr_body' || s.name?.includes('PR body'));
    const run = bodyStep?.run || '';

    assert.ok(
      run.includes('--proof') && run.includes('plan_item_id'),
      'PR body must use --proof flag with dynamic plan_item_id'
    );
  });
});

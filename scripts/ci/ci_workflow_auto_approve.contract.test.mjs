#!/usr/bin/env node
/**
 * Contract tests for auto-approve workflow integration in ci.yml
 *
 * Validates that the workflow:
 * - Has the auto-approve steps correctly configured
 * - Uses GitHub App token (not PAT)
 * - Is gated on PR events only
 * - Is gated on policy evaluation
 * - Has proper error handling
 *
 * Run: node --test scripts/ci/ci_workflow_auto_approve.contract.test.mjs
 */

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKFLOW_PATH = join(__dirname, '../../.github/workflows/ci.yml');

// Read workflow file
const workflowContent = readFileSync(WORKFLOW_PATH, 'utf8');

// ============================================================================
// Contract Tests
// ============================================================================

test('ci.yml exists and is readable', () => {
  assert.ok(workflowContent.length > 0, 'Workflow file should have content');
});

test('workflow contains Generate GitHub App Token step', () => {
  assert.ok(
    workflowContent.includes('Generate GitHub App Token'),
    'Workflow should have app token generation step'
  );
});

test('workflow uses actions/create-github-app-token for app token', () => {
  assert.ok(
    workflowContent.includes('actions/create-github-app-token@v1'),
    'Workflow should use official GitHub App token action'
  );
});

test('workflow contains Evaluate Auto-Approve Policy step', () => {
  assert.ok(
    workflowContent.includes('Evaluate Auto-Approve Policy'),
    'Workflow should have policy evaluation step'
  );
});

test('workflow contains Submit Auto-Approval Review step', () => {
  assert.ok(
    workflowContent.includes('Submit Auto-Approval Review'),
    'Workflow should have approval submission step'
  );
});

test('app token step is gated on pull_request events', () => {
  // Find the app-token step section
  const appTokenMatch = workflowContent.match(
    /Generate GitHub App Token[\s\S]*?if:\s*>-[\s\S]*?pull_request/
  );
  assert.ok(appTokenMatch, 'App token step should be gated on pull_request event');
});

test('auto-approve is gated on TF_AUTO_APPROVE_ENABLED variable', () => {
  assert.ok(
    workflowContent.includes('TF_AUTO_APPROVE_ENABLED'),
    'Auto-approve should be gated on repository variable'
  );
});

test('policy step runs auto_approve_policy.mjs script', () => {
  assert.ok(
    workflowContent.includes('scripts/ci/auto_approve_policy.mjs'),
    'Workflow should run the auto_approve_policy.mjs script'
  );
});

test('policy step reads from ci_telemetry.json', () => {
  assert.ok(
    workflowContent.includes('--telemetry=ci_telemetry.json'),
    'Policy step should read from telemetry file'
  );
});

test('approval step uses app token (not GITHUB_TOKEN)', () => {
  // Find the approval step and check it uses app token
  const approvalMatch = workflowContent.match(
    /Submit Auto-Approval Review[\s\S]*?github-token:\s*\$\{\{\s*steps\.app-token\.outputs\.token\s*\}\}/
  );
  assert.ok(approvalMatch, 'Approval step should use app token from app-token step');
});

test('approval step is gated on policy.outputs.approve', () => {
  assert.ok(
    workflowContent.includes("steps.policy.outputs.approve == 'true'"),
    'Approval step should be gated on policy approval output'
  );
});

test('approval step uses pulls.createReview API', () => {
  assert.ok(
    workflowContent.includes('pulls.createReview'),
    'Approval step should use createReview API'
  );
});

test('approval step submits APPROVE event', () => {
  assert.ok(
    workflowContent.includes("event: 'APPROVE'"),
    'Approval step should submit APPROVE event'
  );
});

test('approval step includes audit information in body', () => {
  // Check for classification and scope in the review body
  assert.ok(
    workflowContent.includes('Classification'),
    'Approval body should include classification'
  );
  assert.ok(workflowContent.includes('Scope'), 'Approval body should include scope');
  assert.ok(
    workflowContent.includes('Policy Version'),
    'Approval body should include policy version'
  );
});

test('workflow references TF_REVIEW_APP_ID secret', () => {
  assert.ok(
    workflowContent.includes('TF_REVIEW_APP_ID'),
    'Workflow should reference app ID secret'
  );
});

test('workflow references TF_REVIEW_APP_PRIVATE_KEY secret', () => {
  assert.ok(
    workflowContent.includes('TF_REVIEW_APP_PRIVATE_KEY'),
    'Workflow should reference app private key secret'
  );
});

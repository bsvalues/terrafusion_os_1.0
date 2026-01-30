/**
 * Contract tests for CI workflow PR comment integration
 * Validates the workflow file contains correct PR comment configuration
 *
 * Run: node --test scripts/ci/ci_workflow_pr_comment.contract.test.mjs
 *
 * @fileoverview Text-match guards for workflow PR comment step
 */

import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workflowPath = join(__dirname, '../../.github/workflows/ci.yml');

/**
 * Read workflow file content
 */
function getWorkflowContent() {
  return readFileSync(workflowPath, 'utf8');
}

test('ci.yml exists and is readable', () => {
  const content = getWorkflowContent();
  assert.ok(content.length > 0, 'Workflow file should have content');
});

test('seal-gate job has pull-requests: write permission', () => {
  const content = getWorkflowContent();

  // Find seal-gate job section and check for permissions
  const sealGateMatch = content.match(/seal-gate:[\s\S]*?(?=\n  [a-z]|$)/);
  assert.ok(sealGateMatch, 'seal-gate job should exist');

  const sealGateSection = sealGateMatch[0];
  assert.ok(
    sealGateSection.includes('pull-requests: write'),
    'seal-gate job must have pull-requests: write permission for PR comments'
  );
});

test('workflow contains Generate Telemetry Comment step', () => {
  const content = getWorkflowContent();

  assert.ok(
    content.includes('Generate Telemetry Comment'),
    'Workflow must contain Generate Telemetry Comment step'
  );

  assert.ok(
    content.includes('ci_telemetry_comment.mjs'),
    'Generate step must call ci_telemetry_comment.mjs script'
  );
});

test('workflow contains Post/Update PR Comment step', () => {
  const content = getWorkflowContent();

  assert.ok(
    content.includes('Post/Update PR Comment'),
    'Workflow must contain Post/Update PR Comment step'
  );
});

test('PR comment step uses actions/github-script', () => {
  const content = getWorkflowContent();

  // Find the PR comment step and verify it uses github-script
  const postCommentMatch = content.match(/Post\/Update PR Comment[\s\S]*?uses:\s*([\w\/@-]+)/);
  assert.ok(postCommentMatch, 'Post/Update PR Comment step should exist');
  assert.ok(
    postCommentMatch[1].includes('github-script'),
    'PR comment step should use actions/github-script'
  );
});

test('PR comment step only runs on pull_request events', () => {
  const content = getWorkflowContent();

  // Check both steps have the PR-only condition
  const generateMatch = content.match(/Generate Telemetry Comment[\s\S]*?if:\s*([^\n]+)/);
  const postMatch = content.match(/Post\/Update PR Comment[\s\S]*?if:\s*([^\n]+)/);

  assert.ok(generateMatch, 'Generate step should have if condition');
  assert.ok(postMatch, 'Post step should have if condition');

  assert.ok(
    generateMatch[1].includes("github.event_name == 'pull_request'"),
    'Generate step should check for pull_request event'
  );
  assert.ok(
    postMatch[1].includes("github.event_name == 'pull_request'"),
    'Post step should check for pull_request event'
  );
});

test('PR comment step uses sentinel for sticky updates', () => {
  const content = getWorkflowContent();

  assert.ok(
    content.includes('TF_CI_TELEMETRY'),
    'Workflow must reference TF_CI_TELEMETRY sentinel'
  );

  // Check for comment update logic
  assert.ok(
    content.includes('updateComment') || content.includes('update-comment'),
    'Workflow must have comment update logic'
  );

  assert.ok(
    content.includes('createComment') || content.includes('create-comment'),
    'Workflow must have comment create logic'
  );
});

test('PR comment step has error handling', () => {
  const content = getWorkflowContent();

  // Check for try/catch or file existence check
  assert.ok(
    content.includes('try {') ||
      content.includes('catch') ||
      content.includes('No telemetry comment file'),
    'PR comment step should handle missing file gracefully'
  );
});

test('artifact upload includes comment markdown', () => {
  const content = getWorkflowContent();

  assert.ok(
    content.includes('ci_telemetry_comment.md'),
    'Artifact upload should include ci_telemetry_comment.md'
  );
});

test('workflow has proper event triggers', () => {
  const content = getWorkflowContent();

  assert.ok(content.includes('pull_request:'), 'Workflow must trigger on pull_request events');
});

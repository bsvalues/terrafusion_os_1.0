#!/usr/bin/env node
/**
 * CI Telemetry Collector for TerraFusion Seal Gate
 *
 * Collects workflow job duration metrics to establish baselines for
 * PR throughput optimization. Outputs ci_telemetry.json artifact.
 *
 * Usage:
 *   node scripts/ci/ci_telemetry.mjs
 *
 * Environment:
 *   GITHUB_RUN_ID     - Current workflow run ID
 *   GITHUB_REPOSITORY - owner/repo
 *   GITHUB_EVENT_NAME - push, pull_request, etc.
 *   GITHUB_TOKEN      - For API access (optional in test mode)
 *   CI_TELEMETRY_TEST - Set to 'true' for test mode with mock data
 *
 * @fileoverview Government-grade CI telemetry for throughput metrics
 */

import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../../ci_telemetry.json');

// Valid classification values
const VALID_CLASSIFICATIONS = ['docs_only', 'frontend_only', 'backend_only', 'ci_only', 'mixed'];

/**
 * Get classification from environment, defaulting to 'mixed'
 * @returns {string}
 */
function getClassification() {
  const classification = process.env.TF_CLASSIFICATION || 'mixed';
  return VALID_CLASSIFICATIONS.includes(classification) ? classification : 'mixed';
}

/**
 * Compute skip flags based on classification
 * @param {string} classification
 * @returns {{skippedBackend: boolean, skippedFrontend: boolean}}
 */
function computeSkipFlags(classification) {
  // Backend is skipped for: docs_only, frontend_only, ci_only
  const skippedBackend = ['docs_only', 'frontend_only', 'ci_only'].includes(classification);

  // Frontend is skipped for: docs_only, backend_only, ci_only
  const skippedFrontend = ['docs_only', 'backend_only', 'ci_only'].includes(classification);

  return { skippedBackend, skippedFrontend };
}

/**
 * Redact sensitive values from telemetry
 * @param {string} value
 * @returns {string}
 */
function redact(value) {
  if (!value) return value;
  // Redact GitHub tokens
  return value.replace(/ghp_[A-Za-z0-9_]+/g, '***REDACTED***');
}

/**
 * Calculate duration in milliseconds between two ISO timestamps
 * @param {string} startedAt
 * @param {string} completedAt
 * @returns {number}
 */
function calculateDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return 0;
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  return Math.max(0, end - start);
}

/**
 * Get mock telemetry data for test mode
 * @returns {object}
 */
function getMockTelemetry() {
  const classification = getClassification();
  const { skippedBackend, skippedFrontend } = computeSkipFlags(classification);

  return {
    timestamp: new Date().toISOString(),
    runId: 'test-run-123',
    repository: 'test/repo',
    event: 'pull_request',
    ref: 'refs/heads/test-branch',
    sha: 'abc123def456',
    classification,
    skippedBackend,
    skippedFrontend,
    jobs: [
      {
        name: 'quality-gate',
        conclusion: 'success',
        startedAt: '2026-01-25T10:00:00Z',
        completedAt: '2026-01-25T10:02:30Z',
        durationMs: 150000,
        runner: 'ubuntu-latest',
      },
      {
        name: '🔒 TerraFusion Seal Gate',
        conclusion: 'success',
        startedAt: '2026-01-25T10:02:30Z',
        completedAt: '2026-01-25T10:05:00Z',
        durationMs: 150000,
        runner: 'ubuntu-latest',
      },
    ],
    summary: {
      totalDurationMs: 300000,
      totalJobs: 2,
      successCount: 2,
      failureCount: 0,
    },
  };
}

/**
 * Fetch real workflow run data from GitHub API
 * @returns {object}
 */
function fetchWorkflowTelemetry() {
  const runId = process.env.GITHUB_RUN_ID;
  const repository = process.env.GITHUB_REPOSITORY;
  const eventName = process.env.GITHUB_EVENT_NAME || 'unknown';
  const ref = process.env.GITHUB_REF || 'unknown';
  const sha = process.env.GITHUB_SHA || 'unknown';
  const classification = getClassification();
  const { skippedBackend, skippedFrontend } = computeSkipFlags(classification);

  if (!runId || !repository) {
    console.error('⚠️  GITHUB_RUN_ID or GITHUB_REPOSITORY not set, using minimal telemetry');
    return {
      timestamp: new Date().toISOString(),
      runId: runId || 'local',
      repository: repository || 'local/repo',
      event: eventName,
      ref: ref,
      sha: sha,
      classification,
      skippedBackend,
      skippedFrontend,
      jobs: [],
      summary: {
        totalDurationMs: 0,
        totalJobs: 0,
        successCount: 0,
        failureCount: 0,
      },
    };
  }

  try {
    // Use gh CLI to fetch workflow jobs (available in GitHub Actions)
    const jobsJson = execSync(
      `gh api repos/${repository}/actions/runs/${runId}/jobs --jq '.jobs'`,
      { encoding: 'utf8', timeout: 30000 }
    );

    const rawJobs = JSON.parse(jobsJson);
    const jobs = rawJobs.map(job => ({
      name: job.name,
      conclusion: job.conclusion || job.status,
      startedAt: job.started_at,
      completedAt: job.completed_at,
      durationMs: calculateDuration(job.started_at, job.completed_at),
      runner: job.labels?.[0] || 'unknown',
    }));

    const totalDurationMs = jobs.reduce((sum, job) => sum + job.durationMs, 0);
    const successCount = jobs.filter(j => j.conclusion === 'success').length;
    const failureCount = jobs.filter(j => j.conclusion === 'failure').length;

    return {
      timestamp: new Date().toISOString(),
      runId: runId,
      repository: redact(repository),
      event: eventName,
      ref: redact(ref),
      sha: sha,
      classification,
      skippedBackend,
      skippedFrontend,
      jobs: jobs,
      summary: {
        totalDurationMs,
        totalJobs: jobs.length,
        successCount,
        failureCount,
      },
    };
  } catch (error) {
    console.error(`⚠️  Failed to fetch workflow jobs: ${error.message}`);
    return {
      timestamp: new Date().toISOString(),
      runId: runId,
      repository: repository,
      event: eventName,
      ref: ref,
      sha: sha,
      classification,
      skippedBackend,
      skippedFrontend,
      jobs: [],
      summary: {
        totalDurationMs: 0,
        totalJobs: 0,
        successCount: 0,
        failureCount: 0,
        error: error.message,
      },
    };
  }
}

/**
 * Main entry point
 */
function main() {
  console.log('📊 CI Telemetry Collector');
  console.log('========================\n');

  const isTestMode = process.env.CI_TELEMETRY_TEST === 'true';

  let telemetry;
  if (isTestMode) {
    console.log('🧪 Running in TEST mode with mock data\n');
    telemetry = getMockTelemetry();
  } else {
    console.log('🔍 Fetching workflow telemetry from GitHub API...\n');
    telemetry = fetchWorkflowTelemetry();
  }

  // Ensure no secrets in output
  const sanitizedOutput = JSON.stringify(telemetry, null, 2);
  if (sanitizedOutput.includes('ghp_')) {
    console.error('❌ SECRET LEAK DETECTED - aborting');
    process.exit(1);
  }

  // Write output
  writeFileSync(OUTPUT_PATH, sanitizedOutput, 'utf8');
  console.log(`✅ Telemetry written to: ${OUTPUT_PATH}`);

  // Print summary
  console.log('\n📋 Summary:');
  console.log(`   Run ID:         ${telemetry.runId}`);
  console.log(`   Event:          ${telemetry.event}`);
  console.log(`   Classification: ${telemetry.classification}`);
  console.log(`   Jobs:           ${telemetry.summary.totalJobs}`);
  console.log(`   Duration:       ${(telemetry.summary.totalDurationMs / 1000).toFixed(1)}s`);
  console.log(`   Success:        ${telemetry.summary.successCount}`);
  console.log(`   Failures:       ${telemetry.summary.failureCount}`);
  console.log(`   Skipped Backend:  ${telemetry.skippedBackend}`);
  console.log(`   Skipped Frontend: ${telemetry.skippedFrontend}`);

  process.exit(0);
}

main();

#!/usr/bin/env node
/**
 * CI Telemetry PR Comment Generator
 *
 * Generates a markdown summary from ci_telemetry.json for posting
 * as a sticky PR comment. Includes sanitization to prevent secret leaks.
 *
 * Usage:
 *   node scripts/ci/ci_telemetry_comment.mjs [input.json] [output.md]
 *
 * Defaults:
 *   input:  ci_telemetry.json
 *   output: ci_telemetry_comment.md
 *
 * Environment:
 *   GITHUB_RUN_ID          - Link to workflow run
 *   GITHUB_REPOSITORY      - owner/repo for artifact URL
 *   GITHUB_SERVER_URL      - GitHub server URL (default: https://github.com)
 *
 * @fileoverview Government-grade PR comment generation with sanitization
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Sentinel comment for sticky PR comment updates (DO NOT CHANGE)
const SENTINEL = '<!-- TF_CI_TELEMETRY -->';

// Patterns that indicate secrets (case-insensitive)
const SECRET_PATTERNS = [
  /ghp_[A-Za-z0-9_]+/gi, // GitHub PAT
  /gho_[A-Za-z0-9_]+/gi, // GitHub OAuth
  /ghs_[A-Za-z0-9_]+/gi, // GitHub App installation
  /ghu_[A-Za-z0-9_]+/gi, // GitHub user-to-server
  /github_pat_[A-Za-z0-9_]+/gi, // Fine-grained PAT
  /sk-[A-Za-z0-9]{32,}/gi, // OpenAI API key
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, // Bearer tokens
  /password[=:]\s*\S+/gi, // Password assignments
  /secret[=:]\s*\S+/gi, // Secret assignments
  /token[=:]\s*\S+/gi, // Token assignments
  /api[_-]?key[=:]\s*\S+/gi, // API key assignments
];

/**
 * Sanitize a string to remove potential secrets
 * @param {string} value - Value to sanitize
 * @returns {string} Sanitized value
 */
function sanitize(value) {
  if (typeof value !== 'string') return value;

  let result = value;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, '***REDACTED***');
  }
  return result;
}

/**
 * Deep sanitize an object
 * @param {any} obj - Object to sanitize
 * @returns {any} Sanitized object
 */
function deepSanitize(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitize(obj);
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepSanitize);

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip keys that might contain secrets
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('password') ||
      lowerKey.includes('apikey')
    ) {
      result[key] = '***REDACTED***';
    } else {
      result[key] = deepSanitize(value);
    }
  }
  return result;
}

/**
 * Format duration in human-readable form
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  if (typeof ms !== 'number' || isNaN(ms)) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  let mins = Math.floor(ms / 60000);
  let secs = Math.round((ms % 60000) / 1000);
  // Handle rounding edge case: 59999ms -> 60s should become 1m 0s
  if (secs === 60) {
    mins += 1;
    secs = 0;
  }
  return `${mins}m ${secs}s`;
}

/**
 * Get emoji for classification
 * @param {string} classification
 * @returns {string}
 */
function getClassificationEmoji(classification) {
  const emojis = {
    docs_only: '📚',
    frontend_only: '🎨',
    backend_only: '⚙️',
    ci_only: '🔧',
    mixed: '🔀',
  };
  return emojis[classification] || '❓';
}

/**
 * Get status emoji
 * @param {number} failures
 * @returns {string}
 */
function getStatusEmoji(failures) {
  return failures === 0 ? '✅' : '❌';
}

/**
 * Generate markdown comment from telemetry
 * @param {object} telemetry - Parsed telemetry data
 * @param {object} options - Generation options
 * @returns {string} Markdown content
 */
function generateMarkdown(telemetry, options = {}) {
  const sanitized = deepSanitize(telemetry);
  const { runUrl = '', artifactName = 'ci-telemetry' } = options;

  const classification = sanitized.classification || 'mixed';
  const totalDuration = formatDuration(sanitized.summary?.totalDurationMs);
  const jobCount = sanitized.summary?.totalJobs ?? 0;
  const successCount = sanitized.summary?.successCount ?? 0;
  const failureCount = sanitized.summary?.failureCount ?? 0;
  const skippedBackend = sanitized.skippedBackend ?? false;
  const skippedFrontend = sanitized.skippedFrontend ?? false;

  const statusEmoji = getStatusEmoji(failureCount);
  const classEmoji = getClassificationEmoji(classification);

  // Build skip status
  const skips = [];
  if (skippedBackend) skips.push('Backend');
  if (skippedFrontend) skips.push('Frontend');
  const skipText = skips.length > 0 ? skips.join(', ') : 'None';

  // Build jobs table (if jobs present)
  let jobsTable = '';
  if (Array.isArray(sanitized.jobs) && sanitized.jobs.length > 0) {
    jobsTable = `
<details>
<summary>📋 Job Details (${jobCount} jobs)</summary>

| Job | Status | Duration |
|-----|--------|----------|
${sanitized.jobs
  .map(job => {
    const statusIcon =
      job.conclusion === 'success'
        ? '✅'
        : job.conclusion === 'failure'
          ? '❌'
          : job.conclusion === 'skipped'
            ? '⏭️'
            : '⏳';
    return `| ${sanitize(job.name)} | ${statusIcon} ${job.conclusion || 'pending'} | ${formatDuration(job.durationMs)} |`;
  })
  .join('\n')}

</details>`;
  }

  // Build artifact link
  const artifactLink = runUrl
    ? `[View Artifact](${runUrl}#artifacts)`
    : `Artifact: \`${artifactName}\``;

  const markdown = `${SENTINEL}
## 📊 CI Telemetry Summary

${statusEmoji} **Status:** ${failureCount === 0 ? 'All checks passed' : `${failureCount} failure(s)`}

| Metric | Value |
|--------|-------|
| ${classEmoji} Classification | \`${classification}\` |
| ⏱️ Total Duration | ${totalDuration} |
| 📦 Jobs | ${successCount}/${jobCount} passed |
| ⏭️ Skipped | ${skipText} |

${jobsTable}

---
<sub>${artifactLink} • Run: \`${sanitize(String(sanitized.runId || 'N/A'))}\` • ${sanitize(sanitized.timestamp || new Date().toISOString())}</sub>
`;

  return markdown;
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const inputPath = args[0] ? resolve(args[0]) : join(__dirname, '../../ci_telemetry.json');
  const outputPath = args[1] ? resolve(args[1]) : join(__dirname, '../../ci_telemetry_comment.md');

  console.log('📝 CI Telemetry Comment Generator');
  console.log('==================================\n');
  console.log(`Input:  ${inputPath}`);
  console.log(`Output: ${outputPath}\n`);

  // Read telemetry
  let telemetry;
  try {
    const content = readFileSync(inputPath, 'utf8');
    telemetry = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Failed to read telemetry: ${error.message}`);
    process.exit(1);
  }

  // Build options from environment
  const runId = process.env.GITHUB_RUN_ID;
  const repository = process.env.GITHUB_REPOSITORY;
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';

  const runUrl = runId && repository ? `${serverUrl}/${repository}/actions/runs/${runId}` : '';

  // Generate markdown
  const markdown = generateMarkdown(telemetry, { runUrl });

  // Final secret check - reset lastIndex to avoid stateful regex issues
  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0; // Reset stateful /g regex before each test
    if (pattern.test(markdown)) {
      console.error('❌ SECRET LEAK DETECTED in output - aborting');
      process.exit(1);
    }
  }

  // Write output
  writeFileSync(outputPath, markdown, 'utf8');
  console.log(`✅ Comment generated: ${outputPath}`);

  // Print preview
  console.log('\n📋 Preview:');
  console.log('─'.repeat(50));
  console.log(markdown);

  process.exit(0);
}

// Export for testing
export { deepSanitize, formatDuration, generateMarkdown, sanitize, SENTINEL };

// Only run main() when executed directly, not when imported for testing
// Use fileURLToPath for cross-platform compatibility
const scriptPath = fileURLToPath(import.meta.url);
const isMainModule =
  process.argv[1] &&
  (scriptPath === process.argv[1] ||
    scriptPath === process.argv[1].replace(/\\/g, '/') ||
    scriptPath.replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  main();
}

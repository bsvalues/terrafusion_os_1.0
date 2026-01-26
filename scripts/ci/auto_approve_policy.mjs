#!/usr/bin/env node
/**
 * Auto-Approve Policy for TerraFusion PRs
 *
 * Determines if a PR can be auto-approved by a GitHub App co-signer
 * based on classification, changed files, and required checks status.
 *
 * LOW-RISK (auto-approve eligible):
 *   - docs_only:  Only docs changed
 *   - ci_only:    Only CI/test files changed
 *
 * HIGH-RISK (requires human review):
 *   - frontend_only: UI changes need visual review
 *   - backend_only:  API/data changes need security review
 *   - mixed:         Cross-cutting changes need full review
 *
 * BREAK-GLASS:
 *   - PRs with label 'auto-approve' can bypass classification check
 *   - Still requires all required checks to pass
 *
 * Usage:
 *   node auto_approve_policy.mjs --classification=docs_only --checks-passed
 *   node auto_approve_policy.mjs --telemetry=ci_telemetry.json --labels=auto-approve
 *
 * @fileoverview Deterministic auto-approve policy for low-risk PRs
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ============================================================================
// Policy Configuration
// ============================================================================

/**
 * Classifications that are considered low-risk and eligible for auto-approve
 */
const LOW_RISK_CLASSIFICATIONS = ['docs_only', 'ci_only'];

/**
 * Labels that can trigger break-glass auto-approve (bypasses classification)
 */
const BREAK_GLASS_LABELS = ['auto-approve', 'break-glass'];

/**
 * Required check names that must pass for auto-approve
 */
const REQUIRED_CHECKS = ['scope-drift-guard', 'proof', '🔒 TerraFusion Seal Gate'];

// ============================================================================
// Policy Decision Logic
// ============================================================================

/**
 * Determine if a PR should be auto-approved
 * @param {object} params - Policy decision parameters
 * @param {string} params.classification - PR classification (docs_only, ci_only, etc.)
 * @param {string[]} params.labels - PR labels
 * @param {boolean} params.checksPassed - Whether all required checks passed
 * @param {string[]} [params.changedFiles] - List of changed files (optional, for audit)
 * @returns {{approve: boolean, reason: string, scope: string, auditTrail: object}}
 */
export function evaluatePolicy({ classification, labels = [], checksPassed, changedFiles = [] }) {
  const auditTrail = {
    classification,
    labels,
    checksPassed,
    changedFilesCount: changedFiles.length,
    evaluatedAt: new Date().toISOString(),
    policyVersion: '1.0.0',
  };

  // GATE 1: Required checks must pass
  if (!checksPassed) {
    return {
      approve: false,
      reason: 'Required checks have not passed',
      scope: 'checks',
      auditTrail,
    };
  }

  // GATE 2: Check for break-glass labels
  const hasBreakGlass = labels.some(label => BREAK_GLASS_LABELS.includes(label.toLowerCase()));

  if (hasBreakGlass) {
    return {
      approve: true,
      reason: `Break-glass label detected: ${labels.find(l => BREAK_GLASS_LABELS.includes(l.toLowerCase()))}`,
      scope: 'break-glass',
      auditTrail: { ...auditTrail, breakGlassTriggered: true },
    };
  }

  // GATE 3: Classification-based policy
  const isLowRisk = LOW_RISK_CLASSIFICATIONS.includes(classification);

  if (isLowRisk) {
    return {
      approve: true,
      reason: `Classification '${classification}' is low-risk and eligible for auto-approve`,
      scope: classification,
      auditTrail,
    };
  }

  // HIGH-RISK: Require human review
  return {
    approve: false,
    reason: `Classification '${classification}' requires human review`,
    scope: 'human-review',
    auditTrail,
  };
}

/**
 * Check if all required checks have passed
 * @param {object[]} statusChecks - Array of status check objects
 * @returns {boolean}
 */
export function checkRequiredChecksPassed(statusChecks) {
  if (!Array.isArray(statusChecks) || statusChecks.length === 0) {
    return false;
  }

  for (const requiredCheck of REQUIRED_CHECKS) {
    const check = statusChecks.find(c => c.name === requiredCheck);
    if (!check || check.conclusion !== 'success') {
      return false;
    }
  }

  return true;
}

/**
 * Parse telemetry JSON file for classification
 * @param {string} telemetryPath - Path to ci_telemetry.json
 * @returns {{classification: string, checksPassed: boolean} | null}
 */
export function parseTelemetry(telemetryPath) {
  if (!existsSync(telemetryPath)) {
    return null;
  }

  try {
    const telemetry = JSON.parse(readFileSync(telemetryPath, 'utf8'));
    return {
      classification: telemetry.classification || 'mixed',
      // Telemetry tracks failures - if no failures, checks passed
      checksPassed: (telemetry.summary?.failed || 0) === 0,
    };
  } catch {
    return null;
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  const classificationArg = args.find(a => a.startsWith('--classification='));
  const telemetryArg = args.find(a => a.startsWith('--telemetry='));
  const labelsArg = args.find(a => a.startsWith('--labels='));
  const hasChecksPassed = args.includes('--checks-passed');
  const isJson = args.includes('--json');

  let classification = 'mixed';
  let checksPassed = hasChecksPassed;
  let labels = [];

  // Parse classification from arg or telemetry
  if (classificationArg) {
    classification = classificationArg.replace('--classification=', '');
  } else if (telemetryArg) {
    const telemetryPath = telemetryArg.replace('--telemetry=', '');
    const telemetryData = parseTelemetry(telemetryPath);
    if (telemetryData) {
      classification = telemetryData.classification;
      checksPassed = checksPassed || telemetryData.checksPassed;
    }
  }

  // Parse labels
  if (labelsArg) {
    labels = labelsArg.replace('--labels=', '').split(',').filter(Boolean);
  }

  // Evaluate policy
  const result = evaluatePolicy({
    classification,
    labels,
    checksPassed,
  });

  // Output
  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Approve: ${result.approve}`);
    console.log(`Reason: ${result.reason}`);
    console.log(`Scope: ${result.scope}`);
  }

  // Set GitHub Actions output if available
  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_OUTPUT, `approve=${result.approve}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `reason=${result.reason}\n`);
    appendFileSync(process.env.GITHUB_OUTPUT, `scope=${result.scope}\n`);
  }

  // Exit with appropriate code
  process.exit(result.approve ? 0 : 1);
}

// Only run main() when executed directly, not when imported for testing
const scriptPath = fileURLToPath(import.meta.url);
const isMainModule =
  process.argv[1] &&
  (scriptPath === process.argv[1] ||
    scriptPath === process.argv[1].replace(/\\/g, '/') ||
    scriptPath.replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  main();
}

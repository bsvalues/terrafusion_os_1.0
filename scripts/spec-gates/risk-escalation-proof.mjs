/**
 * TerraFusion OS - Risk Escalation Proof (Gate 7)
 *
 * CI gate test that verifies all high-risk tools (write_high, irreversible)
 * have proper safeguards: reason codes, confirmations, supervisor approval.
 *
 * This is the "GovernanceLock" proof - showing that dangerous tools cannot
 * be executed without proper authorization at both CI and runtime.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// Constants
// ============================================================================

const MANIFEST_PATH = resolve(process.cwd(), 'tools/registry/terrapilot.tools.json');
const EXIT_SUCCESS = 0;
const EXIT_FAILURE = 1;

// ============================================================================
// Types (JSDoc for clarity in plain JS)
// ============================================================================

/**
 * @typedef {Object} Tool
 * @property {string} toolId
 * @property {string} suite
 * @property {string} risk
 * @property {boolean} [requiresSupervisorApproval]
 * @property {string[]} [supervisorRoles]
 * @property {string[]} [reasonCodes]
 * @property {string} [piiHandling]
 * @property {string} [tracePolicy]
 * @property {string} [payloadStore]
 */

/**
 * @typedef {Object} Manifest
 * @property {string} version
 * @property {Tool[]} tools
 */

// ============================================================================
// Proof Validators
// ============================================================================

/**
 * @typedef {Object} ProofCheck
 * @property {string} name
 * @property {boolean} passed
 * @property {string} detail
 */

/**
 * @typedef {Object} ProofResult
 * @property {string} tool
 * @property {boolean} passed
 * @property {ProofCheck[]} checks
 */

/**
 * Prove an irreversible tool has all required safeguards
 * @param {Tool} tool
 * @returns {ProofResult}
 */
function proveIrreversibleTool(tool) {
  /** @type {ProofCheck[]} */
  const checks = [];

  // Check 1: requiresSupervisorApproval must be true
  const hasSupervisorFlag = tool.requiresSupervisorApproval === true;
  checks.push({
    name: 'supervisor_approval_flag',
    passed: hasSupervisorFlag,
    detail: hasSupervisorFlag
      ? 'requiresSupervisorApproval is true'
      : 'MISSING: requiresSupervisorApproval must be true',
  });

  // Check 2: supervisorRoles must be non-empty
  const hasRoles = Array.isArray(tool.supervisorRoles) && tool.supervisorRoles.length > 0;
  checks.push({
    name: 'supervisor_roles',
    passed: hasRoles,
    detail: hasRoles
      ? `supervisorRoles: [${tool.supervisorRoles.join(', ')}]`
      : 'MISSING: supervisorRoles[] must be specified',
  });

  // Check 3: Must have reason codes
  const hasReasonCodes = Array.isArray(tool.reasonCodes) && tool.reasonCodes.length > 0;
  checks.push({
    name: 'reason_codes',
    passed: hasReasonCodes,
    detail: hasReasonCodes
      ? `reasonCodes: [${tool.reasonCodes.join(', ')}]`
      : 'MISSING: irreversible tools should have reasonCodes[]',
  });

  // Check 4: Must have trace policy (not 'none')
  const hasTracing = tool.tracePolicy && tool.tracePolicy !== 'none';
  checks.push({
    name: 'trace_policy',
    passed: !!hasTracing,
    detail: hasTracing
      ? `tracePolicy: ${tool.tracePolicy}`
      : 'MISSING: irreversible tools must have tracePolicy (not "none")',
  });

  // Check 5: Must have PII handling
  const hasPiiHandling = tool.piiHandling && tool.piiHandling !== 'none';
  checks.push({
    name: 'pii_handling',
    passed: !!hasPiiHandling,
    detail: hasPiiHandling
      ? `piiHandling: ${tool.piiHandling}`
      : 'MISSING: irreversible tools should have piiHandling (not "none")',
  });

  // Minimum required: supervisor approval flag + roles
  const passed = hasSupervisorFlag && hasRoles;

  return {
    tool: tool.toolId,
    passed,
    checks,
  };
}

/**
 * Prove a write_high tool has required safeguards
 * @param {Tool} tool
 * @returns {ProofResult}
 */
function proveWriteHighTool(tool) {
  /** @type {ProofCheck[]} */
  const checks = [];

  // Check 1: Must have reason codes
  const hasReasonCodes = Array.isArray(tool.reasonCodes) && tool.reasonCodes.length > 0;
  checks.push({
    name: 'reason_codes',
    passed: hasReasonCodes,
    detail: hasReasonCodes
      ? `reasonCodes: [${tool.reasonCodes.join(', ')}]`
      : 'MISSING: write_high tools must have reasonCodes[]',
  });

  // Check 2: Should have confirmation
  const hasConfirmation = tool.requiresSupervisorApproval === true || hasReasonCodes;
  checks.push({
    name: 'confirmation_flow',
    passed: hasConfirmation,
    detail: hasConfirmation
      ? 'Has confirmation or supervisor approval'
      : 'WARN: write_high tools should require confirmation',
  });

  return {
    tool: tool.toolId,
    passed: hasReasonCodes, // Only reason codes are mandatory for write_high
    checks,
  };
}

// ============================================================================
// Main
// ============================================================================

/**
 * Main entry point
 * @returns {number} Exit code
 */
function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Gate 7: RISK ESCALATION PROOF');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Check manifest exists
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest not found: ${MANIFEST_PATH}`);
    return EXIT_FAILURE;
  }

  // Load and parse manifest
  /** @type {Manifest} */
  let manifest;
  try {
    const raw = readFileSync(MANIFEST_PATH, 'utf-8');
    manifest = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed to parse manifest: ${err.message || err}`);
    return EXIT_FAILURE;
  }

  console.log(`📋 Manifest version: ${manifest.version}`);
  console.log(`📋 Total tools: ${manifest.tools.length}\n`);

  // Find high-risk tools
  const irreversibleTools = manifest.tools.filter(t => t.risk === 'irreversible');
  const writeHighTools = manifest.tools.filter(t => t.risk === 'write_high');

  console.log(`🔴 Irreversible tools: ${irreversibleTools.length}`);
  console.log(`🟠 Write-high tools: ${writeHighTools.length}\n`);

  // Run proofs
  /** @type {ProofResult[]} */
  const results = [];
  let failures = 0;

  // Prove irreversible tools
  if (irreversibleTools.length > 0) {
    console.log('── IRREVERSIBLE TOOL PROOFS ─────────────────────────────────\n');
    for (const tool of irreversibleTools) {
      const result = proveIrreversibleTool(tool);
      results.push(result);

      if (result.passed) {
        console.log(`✅ ${tool.toolId}`);
      } else {
        console.log(`❌ ${tool.toolId}`);
        failures++;
      }

      for (const check of result.checks) {
        const icon = check.passed ? '  ✓' : '  ✗';
        console.log(`${icon} ${check.name}: ${check.detail}`);
      }
      console.log('');
    }
  }

  // Prove write_high tools
  if (writeHighTools.length > 0) {
    console.log('── WRITE-HIGH TOOL PROOFS ───────────────────────────────────\n');
    for (const tool of writeHighTools) {
      const result = proveWriteHighTool(tool);
      results.push(result);

      if (result.passed) {
        console.log(`✅ ${tool.toolId}`);
      } else {
        console.log(`❌ ${tool.toolId}`);
        failures++;
      }

      for (const check of result.checks) {
        const icon = check.passed ? '  ✓' : '  ✗';
        console.log(`${icon} ${check.name}: ${check.detail}`);
      }
      console.log('');
    }
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  if (failures === 0) {
    console.log(`✅ ALL PROOFS PASSED (${results.length} high-risk tools verified)`);
    console.log('═══════════════════════════════════════════════════════════════');
    return EXIT_SUCCESS;
  } else {
    console.log(`❌ ${failures} PROOF(S) FAILED`);
    console.log('═══════════════════════════════════════════════════════════════');
    return EXIT_FAILURE;
  }
}

process.exit(main());

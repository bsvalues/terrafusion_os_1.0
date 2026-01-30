/**
 * Gate 4: Write-Lane Assertions
 *
 * Spec Reference: docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md
 * ADR Reference: docs/architecture/specs/terrafusion/adr/ADR-0002_WRITE_LANES.md
 *
 * Validates:
 * - Tool manifest exists and is valid JSON
 * - All tools declare suite, risk, writeLane
 * - writeLane matches suite for write tools (no cross-lane writes)
 * - read_only tools must have writeLane: null
 * - write_high/irreversible tools require confirmation flags
 * - trace-touching tools must be os/pilot and read_only
 *
 * Usage: node scripts/spec-gates/write-lanes.mjs
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Configuration
// ============================================================================

const MANIFEST_PATH = 'tools/registry/terrapilot.tools.json';

const VALID_SUITES = ['forge', 'atlas', 'dais', 'dossier', 'os', 'pilot', 'gpt'];
const VALID_RISKS = ['read_only', 'write_low', 'write_high', 'irreversible'];

// ============================================================================
// Validation Rules
// ============================================================================

function validateTool(tool, index) {
  const violations = [];
  const prefix = `tool[${index}] "${tool.toolId || 'MISSING_ID'}"`;

  // Rule 1: Required fields
  if (!tool.toolId) {
    violations.push({ rule: 'required_field', message: `${prefix}: missing toolId` });
  }
  if (!tool.suite) {
    violations.push({ rule: 'required_field', message: `${prefix}: missing suite` });
  }
  if (!tool.risk) {
    violations.push({ rule: 'required_field', message: `${prefix}: missing risk` });
  }

  // Rule 2: Valid enum values
  if (tool.suite && !VALID_SUITES.includes(tool.suite)) {
    violations.push({
      rule: 'invalid_suite',
      message: `${prefix}: invalid suite "${tool.suite}" (expected: ${VALID_SUITES.join('|')})`,
    });
  }
  if (tool.risk && !VALID_RISKS.includes(tool.risk)) {
    violations.push({
      rule: 'invalid_risk',
      message: `${prefix}: invalid risk "${tool.risk}" (expected: ${VALID_RISKS.join('|')})`,
    });
  }

  // Rule 3: writeLane consistency
  const isWriteTool = tool.risk && tool.risk !== 'read_only';

  if (isWriteTool) {
    // Write tools must declare a writeLane
    if (!tool.writeLane) {
      violations.push({
        rule: 'missing_write_lane',
        message: `${prefix}: write tool (risk=${tool.risk}) must declare writeLane`,
      });
    }
    // writeLane must match suite (no cross-lane writes)
    else if (tool.writeLane !== tool.suite) {
      violations.push({
        rule: 'cross_lane_write',
        message: `${prefix}: writeLane "${tool.writeLane}" != suite "${tool.suite}" (cross-lane write violation)`,
      });
    }
  } else {
    // read_only tools must have null writeLane
    if (tool.writeLane !== null && tool.writeLane !== undefined) {
      violations.push({
        rule: 'read_only_with_write_lane',
        message: `${prefix}: read_only tool should have writeLane: null, got "${tool.writeLane}"`,
      });
    }
  }

  // Rule 4: High-risk tools require confirmation
  if ((tool.risk === 'write_high' || tool.risk === 'irreversible') && !tool.requiresConfirmation) {
    violations.push({
      rule: 'missing_confirmation',
      message: `${prefix}: ${tool.risk} tool must set requiresConfirmation: true`,
    });
  }

  // Rule 5: Trace-touching tools must be os/pilot and read_only
  if (tool.touches && tool.touches.includes('trace')) {
    if (tool.suite !== 'os' && tool.suite !== 'pilot') {
      violations.push({
        rule: 'trace_suite_violation',
        message: `${prefix}: trace-touching tool must be suite os|pilot, got "${tool.suite}"`,
      });
    }
    if (tool.risk !== 'read_only') {
      violations.push({
        rule: 'trace_write_violation',
        message: `${prefix}: trace-touching tool must be read_only (trace is immutable)`,
      });
    }
  }

  return violations;
}

// ============================================================================
// Main Execution
// ============================================================================

console.log('🔍 Gate 4: Write-Lane Assertions');
console.log('================================');
console.log('');

const manifestPath = join(process.cwd(), MANIFEST_PATH);

// Check manifest exists
if (!existsSync(manifestPath)) {
  console.log('❌ Write-Lane Assertions FAILED');
  console.log('');
  console.log(`   Tool manifest not found: ${MANIFEST_PATH}`);
  console.log('   Create the manifest to enable Gate 4 enforcement.');
  console.log('');
  console.log(
    '📚 Reference: docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md'
  );
  process.exit(1);
}

console.log(`✅ Manifest found: ${MANIFEST_PATH}`);

// Parse manifest
let manifest;
try {
  const content = readFileSync(manifestPath, 'utf8');
  manifest = JSON.parse(content);
} catch (e) {
  console.log('');
  console.log('❌ Write-Lane Assertions FAILED');
  console.log('');
  console.log(`   Failed to parse manifest: ${e.message}`);
  process.exit(1);
}

console.log(`   Version: ${manifest.version || 'unknown'}`);
console.log(`   Tools: ${manifest.tools?.length || 0}`);
console.log('');
console.log('Validating tool declarations...');
console.log('');

// Validate all tools
const allViolations = [];
const tools = manifest.tools || [];

for (let i = 0; i < tools.length; i++) {
  const violations = validateTool(tools[i], i);
  allViolations.push(...violations);
}

// Check for duplicate toolIds
const toolIds = tools.map(t => t.toolId).filter(Boolean);
const duplicates = toolIds.filter((id, i) => toolIds.indexOf(id) !== i);
if (duplicates.length > 0) {
  for (const dup of [...new Set(duplicates)]) {
    allViolations.push({
      rule: 'duplicate_tool_id',
      message: `Duplicate toolId: "${dup}"`,
    });
  }
}

// Report results
if (allViolations.length > 0) {
  console.log('❌ Write-Lane Assertions FAILED');
  console.log('');
  console.log(`Found ${allViolations.length} violation(s):`);
  console.log('');

  for (const v of allViolations.slice(0, 15)) {
    console.log(`  [${v.rule}] ${v.message}`);
  }

  if (allViolations.length > 15) {
    console.log(`  ... and ${allViolations.length - 15} more violations`);
  }

  console.log('');
  console.log(
    '📚 Reference: docs/architecture/specs/terrafusion/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md'
  );
  console.log('   ADR: docs/architecture/specs/terrafusion/adr/ADR-0002_WRITE_LANES.md');
  process.exit(1);
} else {
  console.log('✅ Write-Lane Assertions PASSED');
  console.log(`   ${tools.length} tools validated`);
  console.log('   No cross-lane writes detected');
  console.log('   All risk/confirmation requirements satisfied');
  process.exit(0);
}

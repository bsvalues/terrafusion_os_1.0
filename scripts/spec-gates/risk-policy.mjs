/**
 * Gate 5: RiskPolicy Enforcement
 *
 * Spec Reference: docs/architecture/specs/terrafusion/02_TERRAPILOT_SPEC_v3.1.md
 * ADR Reference: docs/architecture/specs/terrafusion/adr/ADR-0004_TERRAPILOT_PILOT_MUSE.md
 *
 * Validates:
 * - All tools have valid risk level declared
 * - write_high tools require confirmation + reason codes
 * - irreversible tools require supervisor approval + roles
 * - Risk escalation rules (county overrides can only tighten, not loosen)
 *
 * Usage: node scripts/spec-gates/risk-policy.mjs
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Configuration
// ============================================================================

const MANIFEST_PATH = 'tools/registry/terrapilot.tools.json';
const COUNTY_OVERRIDES_PATH = 'config/county-policy-overrides.json';

const VALID_RISKS = ['read_only', 'write_low', 'write_high', 'irreversible'];

// Risk level ordering (for escalation validation)
const RISK_ORDER = {
  read_only: 0,
  write_low: 1,
  write_high: 2,
  irreversible: 3,
};

// Allowed reason codes (extensible per county)
const ALLOWED_REASON_CODES = [
  'annual_certification',
  'appeal_response',
  'correction',
  'exemption_change',
  'new_construction',
  'market_adjustment',
  'catastrophic_loss',
  'clerical_error',
  'board_directive',
  'supervisor_override',
  'emergency',
];

// ============================================================================
// Validation Rules
// ============================================================================

function validateToolRiskPolicy(tool, index) {
  const violations = [];
  const prefix = `tool[${index}] "${tool.toolId || 'MISSING_ID'}"`;

  // Rule 1: Valid risk level
  if (!tool.risk) {
    violations.push({
      rule: 'missing_risk',
      message: `${prefix}: missing risk level`,
    });
    return violations; // Can't validate further without risk
  }

  if (!VALID_RISKS.includes(tool.risk)) {
    violations.push({
      rule: 'invalid_risk',
      message: `${prefix}: invalid risk "${tool.risk}" (expected: ${VALID_RISKS.join('|')})`,
    });
    return violations;
  }

  // Rule 2: write_high requirements
  if (tool.risk === 'write_high') {
    if (!tool.requiresConfirmation) {
      violations.push({
        rule: 'write_high_no_confirmation',
        message: `${prefix}: write_high tool must set requiresConfirmation: true`,
      });
    }
    if (!tool.reasonCodeRequired) {
      violations.push({
        rule: 'write_high_no_reason_code',
        message: `${prefix}: write_high tool must set reasonCodeRequired: true`,
      });
    }
    if (!tool.reasonCodes || !Array.isArray(tool.reasonCodes) || tool.reasonCodes.length === 0) {
      violations.push({
        rule: 'write_high_no_reason_codes',
        message: `${prefix}: write_high tool must declare reasonCodes: [...] (non-empty)`,
      });
    } else {
      // Validate reason codes are from allowed set
      const invalidCodes = tool.reasonCodes.filter(c => !ALLOWED_REASON_CODES.includes(c));
      if (invalidCodes.length > 0) {
        violations.push({
          rule: 'invalid_reason_codes',
          message: `${prefix}: unknown reason codes: ${invalidCodes.join(', ')}`,
        });
      }
    }
  }

  // Rule 3: irreversible requirements (all of write_high + supervisor)
  if (tool.risk === 'irreversible') {
    if (!tool.requiresConfirmation) {
      violations.push({
        rule: 'irreversible_no_confirmation',
        message: `${prefix}: irreversible tool must set requiresConfirmation: true`,
      });
    }
    if (!tool.reasonCodeRequired) {
      violations.push({
        rule: 'irreversible_no_reason_code',
        message: `${prefix}: irreversible tool must set reasonCodeRequired: true`,
      });
    }
    if (!tool.reasonCodes || !Array.isArray(tool.reasonCodes) || tool.reasonCodes.length === 0) {
      violations.push({
        rule: 'irreversible_no_reason_codes',
        message: `${prefix}: irreversible tool must declare reasonCodes: [...] (non-empty)`,
      });
    }
    if (!tool.requiresSupervisorApproval) {
      violations.push({
        rule: 'irreversible_no_supervisor',
        message: `${prefix}: irreversible tool must set requiresSupervisorApproval: true`,
      });
    }
    if (
      !tool.supervisorRoles ||
      !Array.isArray(tool.supervisorRoles) ||
      tool.supervisorRoles.length === 0
    ) {
      violations.push({
        rule: 'irreversible_no_supervisor_roles',
        message: `${prefix}: irreversible tool must declare supervisorRoles: [...] (non-empty)`,
      });
    }
  }

  return violations;
}

function validateCountyOverrides(manifest, overrides) {
  const violations = [];

  for (const [toolId, override] of Object.entries(overrides.tools || {})) {
    const tool = manifest.tools.find(t => t.toolId === toolId);
    if (!tool) {
      violations.push({
        rule: 'unknown_tool_override',
        message: `County override for unknown tool: ${toolId}`,
      });
      continue;
    }

    // Check risk escalation (can only tighten)
    if (override.risk) {
      const baseLevel = RISK_ORDER[tool.risk];
      const overrideLevel = RISK_ORDER[override.risk];

      if (overrideLevel < baseLevel) {
        violations.push({
          rule: 'risk_loosening',
          message: `County cannot loosen risk for "${toolId}": ${tool.risk} → ${override.risk}`,
        });
      }
    }
  }

  return violations;
}

// ============================================================================
// Main Execution
// ============================================================================

console.log('🔍 Gate 5: RiskPolicy Enforcement');
console.log('=================================');
console.log('');

const manifestPath = join(process.cwd(), MANIFEST_PATH);

// Check manifest exists
if (!existsSync(manifestPath)) {
  console.log('❌ RiskPolicy Enforcement FAILED');
  console.log('');
  console.log(`   Tool manifest not found: ${MANIFEST_PATH}`);
  console.log('   Gate 5 requires the tool manifest from Gate 4.');
  console.log('');
  console.log('📚 Reference: docs/architecture/specs/terrafusion/02_TERRAPILOT_SPEC_v3.1.md');
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
  console.log('❌ RiskPolicy Enforcement FAILED');
  console.log('');
  console.log(`   Failed to parse manifest: ${e.message}`);
  process.exit(1);
}

console.log(`   Version: ${manifest.version || 'unknown'}`);
console.log(`   Tools: ${manifest.tools?.length || 0}`);

// Check for county overrides
const overridesPath = join(process.cwd(), COUNTY_OVERRIDES_PATH);
let overrides = null;
if (existsSync(overridesPath)) {
  try {
    overrides = JSON.parse(readFileSync(overridesPath, 'utf8'));
    console.log(`   County overrides: ${overridesPath}`);
  } catch (e) {
    console.log(`   ⚠️  Could not parse county overrides: ${e.message}`);
  }
}

console.log('');
console.log('Validating risk policies...');
console.log('');

// Validate all tools
const allViolations = [];
const tools = manifest.tools || [];

for (let i = 0; i < tools.length; i++) {
  const violations = validateToolRiskPolicy(tools[i], i);
  allViolations.push(...violations);
}

// Validate county overrides if present
if (overrides) {
  const overrideViolations = validateCountyOverrides(manifest, overrides);
  allViolations.push(...overrideViolations);
}

// Collect stats
const riskStats = {
  read_only: tools.filter(t => t.risk === 'read_only').length,
  write_low: tools.filter(t => t.risk === 'write_low').length,
  write_high: tools.filter(t => t.risk === 'write_high').length,
  irreversible: tools.filter(t => t.risk === 'irreversible').length,
};

// Report results
if (allViolations.length > 0) {
  console.log('❌ RiskPolicy Enforcement FAILED');
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
  console.log('📚 Reference: docs/architecture/specs/terrafusion/02_TERRAPILOT_SPEC_v3.1.md');
  console.log('   ADR: docs/architecture/specs/terrafusion/adr/ADR-0004_TERRAPILOT_PILOT_MUSE.md');
  process.exit(1);
} else {
  console.log('✅ RiskPolicy Enforcement PASSED');
  console.log('');
  console.log('   Risk distribution:');
  console.log(`     read_only: ${riskStats.read_only}`);
  console.log(`     write_low: ${riskStats.write_low}`);
  console.log(`     write_high: ${riskStats.write_high}`);
  console.log(`     irreversible: ${riskStats.irreversible}`);
  console.log('');
  console.log('   All confirmation/reason/supervisor requirements satisfied');
  process.exit(0);
}

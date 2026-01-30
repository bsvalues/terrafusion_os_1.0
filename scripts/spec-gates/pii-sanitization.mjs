/**
 * Gate 6: PII Sanitization
 *
 * Spec Reference: docs/architecture/specs/terrafusion/02_TERRAPILOT_SPEC_v3.1.md
 *                 docs/architecture/specs/terrafusion/03_TERRATRACE_SPEC_v3.1.md
 *
 * Validates:
 * - All tools declare piiHandling and tracePolicy
 * - Dais suite tools cannot have piiHandling: "none"
 * - Tools touching notice/workflow must declare piiHandling
 * - payload_ref tracePolicy requires payloadStore
 * - Code scan: no raw PII patterns in trace emit calls
 *
 * Usage: node scripts/spec-gates/pii-sanitization.mjs
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { basename, extname, join } from 'path';

// ============================================================================
// Configuration
// ============================================================================

const MANIFEST_PATH = 'tools/registry/terrapilot.tools.json';
const SANITIZER_PATH = 'os-platform/core/security/sanitizeForTrace.ts';

const VALID_PII_HANDLING = ['none', 'sanitize', 'payload_ref'];
const VALID_TRACE_POLICY = ['none', 'summary_only', 'payload_ref'];
const VALID_PAYLOAD_STORES = ['dossier', 'secure-blob', 'case-store'];

// Touches that require piiHandling declaration
const PII_SENSITIVE_TOUCHES = ['notice', 'workflow', 'dossier'];

// Suites that cannot have piiHandling: "none"
const PII_REQUIRED_SUITES = ['dais'];

// PII patterns to scan for in code (blocking)
const PII_PATTERNS_BLOCKING = [
  { pattern: /\bssn\b/i, name: 'SSN field' },
  { pattern: /\bsocialSecurity\b/i, name: 'Social Security field' },
  { pattern: /\btaxpayerId\b/i, name: 'Taxpayer ID field' },
  { pattern: /\bdob\b(?!\.)/i, name: 'DOB field' },
  { pattern: /\bdateOfBirth\b/i, name: 'Date of Birth field' },
  { pattern: /\bdriverLicense\b/i, name: 'Driver License field' },
  { pattern: /\bdlNumber\b/i, name: 'DL Number field' },
  { pattern: /\bbankAccount\b/i, name: 'Bank Account field' },
  { pattern: /\broutingNumber\b/i, name: 'Routing Number field' },
  { pattern: /\baccountNumber\b/i, name: 'Account Number field' },
];

// Files to scan for PII in trace calls
const TRACE_FILE_PATTERNS = [/[Tt]race/, /[Aa]udit/, /[Ll]og/];

const SKIP_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '__tests__',
  'test',
  'Archive',
  'archive',
  'Dev',
  'legacy',
  'deprecated',
];

// ============================================================================
// Manifest Validation
// ============================================================================

function validateToolPiiPolicy(tool, index) {
  const violations = [];
  const prefix = `tool[${index}] "${tool.toolId || 'MISSING_ID'}"`;

  // Rule 1: All tools should declare piiHandling
  if (!tool.piiHandling) {
    violations.push({
      rule: 'missing_pii_handling',
      message: `${prefix}: missing piiHandling declaration`,
    });
  } else if (!VALID_PII_HANDLING.includes(tool.piiHandling)) {
    violations.push({
      rule: 'invalid_pii_handling',
      message: `${prefix}: invalid piiHandling "${tool.piiHandling}" (expected: ${VALID_PII_HANDLING.join('|')})`,
    });
  }

  // Rule 2: All tools should declare tracePolicy
  if (!tool.tracePolicy) {
    violations.push({
      rule: 'missing_trace_policy',
      message: `${prefix}: missing tracePolicy declaration`,
    });
  } else if (!VALID_TRACE_POLICY.includes(tool.tracePolicy)) {
    violations.push({
      rule: 'invalid_trace_policy',
      message: `${prefix}: invalid tracePolicy "${tool.tracePolicy}" (expected: ${VALID_TRACE_POLICY.join('|')})`,
    });
  }

  // Rule 3: Dais suite tools cannot have piiHandling: "none"
  if (PII_REQUIRED_SUITES.includes(tool.suite) && tool.piiHandling === 'none') {
    violations.push({
      rule: 'pii_required_for_suite',
      message: `${prefix}: suite "${tool.suite}" cannot have piiHandling: "none"`,
    });
  }

  // Rule 4: Tools touching PII-sensitive domains must not have piiHandling: "none"
  const sensitiveTouch = (tool.touches || []).find(t => PII_SENSITIVE_TOUCHES.includes(t));
  if (sensitiveTouch && tool.piiHandling === 'none') {
    violations.push({
      rule: 'pii_required_for_touch',
      message: `${prefix}: touches "${sensitiveTouch}" but has piiHandling: "none"`,
    });
  }

  // Rule 5: payload_ref tracePolicy requires payloadStore
  if (tool.tracePolicy === 'payload_ref') {
    if (!tool.payloadStore) {
      violations.push({
        rule: 'missing_payload_store',
        message: `${prefix}: tracePolicy "payload_ref" requires payloadStore declaration`,
      });
    } else if (!VALID_PAYLOAD_STORES.includes(tool.payloadStore)) {
      violations.push({
        rule: 'invalid_payload_store',
        message: `${prefix}: invalid payloadStore "${tool.payloadStore}" (expected: ${VALID_PAYLOAD_STORES.join('|')})`,
      });
    }
  }

  return violations;
}

// ============================================================================
// Code Scanning (lightweight)
// ============================================================================

// Files that are allowed to reference PII patterns (the sanitizers themselves)
const ALLOWED_PII_FILES = [/sanitizeForTrace/i, /pii-sanitization\.mjs$/i];

function shouldScanFile(filepath) {
  const filename = basename(filepath);
  const ext = extname(filepath).toLowerCase();

  if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return false;

  // Skip the sanitizer helper itself
  if (ALLOWED_PII_FILES.some(p => p.test(filepath))) return false;

  // Only scan files that look like trace/audit/log related
  return TRACE_FILE_PATTERNS.some(p => p.test(filename));
}

function scanFileForPii(filepath) {
  const violations = [];

  try {
    const content = readFileSync(filepath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Look for trace/emit patterns
      if (!/trace|emit|log|audit/i.test(line)) return;

      // Check for PII patterns
      for (const { pattern, name } of PII_PATTERNS_BLOCKING) {
        if (pattern.test(line)) {
          violations.push({
            file: filepath,
            line: index + 1,
            pattern: name,
            content: line.trim().substring(0, 80),
          });
        }
      }
    });
  } catch (e) {
    // Skip files we can't read
  }

  return violations;
}

function walkDir(dir, callback) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filepath = join(dir, file);
      try {
        const stat = statSync(filepath);
        if (stat.isDirectory()) {
          if (SKIP_DIRS.includes(file)) continue;
          if (/\.archived$/i.test(filepath) || /backup/i.test(filepath)) continue;
          walkDir(filepath, callback);
        } else if (stat.isFile()) {
          callback(filepath);
        }
      } catch (e) {
        // Skip files we can't stat
      }
    }
  } catch (e) {
    // Skip directories we can't read
  }
}

// ============================================================================
// Main Execution
// ============================================================================

console.log('🔍 Gate 6: PII Sanitization');
console.log('===========================');
console.log('');

const manifestPath = join(process.cwd(), MANIFEST_PATH);

// Check manifest exists
if (!existsSync(manifestPath)) {
  console.log('❌ PII Sanitization FAILED');
  console.log('');
  console.log(`   Tool manifest not found: ${MANIFEST_PATH}`);
  console.log('   Gate 6 requires the tool manifest from Gate 4.');
  console.log('');
  console.log('📚 Reference: docs/architecture/specs/terrafusion/03_TERRATRACE_SPEC_v3.1.md');
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
  console.log('❌ PII Sanitization FAILED');
  console.log('');
  console.log(`   Failed to parse manifest: ${e.message}`);
  process.exit(1);
}

console.log(`   Version: ${manifest.version || 'unknown'}`);
console.log(`   Tools: ${manifest.tools?.length || 0}`);

// Check sanitizer helper exists
const sanitizerPath = join(process.cwd(), SANITIZER_PATH);
const sanitizerExists = existsSync(sanitizerPath);
if (sanitizerExists) {
  console.log(`✅ Sanitizer helper found: ${SANITIZER_PATH}`);
} else {
  console.log(`⚠️  Sanitizer helper not found: ${SANITIZER_PATH}`);
  console.log('   (recommended but not required for manifest-only validation)');
}

console.log('');
console.log('Validating PII policies...');
console.log('');

// Validate all tools
const manifestViolations = [];
const tools = manifest.tools || [];

for (let i = 0; i < tools.length; i++) {
  const violations = validateToolPiiPolicy(tools[i], i);
  manifestViolations.push(...violations);
}

// Scan for PII in trace code
console.log('Scanning trace files for PII patterns...');
const codeViolations = [];
const startDir = process.cwd();

walkDir(startDir, filepath => {
  if (shouldScanFile(filepath)) {
    const violations = scanFileForPii(filepath);
    codeViolations.push(...violations);
  }
});

console.log('');

// Collect stats
const piiStats = {
  none: tools.filter(t => t.piiHandling === 'none').length,
  sanitize: tools.filter(t => t.piiHandling === 'sanitize').length,
  payload_ref: tools.filter(t => t.piiHandling === 'payload_ref').length,
};

const traceStats = {
  none: tools.filter(t => t.tracePolicy === 'none').length,
  summary_only: tools.filter(t => t.tracePolicy === 'summary_only').length,
  payload_ref: tools.filter(t => t.tracePolicy === 'payload_ref').length,
};

// Report results
const allViolations = [
  ...manifestViolations,
  ...codeViolations.map(v => ({
    rule: 'pii_in_trace_code',
    message: `${v.file}:${v.line} - ${v.pattern} in trace context`,
  })),
];

if (allViolations.length > 0) {
  console.log('❌ PII Sanitization FAILED');
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
  console.log('📚 Reference: docs/architecture/specs/terrafusion/03_TERRATRACE_SPEC_v3.1.md');
  console.log('   ADR: docs/architecture/specs/terrafusion/adr/ADR-0003_TERRATRACE.md');
  process.exit(1);
} else {
  console.log('✅ PII Sanitization PASSED');
  console.log('');
  console.log('   PII handling distribution:');
  console.log(`     none: ${piiStats.none}`);
  console.log(`     sanitize: ${piiStats.sanitize}`);
  console.log(`     payload_ref: ${piiStats.payload_ref}`);
  console.log('');
  console.log('   Trace policy distribution:');
  console.log(`     none: ${traceStats.none}`);
  console.log(`     summary_only: ${traceStats.summary_only}`);
  console.log(`     payload_ref: ${traceStats.payload_ref}`);
  console.log('');
  console.log('   No raw PII detected in trace code paths');
  process.exit(0);
}

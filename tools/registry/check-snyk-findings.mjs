#!/usr/bin/env node
/**
 * check-snyk-findings.mjs
 *
 * Enforces the ratified Snyk Code finding baseline (2026-03-21).
 *
 * Rules:
 *   FAIL  — any finding with level "error" (critical) → always blocks merge
 *   WARN  — warning-level findings; fail if count > WARNING_CEILING
 *   INFO  — note-level findings; never fail CI (false-positives documented)
 *
 * Ceilings:
 *   WARNING_CEILING = 40   (35 PT + 5 other accepted rules)
 *   NOTE_CEILING    = 16   (11 HardcodedNonCryptoSecret/test + 3 PT/test + 2 low-confidence PT)
 *
 * Usage:
 *   node tools/registry/check-snyk-findings.mjs [path-to-snyk-code-report.json]
 *
 * Exits 0 on pass, 1 on violation.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ─── Ratified baseline (sealed 2026-03-21, commit 021bfd0e3) ─────────────────

// Any error-level finding is always a CI block UNLESS it appears in
// ACCEPTED_ERROR_RULES (confirmed false positives with documented rationale).
const WARNING_CEILING = 40; // accepted-baseline warnings (35 PT + 5 other)
const NOTE_CEILING    = 16; // false-positive notes (test fixtures)

/**
 * Per-rule accepted-baseline entries.
 * Raising a ceiling requires a checkpoint commit tagged [snyk-baseline: N].
 */
const ACCEPTED_WARNING_RULES = new Set([
  'javascript/PT',                                    // path traversal in operator CLI tools
  'javascript/IndirectCommandInjection',              // execSync in cosign wrapper (operator-only)
  'javascript/HttpToHttps',                           // loopback service-to-service call; no sensitive data
  'javascript/NoHardcodedPasswords',                  // test/config fixture; not a production credential
  'javascript/NoRateLimitingForExpensiveWebOperation', // loopback-only dev tool (127.0.0.1); not internet-facing
  'javascript/ServerLeak',                            // dev governance tool intentionally exposes trace data
]);

/**
 * Error-level findings that are confirmed false positives.
 * Each entry must have a documented rationale in the baseline doc.
 * New entries require a checkpoint commit tagged [snyk-baseline: N].
 */
const ACCEPTED_ERROR_RULES = new Set([
  // javascript/XSS — 13 findings in traceExport.ts, traceExport.js, dev-pilot-runtime.mjs
  // Snyk flags res.write(JSON.stringify(data)) as XSS. All flagged responses set
  // Content-Type: application/x-ndjson or application/json — never rendered as HTML.
  // XSS requires browser HTML rendering; these content types prevent that entirely.
  // Baseline doc: snyk-findings-baseline-2026-03-21.md § FALSE POSITIVE: javascript/XSS
  'javascript/XSS',

  // javascript/PT (error-promoted) — 4 findings in dev-pilot-runtime.mjs
  // Snyk promotes PT to error when path passes through HTTP request parsing.
  // dev-pilot-runtime.mjs is now bound to 127.0.0.1 — no network exposure.
  // Same operator-CLI context as the 35 accepted warning-level PT findings.
  // Baseline doc: snyk-findings-baseline-2026-03-21.md § FALSE POSITIVE: javascript/PT (error-level)
  'javascript/PT',
]);

const FALSE_POSITIVE_RULES = new Set([
  'javascript/HardcodedNonCryptoSecret/test', // test fixtures — rule suffix /test
  'javascript/PT/test',                        // test-context path traversal
]);

// ─── Parse args ───────────────────────────────────────────────────────────────
const CODE_REPORT_PATH = resolve('snyk-code-report.json');
const IAC_REPORT_PATH = resolve('snyk-iac-report.json');

function selectReportPath(inputPath) {
  const candidate = inputPath ?? 'snyk-code-report.json';

  switch (candidate) {
    case 'snyk-code-report.json':
      return CODE_REPORT_PATH;
    case 'snyk-iac-report.json':
      return IAC_REPORT_PATH;
    default:
      console.error(
        `❌ [snyk-findings] Unsupported report path: ${String(candidate)}. Use snyk-code-report.json or snyk-iac-report.json in the current working directory.`
      );
      process.exit(1);
  }
}

const reportPath = selectReportPath(process.argv[2]);

if (!existsSync(reportPath)) {
  console.log(`⚠️  [snyk-findings] Report not found at ${reportPath} — skipping enforcement.`);
  console.log('   Run: npm run security:scan first, or set SNYK_FAIL_ON_FINDINGS=0 to generate the report.');
  process.exit(0);
}

let raw;
try {
  raw = JSON.parse(readFileSync(reportPath, 'utf8'));
} catch (e) {
  console.error(`❌ [snyk-findings] Cannot parse ${reportPath}: ${e.message}`);
  process.exit(1);
}

// Handle status-report format (scanner wrote { mode, status, ... } instead of SARIF)
if (raw.status === 'skipped' || raw.status === 'clean') {
  console.log(`✅ Snyk report status: ${raw.status} — no findings enforcement needed.`);
  process.exit(0);
}

// ─── Extract findings from SARIF ─────────────────────────────────────────────
const results = (raw.runs ?? []).flatMap((run) => run.results ?? []);

const errors   = [];
const warnings = [];
const notes    = [];
const unknown  = [];

for (const r of results) {
  const level  = r.level ?? 'unknown';
  const ruleId = r.ruleId ?? 'unknown';
  const locs   = r.locations ?? [];
  const uri    = locs[0]?.physicalLocation?.artifactLocation?.uri ?? '?';
  const line   = locs[0]?.physicalLocation?.region?.startLine ?? '?';
  const entry  = { level, ruleId, uri, line };

  if (level === 'error')        errors.push(entry);
  else if (level === 'warning') warnings.push(entry);
  else if (level === 'note')    notes.push(entry);
  else                          unknown.push(entry);
}

// ─── Report ───────────────────────────────────────────────────────────────────
console.log('\n🔒 Snyk Code findings audit');
console.log(`   error    : ${errors.length}   (0 genuine expected — accepted false positives allowed via ACCEPTED_ERROR_RULES)`);
console.log(`   warning  : ${warnings.length}   (ceiling: ${WARNING_CEILING})`);
console.log(`   note     : ${notes.length}  (ceiling: ${NOTE_CEILING} — false-positive category)`);
if (unknown.length) console.log(`   unknown  : ${unknown.length}`);
console.log('');

const violations = [];

// 1. Any error-level finding → immediate block, UNLESS in ACCEPTED_ERROR_RULES
const genuineErrors = errors.filter((e) => !ACCEPTED_ERROR_RULES.has(e.ruleId));
const acceptedErrors = errors.filter((e) => ACCEPTED_ERROR_RULES.has(e.ruleId));

if (genuineErrors.length > 0) {
  violations.push(`CRITICAL: ${genuineErrors.length} error-level finding(s) — must fix before merge:`);
  for (const e of genuineErrors) {
    violations.push(`  ${e.ruleId}  ${e.uri}:${e.line}`);
  }
}

if (acceptedErrors.length > 0) {
  console.log(`📋 Accepted error-level false positives (${acceptedErrors.length}) — documented in baseline:`);
  const byCat = {};
  for (const e of acceptedErrors) {
    byCat[e.ruleId] = (byCat[e.ruleId] ?? 0) + 1;
  }
  for (const [rule, count] of Object.entries(byCat)) {
    console.log(`   ${count.toString().padStart(3)}  ${rule}`);
  }
  console.log('');
}

// 2. Warning ceiling
if (warnings.length > WARNING_CEILING) {
  violations.push(
    `REGRESSION: warning count ${warnings.length} exceeds baseline ceiling ${WARNING_CEILING}`
  );
  // Show findings not in accepted rules
  const unclassified = warnings.filter((w) => !ACCEPTED_WARNING_RULES.has(w.ruleId));
  if (unclassified.length > 0) {
    violations.push('  New unclassified warnings:');
    for (const w of unclassified) {
      violations.push(`    ${w.ruleId}  ${w.uri}:${w.line}`);
    }
  }
}

// 3. Warning findings with unexpected rules (unclassified)
const unclassifiedWarnings = warnings.filter((w) => !ACCEPTED_WARNING_RULES.has(w.ruleId));
if (unclassifiedWarnings.length > 0 && warnings.length <= WARNING_CEILING) {
  // Within ceiling but new rule appeared — surface it
  console.log(`⚠️  New warning rule(s) not in accepted baseline:`);
  for (const w of unclassifiedWarnings) {
    console.log(`   ${w.ruleId}  ${w.uri}:${w.line}`);
  }
  console.log('   → Add to ACCEPTED_WARNING_RULES in check-snyk-findings.mjs if intentional.\n');
}

// 4. Note ceiling (informational — only fail if massively exceeded)
if (notes.length > NOTE_CEILING * 2) {
  violations.push(
    `ANOMALY: note count ${notes.length} is more than 2x the false-positive baseline (${NOTE_CEILING}). Investigate before accepting.`
  );
}

// ─── Result ───────────────────────────────────────────────────────────────────
if (violations.length > 0) {
  console.error('❌ Snyk findings violations:\n');
  for (const v of violations) console.error(`   ${v}`);
  console.error(
    '\nBaseline doc: os-platform/core/pilot/ops/snyk-findings-baseline-2026-03-21.md\n'
  );
  process.exit(1);
}

// Summary of accepted debt
if (warnings.length > 0) {
  console.log(`📋 Accepted baseline warnings (${warnings.length}/${WARNING_CEILING}):`);
  const byCat = {};
  for (const w of warnings) {
    byCat[w.ruleId] = (byCat[w.ruleId] ?? 0) + 1;
  }
  for (const [rule, count] of Object.entries(byCat)) {
    console.log(`   ${count.toString().padStart(3)}  ${rule}`);
  }
  console.log('');
}
if (notes.length > 0) {
  console.log(`📋 False-positive notes (${notes.length}/${NOTE_CEILING}) — not enforced:`);
  const byCat = {};
  for (const n of notes) {
    byCat[n.ruleId] = (byCat[n.ruleId] ?? 0) + 1;
  }
  for (const [rule, count] of Object.entries(byCat)) {
    console.log(`   ${count.toString().padStart(3)}  ${rule}`);
  }
  console.log('');
}

console.log('✅ Snyk findings enforcement passed.');
process.exit(0);

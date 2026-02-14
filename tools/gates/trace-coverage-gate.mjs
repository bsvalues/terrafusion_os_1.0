#!/usr/bin/env node
/**
 * Trace Coverage Gate — Phase 7.6 Production Cutover Safety
 *
 * Enforces: "Security-critical write action implies audit trace emission."
 *
 * Policy: BLOCK (not warn) for security-critical writes.
 *
 * Scans TerraFusion.Security .cs files for methods that perform state-
 * mutating operations (Create, Update, Delete, Rotate, Revoke, Set,
 * Encrypt, Decrypt, etc.) and verifies they reference a structured
 * audit service (IAuditService or ISecurityAuditService), not just
 * ILogger.
 *
 * Known gaps are documented in KNOWN_EXEMPTIONS below. If a NEW file
 * introduces a security write without audit coverage, the gate BLOCKS.
 * The known-gap count is tracked and must not increase.
 *
 * Usage: node tools/gates/trace-coverage-gate.mjs
 * Exit:  0 = all pass, 1 = any failure
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const SECURITY_SRC = join(REPO_ROOT, 'backend', 'TerraFusion.Security');

// ─── Write-method pattern (security-critical mutations) ─────────────
const WRITE_METHOD_PATTERN =
  /(?:Create|Update|Delete|Rotate|Revoke|Grant|Encrypt|Decrypt|Set|Restore|Backup|Renew|Install|Block|Disable|Enable|Blacklist|Archive|Handle|Remediate).*Async\s*\(/;

// ─── Audit service markers (structured trace emission) ──────────────
const AUDIT_MARKERS = ['IAuditService', 'ISecurityAuditService'];

// ─── Known exemptions with documented reasons ───────────────────────
// These files have write methods but lack audit-service integration.
// They are tracked as technical debt; removing them from this list after
// remediation will not break the gate. Adding NEW entries WILL fail.
const KNOWN_EXEMPTIONS = new Map([
  ['Services/DisasterRecoveryService.cs', 'Backup/restore operations — audit remediation planned'],
  [
    'Services/EliteSecurityHardeningService.cs',
    'Security policy mutations — audit remediation planned',
  ],
  [
    'Services/PostgresPerformanceService.cs',
    'Infrastructure config mutations — audit remediation planned',
  ],
]);

// Maximum allowed known exemptions (ratchet: can only decrease)
const MAX_KNOWN_EXEMPTIONS = 3;

// ─── File collector ─────────────────────────────────────────────────
function collectCsFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'bin' && entry.name !== 'obj') {
      files.push(...collectCsFiles(full));
    } else if (entry.name.endsWith('.cs')) {
      files.push(full);
    }
  }
  return files;
}

// ─── Gate runner ────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function rule(ok, label) {
  if (ok) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

console.log('🔍 Trace Coverage Gate — Phase 7.6\n');
console.log('Policy: BLOCK — security-critical writes MUST emit structured audit traces.\n');

// ─── Rule 1: Security source directory exists ───────────────────────
console.log('── 1. Security Module ──');
rule(existsSync(SECURITY_SRC), 'backend/TerraFusion.Security/ exists');

if (!existsSync(SECURITY_SRC)) {
  console.log('\n❌ Trace Coverage Gate FAILED — security module not found');
  process.exit(1);
}

// ─── Rule 2: Scan all .cs files ─────────────────────────────────────
console.log('\n── 2. Write-Method Scan ──');
const csFiles = collectCsFiles(SECURITY_SRC).sort();
rule(csFiles.length > 0, `Found ${csFiles.length} .cs files to scan`);

const filesWithWrites = [];
const filesWithAudit = [];
const filesMissingAudit = [];

for (const filePath of csFiles) {
  const content = readFileSync(filePath, 'utf8');
  const relPath = relative(SECURITY_SRC, filePath).replace(/\\/g, '/');

  // Skip interface-only files (they declare signatures, not implementations)
  if (/^Interfaces[/\\]/.test(relPath) || /^\s*public\s+interface\s+/m.test(content)) {
    const hasClass = /^\s*public\s+class\s+/m.test(content);
    if (!hasClass) continue;
  }

  // Check for write methods
  if (!WRITE_METHOD_PATTERN.test(content)) continue;
  filesWithWrites.push(relPath);

  // Check for audit service reference
  const hasAudit = AUDIT_MARKERS.some(marker => content.includes(marker));
  if (hasAudit) {
    filesWithAudit.push(relPath);
  } else {
    filesMissingAudit.push(relPath);
  }
}

rule(filesWithWrites.length > 0, `${filesWithWrites.length} files contain write methods`);
console.log(`  📊 With audit coverage: ${filesWithAudit.length}`);
console.log(`  📊 Missing audit coverage: ${filesMissingAudit.length}`);

// ─── Rule 3: No NEW unaudited files (regression check) ─────────────
console.log('\n── 3. Regression Check (BLOCK tier) ──');
const newGaps = filesMissingAudit.filter(f => !KNOWN_EXEMPTIONS.has(f));

if (newGaps.length === 0) {
  rule(true, 'No NEW security writes without audit coverage');
} else {
  for (const gap of newGaps) {
    rule(false, `NEW unaudited write: ${gap}`);
  }
}

// ─── Rule 4: Known exemptions count has not grown ───────────────────
console.log('\n── 4. Exemption Ratchet ──');
const activeExemptions = filesMissingAudit.filter(f => KNOWN_EXEMPTIONS.has(f));
rule(
  activeExemptions.length <= MAX_KNOWN_EXEMPTIONS,
  `Active exemptions: ${activeExemptions.length} ≤ ${MAX_KNOWN_EXEMPTIONS} max`
);

if (activeExemptions.length > 0) {
  console.log('  📋 Known exemptions (tracked technical debt):');
  for (const f of activeExemptions) {
    console.log(`     ⚠️  ${f} — ${KNOWN_EXEMPTIONS.get(f)}`);
  }
}

// ─── Rule 5: Audit service exists and has core methods ──────────────
console.log('\n── 5. Audit Service Presence ──');
const auditServiceFile = join(SECURITY_SRC, 'ProductionAuditService.cs');
const auditServiceExists = existsSync(auditServiceFile);
rule(auditServiceExists, 'ProductionAuditService.cs exists');

if (auditServiceExists) {
  const auditContent = readFileSync(auditServiceFile, 'utf8');
  rule(auditContent.includes('LogAuditEventAsync'), 'LogAuditEventAsync method present');
  rule(
    auditContent.includes('LogAuthenticationAttemptAsync') ||
      auditContent.includes('LogSecurityViolationAsync'),
    'Security-specific audit methods present'
  );
  rule(
    auditContent.includes('Hash') || auditContent.includes('tamper'),
    'Tamper-detection hash on audit entries'
  );
}

// ─── Rule 6: Middleware audit coverage ──────────────────────────────
console.log('\n── 6. Middleware Trace Coverage ──');
const middlewareDir = join(SECURITY_SRC, 'Middleware');
if (existsSync(middlewareDir)) {
  const middlewareFiles = readdirSync(middlewareDir).filter(f => f.endsWith('.cs'));
  let allHaveAudit = true;
  for (const f of middlewareFiles) {
    const content = readFileSync(join(middlewareDir, f), 'utf8');
    const hasAudit = AUDIT_MARKERS.some(m => content.includes(m));
    if (!hasAudit && content.includes('InvokeAsync')) {
      allHaveAudit = false;
      rule(false, `Middleware ${f} missing audit service`);
    }
  }
  if (allHaveAudit) {
    rule(true, 'All middleware files have audit coverage');
  }
} else {
  rule(true, 'No middleware directory (skipped)');
}

// ─── Rule 7: Coverage ratio (excluding known exemptions) ────────────
console.log('\n── 7. Coverage Ratio ──');
if (filesWithWrites.length > 0) {
  const nonExemptTotal = filesWithWrites.filter(f => !KNOWN_EXEMPTIONS.has(f)).length;
  const nonExemptCovered = filesWithAudit.length; // all audited files are non-exempt by definition
  const ratio = nonExemptTotal > 0 ? nonExemptCovered / nonExemptTotal : 1;
  const pct = Math.round(ratio * 100);
  rule(
    ratio >= 0.9,
    `Non-exempt audit coverage: ${pct}% (${nonExemptCovered}/${nonExemptTotal}, ≥90% required)`
  );

  // Also report overall for transparency
  const overallPct = Math.round((filesWithAudit.length / filesWithWrites.length) * 100);
  console.log(
    `  📊 Overall coverage (incl. exemptions): ${overallPct}% (${filesWithAudit.length}/${filesWithWrites.length})`
  );
}

// ─── Summary ────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n── Summary: ${passed}/${total} rules passed ──`);

if (failed > 0) {
  console.log(`\n❌ Trace Coverage Gate FAILED (${failed} violation(s))`);
  process.exit(1);
} else {
  console.log('\n✅ Trace Coverage Gate PASSED');
  console.log(`   Policy: BLOCK enforced — new security writes without audit will fail.`);
  console.log(`   Known gaps: ${activeExemptions.length} (ratchet max: ${MAX_KNOWN_EXEMPTIONS})`);
  process.exit(0);
}

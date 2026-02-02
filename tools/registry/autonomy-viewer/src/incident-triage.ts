/**
 * Phase 4N28 — Incident Triage Kit CLI
 *
 * One-command triage for autonomy incidents. Produces a standardized
 * incident packet (JSON + Markdown + HTML) that's auditor-ready.
 *
 * Usage:
 *   pnpm perf:triage --zip <bundle.zip> --out <dir>
 *   pnpm perf:triage --zip <bundle.zip> --policy-from-index <index.json> --strict
 *   pnpm perf:triage --zip <bundle.zip> --emit-packet
 *
 * Options:
 *   --zip <path>              Evidence bundle (.zip or -sealed.zip)
 *   --policy-from-index <p>   Evidence index JSON for policy extraction
 *   --out <dir>               Output directory (default: ./dist/triage)
 *   --strict                  Fail if any verification fails
 *   --verify-signatures       Verify .sig/.crt/.bundle triplet
 *   --emit-packet             Produce incident-packet.zip with all artifacts
 *   --emit-html               Include HTML report (default: true)
 *   --verbose                 Verbose output
 *   --json                    Output JSON only (for CI)
 *
 * Exit codes:
 *   0 = Triage complete, all verifications passed
 *   1 = Triage complete, but verifications failed (still produces reports)
 *   2 = Invalid arguments or fatal error
 *
 * @module incident-triage
 * @governance SEAL-COMPLIANT
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from './manifest.js';
import { readZipEntries, readZipFileData } from './zip/zip-reader.js';
import { buildDeterministicZip } from './zip/zip-writer.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema Constants
// ─────────────────────────────────────────────────────────────────────────────

export const INCIDENT_REPORT_SCHEMA = 'terrafusion.autonomy.incident.report.v1';
export const TOOL_VERSION = '4N28.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types: Incident Report Schema
// ─────────────────────────────────────────────────────────────────────────────

export interface IncidentReportInputs {
  bundleName: string;
  sealed: boolean;
  evidenceIndexSource?: string;
  releaseTag?: string;
  runId?: string;
}

export interface HashSummary {
  filesVerified: number;
  manifestSha256: string;
}

export interface PinningSummary {
  pinned: boolean;
  issuerOk?: boolean;
  identityOk?: boolean;
  repoOk?: boolean;
  workflowOk?: boolean;
  refOk?: boolean;
  shaOk?: boolean;
}

export interface BundleVerification {
  ok: boolean;
  strict: boolean;
  verifySignatures: boolean;
  hashSummary: HashSummary;
  pinningSummary: PinningSummary;
  errors: string[];
}

export interface CustodyVerification {
  present: boolean;
  ok: boolean;
  strict: boolean;
  errors: string[];
}

export interface SignatureVerification {
  mode: 'keyless' | 'none';
  tripletStatus: 'found' | 'missing' | 'partial';
  pinned: boolean;
  issuer?: string;
  identity?: string;
  repo?: string;
  workflowPath?: string;
  ref?: string;
  sha?: string;
  transparencyLog: {
    ok: boolean;
    rekorIncluded?: boolean;
    logIndex?: number;
  };
}

export interface TPIVerification {
  ok: boolean;
  minApprovals: number;
  approvers: string[];
  excludedApprovers: string[];
  reasons: string[];
}

export interface BreakGlassVerification {
  ok: boolean;
  approvalsEligible: number;
  securityApprovers: string[];
  cioApprovers: string[];
  noAutomerge: boolean;
  allowedActions: string[];
}

export interface RoleBindingVerification {
  ok: boolean;
  sourceHash?: string;
  securityRoleOk: boolean;
  cioRoleOk: boolean;
}

export interface GovernanceVerification {
  tpi: TPIVerification;
  breakGlass: BreakGlassVerification;
  roleBinding: RoleBindingVerification;
}

export interface AutonomyChange {
  planItemId: string;
  strategyId: string;
  finalCommitSha?: string;
  rollbackCommand?: string;
  diffStats?: { additions: number; deletions: number };
  gates: string[];
}

export interface TriageCommands {
  rollbackPreview?: string;
  rollbackExecute?: string;
  verifyBundle: string;
  verifyCustody?: string;
  verifySignatures?: string;
}

export interface IncidentReport {
  schema: typeof INCIDENT_REPORT_SCHEMA;
  generatedAt: string;
  toolVersion: string;
  inputs: IncidentReportInputs;
  verification: {
    bundle: BundleVerification;
    custody: CustodyVerification;
    signatures: SignatureVerification;
  };
  governance: GovernanceVerification;
  autonomyChange?: AutonomyChange;
  recommendedActions: string[];
  commands: TriageCommands;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: CLI Options
// ─────────────────────────────────────────────────────────────────────────────

interface TriageOptions {
  zipPath: string;
  outDir: string;
  policyFromIndex?: string;
  strict: boolean;
  verifySignatures: boolean;
  emitPacket: boolean;
  emitHtml: boolean;
  verbose: boolean;
  json: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(): TriageOptions | null {
  const args = process.argv.slice(2);
  let zipPath = '';
  let outDir = resolve('./dist/triage');
  let policyFromIndex: string | undefined;
  let strict = false;
  let verifySignatures = false;
  let emitPacket = false;
  let emitHtml = true;
  let verbose = false;
  let json = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--zip' && args[i + 1]) {
      zipPath = args[++i];
    } else if (arg === '--out' && args[i + 1]) {
      outDir = resolve(args[++i]);
    } else if (arg === '--policy-from-index' && args[i + 1]) {
      policyFromIndex = args[++i];
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--verify-signatures' || arg === '--signatures') {
      verifySignatures = true;
    } else if (arg === '--emit-packet') {
      emitPacket = true;
    } else if (arg === '--emit-html') {
      emitHtml = true;
    } else if (arg === '--no-html') {
      emitHtml = false;
    } else if (arg === '--verbose') {
      verbose = true;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!zipPath) {
    return null;
  }

  return {
    zipPath: resolve(zipPath),
    outDir,
    policyFromIndex: policyFromIndex ? resolve(policyFromIndex) : undefined,
    strict,
    verifySignatures,
    emitPacket,
    emitHtml,
    verbose,
    json,
  };
}

function printHelp(): void {
  console.log(`
TerraFusion Incident Triage Kit (Phase 4N28)

One-command triage for autonomy incidents. Produces auditor-ready incident packets.

Usage:
  pnpm perf:triage --zip <bundle.zip> [options]

Required:
  --zip <path>              Evidence bundle (.zip or -sealed.zip)

Options:
  --out <dir>               Output directory (default: ./dist/triage)
  --policy-from-index <p>   Evidence index JSON for policy extraction
  --strict                  Fail if any verification fails
  --verify-signatures       Verify .sig/.crt/.bundle triplet
  --emit-packet             Produce incident-packet.zip with all artifacts
  --emit-html               Include HTML report (default: true)
  --no-html                 Skip HTML report
  --verbose                 Verbose output
  --json                    Output JSON only (for CI)
  --help, -h                Show this help

Exit codes:
  0 = Triage complete, all verifications passed
  1 = Triage complete, but verifications failed
  2 = Invalid arguments or fatal error

Examples:
  # Basic offline triage
  pnpm perf:triage --zip autonomy-evidence-bundle-12345.zip

  # Strongest mode (strict + signatures + pins)
  pnpm perf:triage \\
    --zip autonomy-evidence-bundle-12345-sealed.zip \\
    --policy-from-index ./evidence-index.json \\
    --strict --verify-signatures --emit-packet
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe Command Escaping (No shell metacharacters)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Forbidden shell characters that must never appear in emitted commands.
 */
const FORBIDDEN_SHELL_CHARS = /[;&|`$(){}[\]<>!'"\\]/g;

/**
 * Sanitize a string for safe inclusion in shell commands.
 * Removes all potentially dangerous characters.
 */
export function sanitizeForShell(input: string): string {
  return input.replace(FORBIDDEN_SHELL_CHARS, '').replace(/\s+/g, '-');
}

/**
 * Dangerous command patterns that should never be emitted.
 * These patterns catch known dangerous operations even without shell metacharacters.
 */
const DANGEROUS_PATTERNS = [
  /\brm\s+(-[a-zA-Z]*)?r/i, // rm -r, rm -rf, rm -fr, etc.
  /\bwget\b/i, // wget (network download)
  /\bcurl\b/i, // curl (network download)
  /\bchmod\s+[0-7]*7/i, // chmod with world-writable
  /\bchown\b/i, // chown (privilege escalation)
  /\bsudo\b/i, // sudo (privilege escalation)
  /\bdd\s+/i, // dd (disk destroyer)
  /\bmkfs\b/i, // mkfs (format disk)
  /\bformat\b/i, // format (Windows)
  /\/etc\/passwd/i, // passwd file access
  /\/etc\/shadow/i, // shadow file access
];

/**
 * Validate that a command contains no forbidden shell characters
 * and no dangerous command patterns.
 */
export function validateCommand(cmd: string): boolean {
  // Check for forbidden metacharacters
  if (FORBIDDEN_SHELL_CHARS.test(cmd)) {
    return false;
  }
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(cmd)) {
      return false;
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// PII Detection (same as evidence-index.ts)
// ─────────────────────────────────────────────────────────────────────────────

const PII_PATTERNS = [
  /email/i, // matches email, user_email, emailAddress
  /password/i, // matches password, userPassword
  /\bssn\b/i,
  /social.?security/i,
  /phone/i, // matches phone, phone_number, phoneNumber
  /address/i, // matches address, home_address, mailingAddress
  /credit.?card/i,
  /date.?of.?birth/i,
  /\bdob\b/i,
  /driver.?licen[sc]e/i, // matches driver_license, driverLicense, drivers_licence
];

/**
 * Check if a string contains potential PII field names.
 */
export function containsPII(text: string): boolean {
  return PII_PATTERNS.some(pattern => pattern.test(text));
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Index Loading
// ─────────────────────────────────────────────────────────────────────────────

interface EvidenceIndexData {
  runId?: string;
  releaseTag?: string;
  incident?: boolean;
  tpi?: {
    ok: boolean;
    minApprovals: number;
    approverLogins?: string[];
    excludedLogins?: string[];
  };
  breakGlass?: {
    activated: boolean;
    ok: boolean;
    reason?: string;
    approvers?: string[];
    noAutomerge?: boolean;
    allowedActions?: string[];
  };
  roleBinding?: {
    ok: boolean;
    sourceHash?: string;
    approverRoles?: {
      security?: string[];
      cio?: string[];
    };
  };
  expectedSignaturePolicy?: {
    issuer?: string;
    identity?: string;
    repo?: string;
    workflowPath?: string;
    ref?: string;
    sha?: string;
  };
  signingMode?: 'full' | 'primary' | 'none';
  records?: Array<{
    status?: string;
    bundle?: {
      name?: string;
      manifestSha256?: string;
      verify?: { ok?: boolean; strict?: boolean };
    };
    applyProof?: {
      planItemId?: string;
      strategyId?: string;
      finalCommitSha?: string;
      rollbackCommand?: string;
    };
    retention?: { tier?: string };
  }>;
  assets?: {
    bundleZip?: {
      signature?: {
        identity?: string;
        issuer?: string;
        verified?: boolean;
        rekor?: {
          bundleValid?: boolean;
          logIndex?: number;
        };
      };
    };
  };
}

function loadEvidenceIndex(indexPath: string): EvidenceIndexData | null {
  try {
    const content = readFileSync(indexPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bundle Verification (reusing existing modules)
// ─────────────────────────────────────────────────────────────────────────────

function verifyBundleIntegrity(
  zipData: Buffer,
  bundleName: string,
  _opts: TriageOptions
): { ok: boolean; manifestSha: string; filesVerified: number; errors: string[] } {
  const errors: string[] = [];

  // Parse ZIP structure
  const zipResult = readZipEntries(zipData);
  if (!zipResult.ok) {
    return { ok: false, manifestSha: '', filesVerified: 0, errors: ['Invalid ZIP structure'] };
  }

  // Find MANIFEST.json
  const manifestEntry = zipResult.entries.find(e => e.path === 'MANIFEST.json');
  if (!manifestEntry) {
    return { ok: false, manifestSha: '', filesVerified: 0, errors: ['MANIFEST.json not found'] };
  }

  // Read manifest
  const manifestData = readZipFileData(zipData, manifestEntry);
  if (!manifestData) {
    return {
      ok: false,
      manifestSha: '',
      filesVerified: 0,
      errors: ['Failed to read MANIFEST.json'],
    };
  }

  const manifestSha = sha256(manifestData);

  let manifest: { schema?: string; files?: Array<{ path: string; sha256: string }> };
  try {
    manifest = JSON.parse(manifestData.toString('utf8'));
  } catch {
    return {
      ok: false,
      manifestSha,
      filesVerified: 0,
      errors: ['MANIFEST.json is not valid JSON'],
    };
  }

  // Validate schema
  if (manifest.schema !== 'terrafusion.autonomy.evidence.v1') {
    errors.push(
      `Schema mismatch: expected terrafusion.autonomy.evidence.v1, got ${manifest.schema}`
    );
  }

  // Verify files
  const manifestPaths = new Set<string>();
  let filesVerified = 0;

  for (const file of manifest.files || []) {
    manifestPaths.add(file.path);
    if (file.path === 'MANIFEST.json') continue;

    const entry = zipResult.entries.find(e => e.path === file.path);
    if (!entry) {
      errors.push(`File missing: ${file.path}`);
      continue;
    }

    const data = readZipFileData(zipData, entry);
    if (!data) {
      errors.push(`Failed to read: ${file.path}`);
      continue;
    }

    const actualSha = sha256(data);
    if (actualSha !== file.sha256) {
      errors.push(`Hash mismatch: ${file.path}`);
      continue;
    }

    filesVerified++;
  }

  return { ok: errors.length === 0, manifestSha, filesVerified, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// Custody Attestation Check
// ─────────────────────────────────────────────────────────────────────────────

function checkCustodyAttestation(zipData: Buffer): {
  present: boolean;
  ok: boolean;
  errors: string[];
} {
  const zipResult = readZipEntries(zipData);
  if (!zipResult.ok) {
    return { present: false, ok: false, errors: ['Invalid ZIP'] };
  }

  const custodyEntry = zipResult.entries.find(
    e => e.path === 'custody-attestation.json' || e.path.endsWith('/custody-attestation.json')
  );

  if (!custodyEntry) {
    return { present: false, ok: true, errors: [] };
  }

  const data = readZipFileData(zipData, custodyEntry);
  if (!data) {
    return { present: true, ok: false, errors: ['Failed to read custody-attestation.json'] };
  }

  try {
    const custody = JSON.parse(data.toString('utf8'));
    if (custody.schema !== 'terrafusion.autonomy.custody.v1') {
      return { present: true, ok: false, errors: ['Invalid custody schema'] };
    }
    return { present: true, ok: true, errors: [] };
  } catch {
    return { present: true, ok: false, errors: ['custody-attestation.json is not valid JSON'] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommended Actions Generator
// ─────────────────────────────────────────────────────────────────────────────

function generateRecommendedActions(
  bundleOk: boolean,
  custodyOk: boolean,
  hasRollback: boolean,
  isIncident: boolean,
  tpiOk: boolean,
  breakGlassOk: boolean
): string[] {
  const actions: string[] = [];

  // Always start with review
  actions.push('REVIEW_PROOF');

  // Verification actions based on status
  if (!bundleOk) {
    actions.push('INVESTIGATE_BUNDLE_INTEGRITY');
  }

  if (!custodyOk) {
    actions.push('INVESTIGATE_CUSTODY_CHAIN');
  }

  // TPI/Break-glass actions
  if (!tpiOk && !breakGlassOk) {
    actions.push('VERIFY_APPROVAL_CHAIN');
  }

  // Rollback actions if applicable
  if (hasRollback) {
    actions.push('RUN_ROLLBACK_PREVIEW');
    actions.push('EXECUTE_ROLLBACK_IF_REQUIRED');
  }

  // Incident-specific actions
  if (isIncident) {
    actions.push('REPUBLISH_EVIDENCE');
    actions.push('ARCHIVE_TO_INCIDENT_TIER');
  }

  return actions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build Incident Report
// ─────────────────────────────────────────────────────────────────────────────

export function buildIncidentReport(
  opts: TriageOptions,
  bundleName: string,
  bundleVerify: { ok: boolean; manifestSha: string; filesVerified: number; errors: string[] },
  custodyCheck: { present: boolean; ok: boolean; errors: string[] },
  indexData: EvidenceIndexData | null
): IncidentReport {
  const isSealed = bundleName.includes('-sealed');
  const record = indexData?.records?.[0];
  const signature = indexData?.assets?.bundleZip?.signature;
  const policy = indexData?.expectedSignaturePolicy;

  // Build verification block
  const verification = {
    bundle: {
      ok: bundleVerify.ok,
      strict: opts.strict,
      verifySignatures: opts.verifySignatures,
      hashSummary: {
        filesVerified: bundleVerify.filesVerified,
        manifestSha256: bundleVerify.manifestSha,
      },
      pinningSummary: {
        pinned: !!(policy?.issuer && policy?.identity),
        issuerOk: policy?.issuer ? true : undefined,
        identityOk: policy?.identity ? true : undefined,
        repoOk: policy?.repo ? true : undefined,
        workflowOk: policy?.workflowPath ? true : undefined,
        refOk: policy?.ref ? true : undefined,
        shaOk: policy?.sha ? true : undefined,
      },
      errors: bundleVerify.errors,
    },
    custody: {
      present: custodyCheck.present,
      ok: custodyCheck.ok,
      strict: opts.strict,
      errors: custodyCheck.errors,
    },
    signatures: {
      mode: (indexData?.signingMode === 'none' ? 'none' : 'keyless') as 'keyless' | 'none',
      tripletStatus: signature ? 'found' : ('missing' as 'found' | 'missing' | 'partial'),
      pinned: !!(policy?.issuer && policy?.identity),
      issuer: signature?.issuer || policy?.issuer,
      identity: signature?.identity || policy?.identity,
      repo: policy?.repo,
      workflowPath: policy?.workflowPath,
      ref: policy?.ref,
      sha: policy?.sha,
      transparencyLog: {
        ok: signature?.rekor?.bundleValid ?? false,
        rekorIncluded: signature?.rekor?.bundleValid,
        logIndex: signature?.rekor?.logIndex,
      },
    },
  };

  // Build governance block
  const governance: GovernanceVerification = {
    tpi: {
      ok: indexData?.tpi?.ok ?? false,
      minApprovals: indexData?.tpi?.minApprovals ?? 2,
      approvers: indexData?.tpi?.approverLogins ?? [],
      excludedApprovers: indexData?.tpi?.excludedLogins ?? [],
      reasons: [],
    },
    breakGlass: {
      ok: indexData?.breakGlass?.ok ?? false,
      approvalsEligible: indexData?.breakGlass?.approvers?.length ?? 0,
      securityApprovers: indexData?.roleBinding?.approverRoles?.security ?? [],
      cioApprovers: indexData?.roleBinding?.approverRoles?.cio ?? [],
      noAutomerge: indexData?.breakGlass?.noAutomerge ?? true,
      allowedActions: indexData?.breakGlass?.allowedActions ?? [],
    },
    roleBinding: {
      ok: indexData?.roleBinding?.ok ?? false,
      sourceHash: indexData?.roleBinding?.sourceHash,
      securityRoleOk: (indexData?.roleBinding?.approverRoles?.security?.length ?? 0) > 0,
      cioRoleOk: (indexData?.roleBinding?.approverRoles?.cio?.length ?? 0) > 0,
    },
  };

  // Build autonomy change block if applied
  let autonomyChange: AutonomyChange | undefined;
  if (record?.applyProof && record.status === 'applied') {
    autonomyChange = {
      planItemId: record.applyProof.planItemId ?? 'unknown',
      strategyId: record.applyProof.strategyId ?? 'unknown',
      finalCommitSha: record.applyProof.finalCommitSha,
      rollbackCommand: record.applyProof.rollbackCommand,
      gates: ['type-check', 'lint', 'test'],
    };
  }

  // Build triage commands
  const safeBundleName = sanitizeForShell(bundleName);
  const commands: TriageCommands = {
    verifyBundle: `pnpm perf:verify-bundle --zip ${safeBundleName} --strict`,
  };

  if (custodyCheck.present) {
    commands.verifyCustody = `pnpm perf:verify-custody --in ./extracted --strict`;
  }

  if (opts.verifySignatures) {
    commands.verifySignatures = `pnpm perf:verify-bundle --zip ${safeBundleName} --verify-signatures --policy-from-index evidence-index.json`;
  }

  if (autonomyChange?.rollbackCommand) {
    const safeRollback = sanitizeForShell(autonomyChange.rollbackCommand);
    commands.rollbackPreview = `git log --oneline -1 ${safeRollback.split(' ').pop() || ''}`;
    commands.rollbackExecute = safeRollback;
  }

  // Recommended actions
  const recommendedActions = generateRecommendedActions(
    bundleVerify.ok,
    custodyCheck.ok,
    !!autonomyChange?.rollbackCommand,
    indexData?.incident ?? false,
    indexData?.tpi?.ok ?? false,
    indexData?.breakGlass?.ok ?? false
  );

  return {
    schema: INCIDENT_REPORT_SCHEMA,
    generatedAt: new Date().toISOString(),
    toolVersion: TOOL_VERSION,
    inputs: {
      bundleName,
      sealed: isSealed,
      evidenceIndexSource: opts.policyFromIndex ? basename(opts.policyFromIndex) : undefined,
      releaseTag: indexData?.releaseTag,
      runId: indexData?.runId,
    },
    verification,
    governance,
    autonomyChange,
    recommendedActions,
    commands,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown Report Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateMarkdownReport(report: IncidentReport): string {
  const lines: string[] = [];

  lines.push('# Autonomy Incident Triage Report');
  lines.push('');
  lines.push(`**Generated:** ${report.generatedAt}`);
  lines.push(`**Tool Version:** ${report.toolVersion}`);
  lines.push(`**Bundle:** ${report.inputs.bundleName}`);
  if (report.inputs.releaseTag) {
    lines.push(`**Release Tag:** ${report.inputs.releaseTag}`);
  }
  lines.push('');

  // Summary status
  const allOk = report.verification.bundle.ok && report.verification.custody.ok;
  lines.push(`## Status: ${allOk ? '✅ VERIFIED' : '⚠️ NEEDS REVIEW'}`);
  lines.push('');

  // Verification section
  lines.push('## Verification Results');
  lines.push('');
  lines.push('| Check | Status | Details |');
  lines.push('|-------|--------|---------|');
  lines.push(
    `| Bundle Integrity | ${report.verification.bundle.ok ? '✅' : '❌'} | ${report.verification.bundle.hashSummary.filesVerified} files verified |`
  );
  lines.push(
    `| Custody Chain | ${!report.verification.custody.present ? '—' : report.verification.custody.ok ? '✅' : '❌'} | ${report.verification.custody.present ? 'Present' : 'Not present'} |`
  );
  lines.push(
    `| Signatures | ${report.verification.signatures.tripletStatus === 'found' ? '✅' : '—'} | ${report.verification.signatures.mode} mode |`
  );
  lines.push(
    `| Identity Pinning | ${report.verification.bundle.pinningSummary.pinned ? '✅' : '—'} | ${report.verification.bundle.pinningSummary.pinned ? 'Pinned' : 'Not pinned'} |`
  );
  lines.push(
    `| Rekor Anchored | ${report.verification.signatures.transparencyLog.ok ? '✅' : '—'} | ${report.verification.signatures.transparencyLog.logIndex ?? 'N/A'} |`
  );
  lines.push('');

  // Governance section
  lines.push('## Governance Status');
  lines.push('');
  lines.push('| Control | Status | Details |');
  lines.push('|---------|--------|---------|');
  lines.push(
    `| TPI (Two-Person) | ${report.governance.tpi.ok ? '✅' : '❌'} | ${report.governance.tpi.approvers.length} approvers |`
  );
  lines.push(
    `| Break-Glass | ${report.governance.breakGlass.ok ? '✅' : '—'} | ${report.governance.breakGlass.approvalsEligible} eligible |`
  );
  lines.push(
    `| Role Binding | ${report.governance.roleBinding.ok ? '✅' : '—'} | Security: ${report.governance.roleBinding.securityRoleOk ? '✅' : '❌'}, CIO: ${report.governance.roleBinding.cioRoleOk ? '✅' : '❌'} |`
  );
  lines.push('');

  // Autonomy change section
  if (report.autonomyChange) {
    lines.push('## Autonomy Change');
    lines.push('');
    lines.push(`- **Plan Item:** ${report.autonomyChange.planItemId}`);
    lines.push(`- **Strategy:** ${report.autonomyChange.strategyId}`);
    if (report.autonomyChange.finalCommitSha) {
      lines.push(`- **Commit:** \`${report.autonomyChange.finalCommitSha}\``);
    }
    lines.push('');
  }

  // Recommended actions
  lines.push('## Recommended Actions');
  lines.push('');
  for (let i = 0; i < report.recommendedActions.length; i++) {
    lines.push(`${i + 1}. ${report.recommendedActions[i].replace(/_/g, ' ')}`);
  }
  lines.push('');

  // Commands section
  lines.push('## Commands');
  lines.push('');
  lines.push('### Verify Bundle');
  lines.push('```bash');
  lines.push(report.commands.verifyBundle);
  lines.push('```');
  lines.push('');

  if (report.commands.verifyCustody) {
    lines.push('### Verify Custody');
    lines.push('```bash');
    lines.push(report.commands.verifyCustody);
    lines.push('```');
    lines.push('');
  }

  if (report.commands.rollbackPreview) {
    lines.push('### Rollback Preview');
    lines.push('```bash');
    lines.push(report.commands.rollbackPreview);
    lines.push('```');
    lines.push('');
  }

  if (report.commands.rollbackExecute) {
    lines.push('### Execute Rollback');
    lines.push('```bash');
    lines.push(report.commands.rollbackExecute);
    lines.push('```');
    lines.push('');
  }

  // Errors section (if any)
  const allErrors = [...report.verification.bundle.errors, ...report.verification.custody.errors];
  if (allErrors.length > 0) {
    lines.push('## Errors');
    lines.push('');
    for (const error of allErrors) {
      lines.push(`- ❌ ${error}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*This report is generated for auditor review. Do not trust labels; trust proofs.*');
  lines.push('');

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Report Generator
// ─────────────────────────────────────────────────────────────────────────────

export function generateHtmlReport(report: IncidentReport): string {
  const allOk = report.verification.bundle.ok && report.verification.custody.ok;
  const statusColor = allOk ? '#065f46' : '#7f1d1d';
  const statusBg = allOk ? '#d1fae5' : '#fee2e2';
  const statusText = allOk ? '✅ VERIFIED' : '⚠️ NEEDS REVIEW';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Incident Triage Report - ${escapeHtml(report.inputs.bundleName)}</title>
  <style>
    :root {
      --color-bg: #ffffff;
      --color-text: #1f2937;
      --color-border: #e5e7eb;
      --color-success: #065f46;
      --color-error: #7f1d1d;
      --color-warning: #92400e;
      --font-mono: 'SF Mono', Consolas, monospace;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --color-bg: #111827;
        --color-text: #f9fafb;
        --color-border: #374151;
        --color-success: #34d399;
        --color-error: #f87171;
        --color-warning: #fbbf24;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--color-bg);
      color: var(--color-text);
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    h2 { font-size: 1.25rem; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; }
    .status-banner {
      background: ${statusBg};
      color: ${statusColor};
      padding: 1rem;
      border-radius: 8px;
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    .meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 1rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.875rem; }
    th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--color-border); }
    th { background: var(--color-border); font-weight: 600; }
    .cmd { background: var(--color-border); padding: 0.75rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.8rem; overflow-x: auto; margin: 0.5rem 0; }
    .actions { list-style: decimal; padding-left: 1.5rem; }
    .actions li { margin: 0.25rem 0; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--color-border); font-size: 0.75rem; color: #6b7280; }
  </style>
</head>
<body>
  <h1>🔍 Incident Triage Report</h1>
  <div class="meta">
    Generated: ${escapeHtml(report.generatedAt)} | Tool: ${escapeHtml(report.toolVersion)} | Bundle: ${escapeHtml(report.inputs.bundleName)}
  </div>
  <div class="status-banner">${statusText}</div>

  <h2>Verification Results</h2>
  <table>
    <tr><th>Check</th><th>Status</th><th>Details</th></tr>
    <tr><td>Bundle Integrity</td><td>${report.verification.bundle.ok ? '✅' : '❌'}</td><td>${report.verification.bundle.hashSummary.filesVerified} files verified</td></tr>
    <tr><td>Custody Chain</td><td>${!report.verification.custody.present ? '—' : report.verification.custody.ok ? '✅' : '❌'}</td><td>${report.verification.custody.present ? 'Present' : 'Not present'}</td></tr>
    <tr><td>Signatures</td><td>${report.verification.signatures.tripletStatus === 'found' ? '✅' : '—'}</td><td>${report.verification.signatures.mode} mode</td></tr>
    <tr><td>Identity Pinning</td><td>${report.verification.bundle.pinningSummary.pinned ? '✅' : '—'}</td><td>${report.verification.bundle.pinningSummary.pinned ? 'Pinned' : 'Not pinned'}</td></tr>
  </table>

  <h2>Governance Status</h2>
  <table>
    <tr><th>Control</th><th>Status</th><th>Details</th></tr>
    <tr><td>TPI (Two-Person)</td><td>${report.governance.tpi.ok ? '✅' : '❌'}</td><td>${report.governance.tpi.approvers.length} approvers</td></tr>
    <tr><td>Break-Glass</td><td>${report.governance.breakGlass.ok ? '✅' : '—'}</td><td>${report.governance.breakGlass.approvalsEligible} eligible</td></tr>
    <tr><td>Role Binding</td><td>${report.governance.roleBinding.ok ? '✅' : '—'}</td><td>Security: ${report.governance.roleBinding.securityRoleOk ? '✅' : '❌'}, CIO: ${report.governance.roleBinding.cioRoleOk ? '✅' : '❌'}</td></tr>
  </table>

  <h2>Recommended Actions</h2>
  <ol class="actions">
    ${report.recommendedActions.map(a => `<li>${escapeHtml(a.replace(/_/g, ' '))}</li>`).join('\n    ')}
  </ol>

  <h2>Commands</h2>
  <p>Verify Bundle:</p>
  <pre class="cmd">${escapeHtml(report.commands.verifyBundle)}</pre>
  ${report.commands.rollbackExecute ? `<p>Execute Rollback:</p><pre class="cmd">${escapeHtml(report.commands.rollbackExecute)}</pre>` : ''}

  <div class="footer">
    <p>This report is generated for auditor review. Do not trust labels; trust proofs.</p>
    <p>Government. Transcended.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────────────────────────
// Incident Packet Bundler
// ─────────────────────────────────────────────────────────────────────────────

interface PacketFile {
  name: string;
  data: Buffer;
}

export function buildIncidentPacket(
  report: IncidentReport,
  reportJson: string,
  reportMd: string,
  reportHtml: string | null,
  evidenceIndex: Buffer | null
): Buffer {
  const files: PacketFile[] = [];

  // Add reports
  files.push({ name: 'incident-report.json', data: Buffer.from(reportJson, 'utf8') });
  files.push({ name: 'incident-report.md', data: Buffer.from(reportMd, 'utf8') });
  if (reportHtml) {
    files.push({ name: 'incident-report.html', data: Buffer.from(reportHtml, 'utf8') });
  }

  // Add evidence index if present
  if (evidenceIndex) {
    files.push({ name: 'evidence-index.json', data: evidenceIndex });
  }

  // Build deterministic ZIP
  const zipEntries = files.map(f => ({
    zipPath: f.name,
    data: f.data,
  }));

  return buildDeterministicZip(zipEntries);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Triage Function
// ─────────────────────────────────────────────────────────────────────────────

export function runTriage(opts: TriageOptions): {
  report: IncidentReport;
  exitCode: number;
} {
  // Load bundle
  const zipData = readFileSync(opts.zipPath);
  const bundleName = basename(opts.zipPath);

  // Load evidence index if provided
  let indexData: EvidenceIndexData | null = null;
  let indexBuffer: Buffer | null = null;
  if (opts.policyFromIndex && existsSync(opts.policyFromIndex)) {
    indexData = loadEvidenceIndex(opts.policyFromIndex);
    indexBuffer = readFileSync(opts.policyFromIndex);
  }

  // Verify bundle integrity
  const bundleVerify = verifyBundleIntegrity(zipData, bundleName, opts);

  // Check custody attestation
  const custodyCheck = checkCustodyAttestation(zipData);

  // Build incident report
  const report = buildIncidentReport(opts, bundleName, bundleVerify, custodyCheck, indexData);

  // Determine exit code
  let exitCode = 0;
  if (opts.strict && (!bundleVerify.ok || !custodyCheck.ok)) {
    exitCode = 1;
  }

  // Write outputs
  if (!existsSync(opts.outDir)) {
    mkdirSync(opts.outDir, { recursive: true });
  }

  const reportJson = JSON.stringify(report, null, 2);
  const reportMd = generateMarkdownReport(report);
  const reportHtml = opts.emitHtml ? generateHtmlReport(report) : null;

  writeFileSync(join(opts.outDir, 'incident-report.json'), reportJson);
  writeFileSync(join(opts.outDir, 'incident-report.md'), reportMd);
  if (reportHtml) {
    writeFileSync(join(opts.outDir, 'incident-report.html'), reportHtml);
  }

  // Build packet if requested
  if (opts.emitPacket) {
    const packetZip = buildIncidentPacket(report, reportJson, reportMd, reportHtml, indexBuffer);
    const runIdSuffix = report.inputs.runId || sha256(zipData).substring(0, 12);
    const packetName = `autonomy-incident-packet-${sanitizeForShell(runIdSuffix)}.zip`;
    writeFileSync(join(opts.outDir, packetName), packetZip);
  }

  return { report, exitCode };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Main
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  const opts = parseArgs();

  if (!opts) {
    console.error('Usage: pnpm perf:triage --zip <bundle.zip> [options]');
    console.error('Try --help for more information.');
    process.exit(2);
  }

  if (!existsSync(opts.zipPath)) {
    console.error(`Error: Bundle not found: ${opts.zipPath}`);
    process.exit(2);
  }

  if (opts.verbose) {
    console.log('🔍 Phase 4N28: Incident Triage Kit');
    console.log(`  Bundle: ${opts.zipPath}`);
    console.log(`  Output: ${opts.outDir}`);
    if (opts.policyFromIndex) {
      console.log(`  Policy: ${opts.policyFromIndex}`);
    }
  }

  try {
    const { report, exitCode } = runTriage(opts);

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
    } else if (!opts.verbose) {
      const allOk = report.verification.bundle.ok && report.verification.custody.ok;
      console.log(`${allOk ? '✅' : '⚠️'} Triage complete: ${opts.outDir}`);
    } else {
      console.log('');
      console.log(`📋 Incident Report Generated`);
      console.log(`   Bundle OK: ${report.verification.bundle.ok ? '✅' : '❌'}`);
      console.log(
        `   Custody OK: ${report.verification.custody.present ? (report.verification.custody.ok ? '✅' : '❌') : '—'}`
      );
      console.log(`   Files: ${report.verification.bundle.hashSummary.filesVerified}`);
      console.log(`   Outputs: ${opts.outDir}/incident-report.{json,md,html}`);
      if (opts.emitPacket) {
        console.log(`   Packet: ${opts.outDir}/autonomy-incident-packet-*.zip`);
      }
    }

    process.exit(exitCode);
  } catch (err) {
    console.error('Fatal error during triage:', err);
    process.exit(2);
  }
}

// Run if invoked directly (not when imported for testing)
if (
  process.argv[1]?.endsWith('incident-triage.ts') ||
  process.argv[1]?.endsWith('incident-triage.js')
) {
  main();
}

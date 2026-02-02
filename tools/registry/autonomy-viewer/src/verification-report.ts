/**
 * Phase 4N43 — External Verification Report
 * ==========================================
 *
 * Schema and generator for court-admissible verification reports.
 * Designed for clean-room verification (no repo checkout) with deterministic
 * output suitable for signing and offline validation.
 *
 * Key Invariants:
 *   1. Report schema is stable and versioned
 *   2. Volatile fields (timestamps) are isolated for determinism
 *   3. Report digest excludes timestamps for reproducible hashing
 *   4. Error codes map 1:1 to attack/failure classes
 *   5. Verification environment is captured for reproducibility
 *
 * Usage:
 *   import { createVerificationReport, computeReportDigest } from './verification-report.js';
 */

import * as crypto from 'node:crypto';
import * as os from 'node:os';

// ─────────────────────────────────────────────────────────────────────────────
// Schema Constants
// ─────────────────────────────────────────────────────────────────────────────

export const VERIFICATION_REPORT_SCHEMA = 'terrafusion.autonomy.verification-report.v1';
export const VERIFICATION_REPORT_VERSION = '1.0.0';

// ─────────────────────────────────────────────────────────────────────────────
// Types: Verifier Environment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Captures the verification environment for reproducibility and audit trail.
 */
export interface VerifierEnvironment {
  /** Operating system platform (e.g., "linux", "win32", "darwin") */
  platform: string;
  /** OS release version */
  platformRelease: string;
  /** CPU architecture (e.g., "x64", "arm64") */
  arch: string;
  /** Node.js version */
  nodeVersion: string;
  /** Verifier tool version */
  toolVersion: string;
  /** Git commit/tag of the verifier tool (if available) */
  toolCommit?: string;
  /** Runner type (e.g., "github-actions", "local", "air-gapped") */
  runnerType: string;
  /** Runner name/label (if applicable) */
  runnerName?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Verification Result Codes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stable error codes for verification failures.
 * Each code maps to a specific attack/failure class for triage.
 */
export type VerificationErrorCode =
  // Asset-level errors
  | 'CASEFILE_NOT_FOUND'
  | 'CASEFILE_HASH_MISMATCH'
  | 'CASEFILE_CORRUPT'
  | 'MANIFEST_NOT_FOUND'
  | 'MANIFEST_HASH_MISMATCH'
  | 'MANIFEST_INVALID'
  | 'MANIFEST_SCHEMA_MISMATCH'
  // Triplet parity errors
  | 'TRIPLET_MISSING'
  | 'SIGNATURE_INVALID'
  | 'CERTIFICATE_INVALID'
  | 'BUNDLE_INVALID'
  // Chain continuity errors
  | 'LEDGER_HEAD_NOT_FOUND'
  | 'LEDGER_HEAD_INVALID'
  | 'LEDGER_HASH_MISMATCH'
  | 'LEDGER_CHAIN_BROKEN'
  | 'LEDGER_SEQUENCE_GAP'
  | 'RELEASE_CHAIN_BROKEN'
  | 'RELEASE_LINKAGE_INVALID'
  // Repo identity errors
  | 'REPO_ID_MISMATCH'
  | 'REPO_SLUG_MISMATCH'
  | 'DEFAULT_BRANCH_MISMATCH'
  // Policy errors
  | 'POLICY_MISMATCH'
  | 'ISSUER_MISMATCH'
  | 'IDENTITY_MISMATCH'
  | 'REF_MISMATCH'
  | 'SHA_MISMATCH'
  // Generic errors
  | 'DOWNLOAD_FAILED'
  | 'VERIFICATION_TIMEOUT'
  | 'UNKNOWN_ERROR';

/**
 * Error entry with code, message, and optional context.
 */
export interface VerificationError {
  code: VerificationErrorCode;
  message: string;
  /** Optional context for debugging */
  details?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Chain Status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ledger chain verification status.
 */
export interface LedgerChainStatus {
  ok: boolean;
  /** SHA256 of the verified ledger head */
  headSha256: string | null;
  /** SHA256 of the previous ledger (null for genesis) */
  previousSha256: string | null;
  /** Sequence number in the chain */
  sequenceNumber: number;
  /** Number of ledgers verified in the chain walk */
  chainDepthVerified: number;
}

/**
 * Release chain verification status.
 */
export interface ReleaseChainStatus {
  ok: boolean;
  /** Current release tag */
  releaseTag: string | null;
  /** Previous release tag (null for first release) */
  previousReleaseTag: string | null;
  /** SHA256 of the previous casefile */
  previousCasefileSha256: string | null;
  /** Depth of release chain verified */
  chainDepthVerified: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Repo Identity Observed
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Repository identity as observed in artifacts.
 */
export interface RepoIdentityObserved {
  /** GitHub repository numeric ID */
  repoId: number | null;
  /** Repository slug (owner/repo) */
  ownerRepo: string | null;
  /** Default branch */
  defaultBranch: string | null;
  /** Whether identity is consistent across all artifacts */
  consistent: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Verification Report
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete verification report for a sealed casefile.
 * Designed for court-admissibility and offline validation.
 */
export interface VerificationReport {
  /** Schema identifier */
  $schema: typeof VERIFICATION_REPORT_SCHEMA;
  /** Report version */
  version: typeof VERIFICATION_REPORT_VERSION;

  // ─── Core Verification Results ───────────────────────────────────────────

  /** Overall verification result */
  result: 'pass' | 'fail';

  /** SHA256 of the verified casefile.zip */
  casefileSha256: string | null;

  /** SHA256 of the verified ledger-head.json */
  ledgerHeadSha256: string | null;

  /** SHA256 of the sealed manifest */
  manifestSha256: string | null;

  // ─── Chain Status ────────────────────────────────────────────────────────

  /** Ledger chain verification status */
  ledgerChainStatus: LedgerChainStatus;

  /** Release chain verification status */
  releaseChainStatus: ReleaseChainStatus;

  // ─── Repo Identity ───────────────────────────────────────────────────────

  /** Repository identity observed in artifacts */
  repoIdentityObserved: RepoIdentityObserved;

  // ─── Errors ──────────────────────────────────────────────────────────────

  /** All verification errors (empty if result=pass) */
  errorCodes: VerificationErrorCode[];

  /** Detailed error information */
  errors: VerificationError[];

  // ─── Volatile Fields (excluded from digest) ──────────────────────────────

  /** Verification timestamp (UTC ISO8601) */
  verifiedAt: string;

  /** Verifier environment */
  verifierEnvironment: VerifierEnvironment;

  // ─── Source Information ──────────────────────────────────────────────────

  /** Release tag being verified */
  releaseTag: string | null;

  /** Source URL of the assets (if downloaded) */
  sourceUrl?: string;

  /** Asset filenames verified */
  assetsVerified: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Report Digest (deterministic subset)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministic subset of the report for hashing/signing.
 * Excludes volatile fields (timestamps, environment platform details).
 */
export interface ReportDigest {
  $schema: typeof VERIFICATION_REPORT_SCHEMA;
  version: typeof VERIFICATION_REPORT_VERSION;
  result: 'pass' | 'fail';
  casefileSha256: string | null;
  ledgerHeadSha256: string | null;
  manifestSha256: string | null;
  ledgerChainStatus: LedgerChainStatus;
  releaseChainStatus: ReleaseChainStatus;
  repoIdentityObserved: RepoIdentityObserved;
  errorCodes: VerificationErrorCode[];
  releaseTag: string | null;
  /** Tool version (stable, unlike platform) */
  toolVersion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonicalization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively sorts object keys alphabetically for deterministic serialization.
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();

  for (const key of keys) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  }

  return sorted;
}

/**
 * Canonicalizes any object for deterministic hashing.
 *
 * @param obj Object to canonicalize
 * @returns Canonical JSON string (sorted keys, compact)
 */
export function canonicalizeForDigest(obj: unknown): string {
  const sorted = sortObjectKeys(obj);
  return JSON.stringify(sorted);
}

// ─────────────────────────────────────────────────────────────────────────────
// Report Generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Captures the current verifier environment.
 *
 * @param opts Optional overrides
 * @returns VerifierEnvironment
 */
export function captureVerifierEnvironment(opts?: {
  toolCommit?: string;
  runnerType?: string;
  runnerName?: string;
}): VerifierEnvironment {
  return {
    platform: os.platform(),
    platformRelease: os.release(),
    arch: os.arch(),
    nodeVersion: process.version,
    toolVersion: VERIFICATION_REPORT_VERSION,
    toolCommit: opts?.toolCommit,
    runnerType: opts?.runnerType ?? 'local',
    runnerName: opts?.runnerName,
  };
}

/**
 * Creates a new verification report with default/empty values.
 *
 * @param opts Optional initial values
 * @returns VerificationReport
 */
export function createVerificationReport(
  opts?: Partial<Omit<VerificationReport, '$schema' | 'version'>>
): VerificationReport {
  return {
    $schema: VERIFICATION_REPORT_SCHEMA,
    version: VERIFICATION_REPORT_VERSION,
    result: opts?.result ?? 'fail',
    casefileSha256: opts?.casefileSha256 ?? null,
    ledgerHeadSha256: opts?.ledgerHeadSha256 ?? null,
    manifestSha256: opts?.manifestSha256 ?? null,
    ledgerChainStatus: opts?.ledgerChainStatus ?? {
      ok: false,
      headSha256: null,
      previousSha256: null,
      sequenceNumber: -1,
      chainDepthVerified: 0,
    },
    releaseChainStatus: opts?.releaseChainStatus ?? {
      ok: false,
      releaseTag: null,
      previousReleaseTag: null,
      previousCasefileSha256: null,
      chainDepthVerified: 0,
    },
    repoIdentityObserved: opts?.repoIdentityObserved ?? {
      repoId: null,
      ownerRepo: null,
      defaultBranch: null,
      consistent: false,
    },
    errorCodes: opts?.errorCodes ?? [],
    errors: opts?.errors ?? [],
    verifiedAt: opts?.verifiedAt ?? new Date().toISOString(),
    verifierEnvironment: opts?.verifierEnvironment ?? captureVerifierEnvironment(),
    releaseTag: opts?.releaseTag ?? null,
    sourceUrl: opts?.sourceUrl,
    assetsVerified: opts?.assetsVerified ?? [],
  };
}

/**
 * Extracts the deterministic digest from a verification report.
 * The digest excludes volatile fields (verifiedAt, environment platform details).
 *
 * @param report Full verification report
 * @returns ReportDigest (stable subset)
 */
export function extractReportDigest(report: VerificationReport): ReportDigest {
  return {
    $schema: report.$schema,
    version: report.version,
    result: report.result,
    casefileSha256: report.casefileSha256,
    ledgerHeadSha256: report.ledgerHeadSha256,
    manifestSha256: report.manifestSha256,
    ledgerChainStatus: report.ledgerChainStatus,
    releaseChainStatus: report.releaseChainStatus,
    repoIdentityObserved: report.repoIdentityObserved,
    errorCodes: [...report.errorCodes].sort(), // Stable order
    releaseTag: report.releaseTag,
    toolVersion: report.verifierEnvironment.toolVersion,
  };
}

/**
 * Computes SHA256 hash of the report digest for signing.
 *
 * @param report Full verification report (or digest)
 * @returns SHA256 hex string
 */
export function computeReportDigestSha256(report: VerificationReport | ReportDigest): string {
  const digest =
    '$schema' in report && 'toolVersion' in report
      ? (report as ReportDigest)
      : extractReportDigest(report as VerificationReport);

  const canonical = canonicalizeForDigest(digest);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Adds an error to the report and updates result to 'fail'.
 *
 * @param report Report to update
 * @param error Error to add
 */
export function addVerificationError(report: VerificationReport, error: VerificationError): void {
  report.errors.push(error);
  if (!report.errorCodes.includes(error.code)) {
    report.errorCodes.push(error.code);
  }
  report.result = 'fail';
}

/**
 * Finalizes the report by setting result based on errors.
 *
 * @param report Report to finalize
 * @returns Finalized report
 */
export function finalizeReport(report: VerificationReport): VerificationReport {
  report.result = report.errors.length === 0 ? 'pass' : 'fail';
  report.verifiedAt = new Date().toISOString();
  return report;
}

// ─────────────────────────────────────────────────────────────────────────────
// Attack/Failure Class Mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps error codes to human-readable attack/failure classes for triage.
 */
export const ERROR_CODE_ATTACK_CLASS: Record<VerificationErrorCode, string> = {
  // Asset-level
  CASEFILE_NOT_FOUND: 'Missing Release Asset',
  CASEFILE_HASH_MISMATCH: 'Casefile Tampering',
  CASEFILE_CORRUPT: 'Casefile Corruption',
  MANIFEST_NOT_FOUND: 'Missing Release Asset',
  MANIFEST_HASH_MISMATCH: 'Manifest Tampering',
  MANIFEST_INVALID: 'Manifest Corruption',
  MANIFEST_SCHEMA_MISMATCH: 'Schema Version Mismatch',

  // Triplet parity
  TRIPLET_MISSING: 'Incomplete Signing Artifacts',
  SIGNATURE_INVALID: 'Signature Forgery Attempt',
  CERTIFICATE_INVALID: 'Certificate Tampering',
  BUNDLE_INVALID: 'Bundle Tampering',

  // Chain continuity
  LEDGER_HEAD_NOT_FOUND: 'Missing Ledger Head',
  LEDGER_HEAD_INVALID: 'Ledger Head Corruption',
  LEDGER_HASH_MISMATCH: 'Ledger Tampering',
  LEDGER_CHAIN_BROKEN: 'Chain Continuity Attack',
  LEDGER_SEQUENCE_GAP: 'Chain Truncation Attack',
  RELEASE_CHAIN_BROKEN: 'Release Continuity Attack',
  RELEASE_LINKAGE_INVALID: 'Release Linkage Tampering',

  // Repo identity
  REPO_ID_MISMATCH: 'Fork Spoofing Attack',
  REPO_SLUG_MISMATCH: 'Repository Spoofing Attack',
  DEFAULT_BRANCH_MISMATCH: 'Branch Spoofing Attack',

  // Policy
  POLICY_MISMATCH: 'Policy Violation',
  ISSUER_MISMATCH: 'OIDC Issuer Mismatch',
  IDENTITY_MISMATCH: 'Signing Identity Mismatch',
  REF_MISMATCH: 'Git Ref Mismatch',
  SHA_MISMATCH: 'Commit SHA Mismatch',

  // Generic
  DOWNLOAD_FAILED: 'Asset Download Failure',
  VERIFICATION_TIMEOUT: 'Verification Timeout',
  UNKNOWN_ERROR: 'Unknown Verification Error',
};

/**
 * Gets the attack class for an error code.
 *
 * @param code Error code
 * @returns Human-readable attack class
 */
export function getAttackClass(code: VerificationErrorCode): string {
  return ERROR_CODE_ATTACK_CLASS[code] ?? 'Unknown';
}

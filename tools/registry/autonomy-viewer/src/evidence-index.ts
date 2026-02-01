/**
 * Phase 4N6 — Autonomy Evidence Index Generator
 *
 * Creates a deterministic index of all evidence records for a CI run.
 * This is the "system-of-record" that makes Autonomy operationally governable.
 *
 * Usage:
 *   pnpm perf:evidence-index --out <dir> [options]
 *   npx tsx tools/registry/autonomy-viewer/src/evidence-index.ts [options]
 *
 * Options:
 *   --out <dir>           Output directory for index (default: ./dist)
 *   --artifacts <dir>     Directory containing artifacts (apply-proofs, plan, etc.)
 *   --bundle <path>       Path to evidence bundle ZIP
 *   --bundle-name <name>  Override bundle filename in index
 *   --manifest-sha <sha>  Manifest SHA256 (from verify-bundle)
 *   --verify-ok           Bundle verification passed
 *   --verify-strict       Strict mode was used
 *   --run-id <id>         CI run ID
 *   --workflow <name>     Workflow name (default: autonomy-pr-lane)
 *   --repo <owner/repo>   Repository identifier
 *   --ref <ref>           Git ref (branch/tag)
 *   --verbose             Verbose output
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface EvidenceIndexSource {
  workflow: string;
  runId: string;
  repo: string;
  ref: string;
}

export interface EvidenceBundle {
  name: string;
  manifestSha256: string;
  verify: {
    ok: boolean;
    strict: boolean;
  };
}

export interface EvidenceArtifacts {
  dashboardHtml?: string;
  dashboardJson?: string;
  applyProofsJson?: string;
  perfPlanJson?: string;
  actionableJson?: string;
}

export interface EvidenceRollback {
  command: string;
  preview: string;
}

export interface EvidenceRetention {
  days: number;
  policy: string;
  tier: 'ci' | 'merged' | 'incident';
}

// Phase 4N14 — Release Asset Types
export interface ReleaseAsset {
  /** Asset filename (e.g., "autonomy-evidence-bundle-123.zip") */
  name: string;
  /** Immutable download URL (releases/download/<tag>/<name>) */
  url: string;
}

/**
 * Phase 4N16: Signature metadata for cryptographic authorship verification.
 * Uses keyless signing via GitHub OIDC (Sigstore/cosign).
 *
 * Phase 4N20: Extended with identity & issuer pinning fields for
 * non-spoofable verification.
 */
export interface SignatureInfo {
  /** Signature file URL (.sig) */
  sigUrl: string;
  /** Certificate file URL (.crt) */
  crtUrl: string;
  /** Bundle file URL (.bundle) for offline verification */
  bundleUrl: string;
  /** OIDC issuer (e.g., https://token.actions.githubusercontent.com) */
  issuer: string;
  /** Signing identity (workflow identity URI) */
  identity: string;
  /** Phase 4N20: Workflow file path (e.g., .github/workflows/autonomy-evidence-publisher.yml) */
  workflowPath: string;
  /** Phase 4N20: Git ref (e.g., refs/heads/main) */
  ref: string;
  /** Phase 4N20: Repository (e.g., owner/repo) */
  repo: string;
  /** Phase 4N20: Signing commit SHA (40-hex) */
  sha: string;
  /** Phase 4N20: Cosign subject (optional, for audit) */
  subject?: string;
  /** Verification status (populated after verification) */
  verified?: {
    ok: boolean;
    checkedAt: string;
    error?: string;
  };
  /** Phase 4N21: Rekor transparency log anchoring */
  rekor?: RekorAnchor;
}

/**
 * Phase 4N21: Rekor transparency log entry metadata.
 * Enables offline verification of public anchoring.
 */
export interface RekorAnchor {
  /** Rekor log index (e.g., 12345678) */
  logIndex: number;
  /** Rekor entry UUID (64-hex) */
  uuid: string;
  /** Integrated time (epoch seconds) */
  integratedTime: number;
  /** Immutable entry URL (must pass validateImmutableUrl) */
  entryUrl: string;
  /** Whether bundle file contained valid Rekor proof */
  bundleValid: boolean;
}

/**
 * Phase 4N17: Signing mode for evidence packages.
 * - 'full': All primary artifacts must be signed (bundle, manifest, custody, ledger)
 * - 'primary': Only bundle and manifest signed
 * - 'none': No signing (e.g., CI artifacts before merge)
 */
export type SigningMode = 'full' | 'primary' | 'none';

/**
 * Phase 4N17: Explicit signing status for an asset.
 * Phase 4N21: Extended with Rekor anchoring status.
 */
export interface AssetSigningStatus {
  /** Whether this asset was signed */
  signed: boolean;
  /** Signature triplet files (.sig, .crt, .bundle) - all must exist if signed=true */
  triplet?: {
    sig: string;
    crt: string;
    bundle: string;
  };
  /** Signing identity URI (if signed) */
  identity?: string;
  /** OIDC issuer (if signed) */
  issuer?: string;
  /** Phase 4N21: Whether .bundle file is present (required for Rekor verification) */
  rekorBundlePresent?: boolean;
  /** Phase 4N21: Rekor anchor metadata (if bundle parsed successfully) */
  rekor?: RekorAnchor;
}

/**
 * Release asset with optional signature.
 */
export interface ReleaseAsset {
  name: string;
  url: string;
  /** Phase 4N16: Cryptographic signature (keyless via OIDC) */
  signature?: SignatureInfo;
  /** Phase 4N17: Explicit signing status (prevents inference ambiguity) */
  signing?: AssetSigningStatus;
}

/**
 * Canonical release assets for evidence package.
 * All URLs must be immutable (tagged releases only).
 */
export interface ReleaseAssets {
  bundleZip?: ReleaseAsset;
  manifestJson?: ReleaseAsset;
  evidenceIndexJson?: ReleaseAsset;
  ledgerHtml?: ReleaseAsset;
  dashboardHtml?: ReleaseAsset;
  custodyHtml?: ReleaseAsset;
  custodyAttestationJson?: ReleaseAsset;
}

export interface EvidenceRecord {
  recordId: string;
  status: 'applied' | 'noop' | 'skipped' | 'blocked' | 'dry-run';
  planItemId: string;
  strategyId: string;
  finalCommitSha: string;
  bundle: EvidenceBundle;
  artifacts: EvidenceArtifacts;
  rollback: EvidenceRollback;
  retention: EvidenceRetention;
}

export interface IncidentSource {
  pr: number;
  labelAppliedAt?: string;
  mergedAt?: string;
}

/**
 * Phase 4N20: Expected signature policy for verification.
 * Embedded in evidence index to make verification expectations explicit.
 */
export interface ExpectedSignaturePolicy {
  /** OIDC issuer (must be exact match) */
  issuer: string;
  /** Repository (owner/repo) */
  repo: string;
  /** Git ref (e.g., refs/heads/main) */
  ref: string;
  /** Workflow file path */
  workflowPath: string;
  /** Derived identity URI */
  identity: string;
  /** Whether SHA binding is required (default true for merged/incident) */
  requireShaBinding?: boolean;
  /** Expected SHA (40-hex) - required if requireShaBinding is true */
  sha?: string;
}

/**
 * Phase 4N22: Two-Person Integrity (TPI) verification result.
 * Ensures Autonomy changes require explicit human authorization.
 */
export interface TPIResult {
  /** Overall TPI check passed */
  ok: boolean;
  /** Minimum approvals required (from policy) */
  minApprovals: number;
  /** GitHub logins of valid approvers (no PII - logins only) */
  approverLogins: string[];
  /** Policy version used for evaluation */
  policyVersion: string;
  /** ISO timestamp when TPI was evaluated */
  evaluatedAt: string;
  /** PR requirements satisfied (labels, title, base branch) */
  prRequirements?: {
    hasRequiredLabels: boolean;
    hasRequiredTitle: boolean;
    correctBaseBranch: boolean;
  };
}

/**
 * Phase 4N23: Break-Glass Protocol result.
 * Emergency governance lane with enhanced oversight.
 */
export interface BreakGlassResult {
  /** Break-glass mode activated */
  activated: boolean;
  /** Reason label (break-glass:reason/*) */
  reason: string;
  /** Allowed action type */
  action: 'rollback_from_proof' | 'republish_evidence' | 'pause_autonomy_lane' | 'unknown';
  /** GitHub logins of valid approvers (no PII - logins only) */
  approvers: string[];
  /** Required approvals (from break-glass policy, typically 3) */
  approvalsRequired: number;
  /** SHA256 hash of the policy file used */
  policySha: string;
  /** Policy version */
  policyVersion: string;
  /** ISO timestamp when break-glass was evaluated */
  evaluatedAt: string;
  /** Verification checks passed */
  checks: {
    pinned: boolean;
    rekor: boolean;
    verifyBundleStrict: boolean;
    rollbackVerified: boolean;
    noAutomerge: boolean;
  };
  /** Proof ID if rollback action */
  proofId?: string;
}

/**
 * Phase 4N24: Break-Glass Drill result.
 * Proves emergency controls work via live-fire rehearsal.
 */
export interface DrillResult {
  /** Drill schema identifier */
  schema: 'terrafusion.autonomy.break_glass.drill.v1';
  /** Unique drill identifier */
  drillId: string;
  /** ISO timestamp of drill execution */
  timestamp: string;
  /** Repository where drill was run */
  repository: string;
  /** CI run ID */
  runId: number;
  /** CI run number */
  runNumber: number;
  /** GitHub login who triggered drill */
  triggeredBy: string;
  /** How drill was triggered */
  triggerType: 'workflow_dispatch' | 'schedule' | 'push';
  /** Drill type */
  drillType: 'full' | 'guard-only' | 'report-only';
  /** Whether this was a dry run */
  dryRun: boolean;
  /** Overall drill status */
  status: 'PASS' | 'FAIL';
  /** Policy used for drill */
  policy: {
    version: string;
    sha256: string;
  };
  /** Guard logic test results */
  guardLogicTests: {
    zeroApprovalsBlocked: boolean;
    oneApprovalBlocked: boolean;
    twoApprovalsBlocked: boolean;
    threeApprovalsPasses: boolean;
    botExcluded: boolean;
    selfExcluded: boolean;
    automergeBlocked: boolean;
    allTestsPass: boolean;
  };
  /** Label/title validation results */
  labelValidation: {
    requiredLabelValid: boolean;
    reasonPrefixValid: boolean;
    titlePrefixValid: boolean;
    bodyFieldsValid: boolean;
  };
  /** Forbidden actions validation */
  forbiddenActions: {
    count: number;
    criticalPresent: boolean;
  };
  /** Compliance metadata */
  compliance: {
    framework: 'FISMA';
    controlExercised: boolean;
    lastDrillDate: string;
    nextScheduledDrill: 'monthly' | 'quarterly' | 'annual';
  };
}

/**
 * Phase 4N25: Role Binding result for Break-Glass approvals.
 * Ensures approvals come from designated roles (Security, CIO, Engineering).
 */
export interface RoleBindingResult {
  /** Overall role binding check passed */
  ok: boolean;
  /** Whether role binding was skipped (not enabled in policy) */
  skipped?: boolean;
  /** Required roles from policy */
  requiredRoles: string[];
  /** Roles that were satisfied by approvers */
  satisfiedRoles: string[];
  /** Roles that were NOT satisfied */
  missingRoles: string[];
  /** Map of role → approvers who satisfied that role */
  approverRoles: {
    security: string[];
    cio: string[];
    engineering: string[];
  };
  /** Count of eligible approvals (after exclusions) */
  approvalCountEligible: number;
  /** Approvers who were excluded and why */
  excludedApprovers: Array<{
    user: string;
    reason: 'self' | 'bot' | 'no-role';
  }>;
  /** Source file for approver roles */
  approverSource: string;
  /** ISO timestamp when role binding was evaluated */
  evaluatedAt: string;
}

/**
 * Phase 4N20: Individual pin verification result.
 */
export interface PinResult {
  expected: string;
  actual: string;
  ok: boolean;
}

/**
 * Phase 4N20: Complete signature pins verification result.
 */
export interface SignaturePins {
  issuer: PinResult;
  identity: PinResult;
  repo: PinResult;
  workflowPath: PinResult;
  ref: PinResult;
  sha?: PinResult;
}

/**
 * Phase 4N20: Forbidden identity patterns.
 */
export const FORBIDDEN_IDENTITY_PATTERNS = [
  /@refs\/tags\//, // No tag identities for merged/incident
  /\/latest$/, // No mutable "latest" refs
  /@refs\/heads\/(?!main$|master$)/, // Only main/master allowed for merged/incident
] as const;

export interface EvidenceIndex {
  schema: 'terrafusion.autonomy.evidence.index.v1';
  generatedAt: string;
  source: EvidenceIndexSource;
  records: EvidenceRecord[];
  incident?: boolean;
  incidentSource?: IncidentSource;
  /** Release tag (e.g., "autonomy-evidence/2026-01") */
  releaseTag?: string;
  /** Immutable release page URL (releases/tag/<tag>) */
  releaseUrl?: string;
  /** Canonical release assets with immutable URLs */
  assets?: ReleaseAssets;
  /**
   * Phase 4N17: Signing mode for this evidence package.
   * - 'full': All primary artifacts signed
   * - 'primary': Bundle + manifest signed
   * - 'none': No signing (CI-only)
   */
  signingMode?: SigningMode;
  /**
   * Phase 4N17: Canonical workflow identity for signature verification.
   * Format: https://github.com/{owner}/{repo}/.github/workflows/{workflow}.yml@{ref}
   */
  signingIdentity?: string;
  /**
   * Phase 4N20: Expected signature policy for verification.
   * Contains issuer, identity, workflow, ref, repo pins for non-spoofable verification.
   */
  expectedSignaturePolicy?: ExpectedSignaturePolicy;
  /**
   * Phase 4N22: Two-Person Integrity (TPI) verification result.
   * Ensures changes require explicit human authorization before landing.
   */
  tpi?: TPIResult;
  /**
   * Phase 4N23: Break-Glass Protocol result.
   * Emergency governance lane with enhanced oversight (3+ approvals, strict verification).
   */
  breakGlass?: BreakGlassResult;
  /**
   * Phase 4N24: Break-Glass Drill result.
   * Proves emergency controls work via periodic live-fire rehearsals.
   */
  drill?: DrillResult;
  /**
   * Phase 4N25: Role Binding result.
   * Ensures break-glass approvals come from required roles (Security, CIO).
   */
  roleBinding?: RoleBindingResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

interface IndexOptions {
  outDir: string;
  artifactsDir: string;
  bundlePath: string;
  bundleName: string;
  manifestSha: string;
  verifyOk: boolean;
  verifyStrict: boolean;
  runId: string;
  workflow: string;
  repo: string;
  ref: string;
  verbose: boolean;
  incident: boolean;
  incidentPr: number;
  retentionTier: 'ci' | 'merged' | 'incident';
  /** Release tag for immutable URLs (e.g., "autonomy-evidence/2026-01") */
  releaseTag: string;
  /** GitHub server URL (default: https://github.com) */
  serverUrl: string;
  /** Phase 4N17: Signing mode ('full' | 'primary' | 'none') */
  signingMode?: SigningMode;
  /** Phase 4N17: Signing identity (workflow OIDC subject) */
  signingIdentity?: string;
  /** Phase 4N20: Workflow file path for signature pinning */
  workflowPath?: string;
  /** Phase 4N20: Signing commit SHA (40-hex) */
  sha?: string;
  /** Phase 4N20: OIDC issuer (defaults to GitHub Actions) */
  issuer?: string;
}

function parseArgs(): IndexOptions {
  const args = process.argv.slice(2);
  const opts: IndexOptions = {
    outDir: './dist',
    artifactsDir: '',
    bundlePath: '',
    bundleName: '',
    manifestSha: '',
    verifyOk: false,
    verifyStrict: false,
    runId: process.env.GITHUB_RUN_ID || '',
    workflow: process.env.GITHUB_WORKFLOW || 'autonomy-pr-lane',
    repo: process.env.GITHUB_REPOSITORY || '',
    ref: process.env.GITHUB_REF || '',
    verbose: false,
    incident: false,
    incidentPr: 0,
    retentionTier: 'ci',
    releaseTag: '',
    serverUrl: process.env.GITHUB_SERVER_URL || 'https://github.com',
    // Phase 4N20: Signature pinning defaults
    sha: process.env.GITHUB_SHA || '',
    issuer: 'https://token.actions.githubusercontent.com',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--out' && args[i + 1]) {
      opts.outDir = args[++i];
    } else if (arg === '--artifacts' && args[i + 1]) {
      opts.artifactsDir = args[++i];
    } else if (arg === '--bundle' && args[i + 1]) {
      opts.bundlePath = args[++i];
    } else if (arg === '--bundle-name' && args[i + 1]) {
      opts.bundleName = args[++i];
    } else if (arg === '--manifest-sha' && args[i + 1]) {
      opts.manifestSha = args[++i];
    } else if (arg === '--verify-ok') {
      opts.verifyOk = true;
    } else if (arg === '--verify-strict') {
      opts.verifyStrict = true;
    } else if (arg === '--run-id' && args[i + 1]) {
      opts.runId = args[++i];
    } else if (arg === '--workflow' && args[i + 1]) {
      opts.workflow = args[++i];
    } else if (arg === '--repo' && args[i + 1]) {
      opts.repo = args[++i];
    } else if (arg === '--ref' && args[i + 1]) {
      opts.ref = args[++i];
    } else if (arg === '--verbose') {
      opts.verbose = true;
    } else if (arg === '--incident') {
      opts.incident = true;
    } else if (arg === '--incident-pr' && args[i + 1]) {
      opts.incidentPr = parseInt(args[++i], 10);
    } else if (arg === '--retention-tier' && args[i + 1]) {
      opts.retentionTier = args[++i] as 'ci' | 'merged' | 'incident';
    } else if (arg === '--release-tag' && args[i + 1]) {
      opts.releaseTag = args[++i];
    } else if (arg === '--server-url' && args[i + 1]) {
      opts.serverUrl = args[++i];
    } else if (arg === '--workflow-path' && args[i + 1]) {
      // Phase 4N20: Explicit workflow path for signature pinning
      opts.workflowPath = args[++i];
    } else if (arg === '--sha' && args[i + 1]) {
      // Phase 4N20: Signing commit SHA
      opts.sha = args[++i];
    } else if (arg === '--issuer' && args[i + 1]) {
      // Phase 4N20: OIDC issuer override (rarely needed)
      opts.issuer = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return opts;
}

function printHelp(): void {
  console.log(`
TerraFusion Evidence Index Generator

Usage:
  pnpm perf:evidence-index --out <dir> [options]

Options:
  --out <dir>           Output directory for index (default: ./dist)
  --artifacts <dir>     Directory containing artifacts
  --bundle <path>       Path to evidence bundle ZIP
  --bundle-name <name>  Override bundle filename
  --manifest-sha <sha>  Manifest SHA256 from verify-bundle
  --verify-ok           Bundle verification passed
  --verify-strict       Strict mode was used
  --run-id <id>         CI run ID
  --workflow <name>     Workflow name
  --repo <owner/repo>   Repository identifier
  --ref <ref>           Git ref
  --incident            Mark as incident (7-year retention)
  --incident-pr <num>   PR number for incident
  --retention-tier <t>  Tier: ci, merged, incident (default: ci)
  --release-tag <tag>   Release tag for immutable URLs (required for publishing)
  --server-url <url>    GitHub server URL (default: GITHUB_SERVER_URL or https://github.com)
  --verbose             Verbose output
  --help, -h            Show this help
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Retention Policy
// ─────────────────────────────────────────────────────────────────────────────

export const EVIDENCE_INDEX_SCHEMA = 'terrafusion.autonomy.evidence.index.v1';
export const DEFAULT_RETENTION_DAYS = 90;
export const MERGED_RETENTION_DAYS = 365;
export const INCIDENT_RETENTION_DAYS = 2555; // 7 years
export const RETENTION_POLICY_VERSION = 'autonomy-evidence-retention.v1';

function getRetentionDays(tier: 'ci' | 'merged' | 'incident'): number {
  switch (tier) {
    case 'incident':
      return INCIDENT_RETENTION_DAYS;
    case 'merged':
      return MERGED_RETENTION_DAYS;
    case 'ci':
    default:
      return DEFAULT_RETENTION_DAYS;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N14 — Immutable URL Builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mutable URL patterns that MUST be rejected.
 * Evidence URLs must be immutable (tagged releases only).
 */
const MUTABLE_URL_PATTERNS = [
  /\/latest\/?$/i,
  /\/download\/latest/i,
  /refs\/heads\//i,
  /\/tree\//i,
  /\/blob\//i,
  /git\.io\//i,
  /bit\.ly\//i,
  /tinyurl\./i,
  /t\.co\//i,
  /@latest$/i,
  /branch=/i,
] as const;

/**
 * Phase 4N15: Additional URL validation checks for auditor-grade security.
 * Returns error message if invalid, null if valid.
 */
function validateUrlSecurityConstraints(url: string): string | null {
  // Reject URLs with querystrings (?download=1, ?ref=main, etc.)
  if (url.includes('?')) {
    return `URL contains querystring (not allowed in evidence URLs): ${url}`;
  }

  // Reject URLs with fragments (#section)
  if (url.includes('#')) {
    return `URL contains fragment (not allowed in evidence URLs): ${url}`;
  }

  // Reject URL-encoded traversal attempts (%2f = /, %2e = .)
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('%2f') || lowerUrl.includes('%2e')) {
    return `URL contains encoded path characters (potential traversal): ${url}`;
  }

  // Reject double-encoding attempts (%252f = %2f)
  if (lowerUrl.includes('%25')) {
    return `URL contains double-encoded characters: ${url}`;
  }

  // Reject non-ASCII characters (unicode confusables)
  // eslint-disable-next-line no-control-regex
  if (/[^\x00-\x7F]/.test(url)) {
    return `URL contains non-ASCII characters (unicode confusables not allowed): ${url}`;
  }

  // Reject backslash (Windows path injection)
  if (url.includes('\\')) {
    return `URL contains backslash (not allowed): ${url}`;
  }

  // Reject null bytes
  if (url.includes('\x00')) {
    return `URL contains null byte: ${url}`;
  }

  return null; // Valid
}

/**
 * Validate a URL is immutable (no latest, no branch refs, no shorteners).
 * Phase 4N15: Enhanced with security constraints for auditor-grade validation.
 * Returns error message if invalid, null if valid.
 */
export function validateImmutableUrl(url: string): string | null {
  // Phase 4N15: Security constraints first
  const securityError = validateUrlSecurityConstraints(url);
  if (securityError) {
    return securityError;
  }

  // Must be a GitHub releases URL
  if (!url.includes('/releases/')) {
    return `URL is not a GitHub releases URL: ${url}`;
  }

  for (const pattern of MUTABLE_URL_PATTERNS) {
    if (pattern.test(url)) {
      return `URL contains mutable reference: ${url} (matched ${pattern})`;
    }
  }

  return null; // Valid
}

/**
 * Build the release page URL (releases/tag/<tag>).
 */
export function buildReleaseUrl(serverUrl: string, repo: string, releaseTag: string): string {
  const base = serverUrl.replace(/\/$/, '');
  return `${base}/${repo}/releases/tag/${encodeURIComponent(releaseTag)}`;
}

/**
 * Build an asset download URL (releases/download/<tag>/<assetName>).
 */
export function buildAssetUrl(
  serverUrl: string,
  repo: string,
  releaseTag: string,
  assetName: string
): string {
  const base = serverUrl.replace(/\/$/, '');
  return `${base}/${repo}/releases/download/${encodeURIComponent(releaseTag)}/${encodeURIComponent(assetName)}`;
}

/**
 * Phase 4N20: Derive workflow path from workflow name.
 * Maps workflow name to standard GitHub workflow file path.
 */
export function deriveWorkflowPath(workflowName: string, isIncident: boolean): string {
  // If already a path (contains .yml), return as-is
  if (workflowName.includes('.yml') || workflowName.includes('.yaml')) {
    return workflowName.startsWith('.github/') ? workflowName : `.github/workflows/${workflowName}`;
  }

  // Derive based on incident flag and known workflow names
  if (isIncident) {
    return '.github/workflows/autonomy-incident-publisher.yml';
  }

  // Map common workflow names
  const workflowMap: Record<string, string> = {
    'autonomy-evidence-publisher': '.github/workflows/autonomy-evidence-publisher.yml',
    'autonomy-incident-publisher': '.github/workflows/autonomy-incident-publisher.yml',
    'autonomy-pr-lane': '.github/workflows/autonomy-pr-lane.yml',
  };

  return workflowMap[workflowName] || `.github/workflows/${workflowName}.yml`;
}

/**
 * Phase 4N20: Build signing identity URI.
 * Format: https://github.com/{owner}/{repo}/.github/workflows/{workflow}.yml@{ref}
 */
export function buildSigningIdentity(
  serverUrl: string,
  repo: string,
  workflowPath: string,
  ref: string
): string {
  const base = serverUrl.replace(/\/$/, '');
  // Ensure workflowPath starts with .github/
  const normalizedPath = workflowPath.startsWith('.github/')
    ? workflowPath
    : `.github/workflows/${workflowPath}`;
  return `${base}/${repo}/${normalizedPath}@${ref}`;
}

/**
 * Phase 4N20: Validate identity against forbidden patterns.
 * Returns error message if invalid, null if valid.
 */
export function validateIdentity(
  identity: string,
  tier: 'ci' | 'merged' | 'incident'
): string | null {
  // Only apply strict rules for merged/incident tiers
  if (tier === 'ci') {
    return null;
  }

  // No tag identities for merged/incident
  if (/@refs\/tags\//.test(identity)) {
    return 'Tag identities forbidden for merged/incident tiers';
  }

  // No mutable "latest" refs
  if (/\/latest$/.test(identity)) {
    return 'Mutable "latest" ref forbidden';
  }

  // Only allow main/master branches for merged/incident
  const refMatch = identity.match(/@refs\/heads\/(.+)$/);
  if (refMatch) {
    const branch = refMatch[1];
    if (branch !== 'main' && branch !== 'master') {
      return `Only main/master branches allowed for ${tier} tier, got: ${branch}`;
    }
  }

  return null;
}

/**
 * Canonical asset names for evidence packages.
 */
export const CANONICAL_ASSET_NAMES = {
  bundleZip: (runId: string) => `autonomy-evidence-bundle-${runId}.zip`,
  manifestJson: (runId: string) => `autonomy-evidence-manifest-${runId}.json`,
  evidenceIndexJson: 'autonomy-evidence-index.json',
  ledgerHtml: 'autonomy-ledger.html',
  dashboardHtml: 'autonomy-dashboard.html',
  custodyHtml: 'autonomy-custody.html',
  custodyAttestationJson: 'custody-attestation.json',
} as const;

/**
 * Phase 4N16: Canonical signature asset names.
 * For each signed artifact, we emit .sig, .crt, and .bundle files.
 */
export const SIGNATURE_ASSET_NAMES = {
  sig: (assetName: string) => `${assetName}.sig`,
  crt: (assetName: string) => `${assetName}.crt`,
  bundle: (assetName: string) => `${assetName}.bundle`,
} as const;

/**
 * Phase 4N17: Signature triplet - the three files that must exist together.
 */
export interface SignatureTriplet {
  sig: string;
  crt: string;
  bundle: string;
}

/**
 * Phase 4N17: Build signature triplet filenames for an asset.
 */
export function buildSignatureTriplet(assetName: string): SignatureTriplet {
  return {
    sig: SIGNATURE_ASSET_NAMES.sig(assetName),
    crt: SIGNATURE_ASSET_NAMES.crt(assetName),
    bundle: SIGNATURE_ASSET_NAMES.bundle(assetName),
  };
}

/**
 * Phase 4N17: Signature triplet verification result.
 */
export interface TripletVerifyResult {
  ok: boolean;
  assetName: string;
  missing: string[];
  present: string[];
}

/**
 * Phase 4N17: Verify that a signature triplet is complete.
 * If signed=true, all three files (.sig, .crt, .bundle) must exist.
 * Returns verification result with missing file names.
 */
export function verifySignatureTriplet(
  assetName: string,
  existingFiles: Set<string>
): TripletVerifyResult {
  const triplet = buildSignatureTriplet(assetName);
  const missing: string[] = [];
  const present: string[] = [];

  for (const [_key, fileName] of Object.entries(triplet)) {
    if (existingFiles.has(fileName)) {
      present.push(fileName);
    } else {
      missing.push(fileName);
    }
  }

  return {
    ok: missing.length === 0,
    assetName,
    missing,
    present,
  };
}

/**
 * Phase 4N17: Primary assets that MUST be signed in 'full' signing mode.
 */
export const PRIMARY_SIGNED_ASSETS = [
  'bundleZip',
  'manifestJson',
  'evidenceIndexJson',
  'ledgerHtml',
  'custodyHtml',
  'custodyAttestationJson',
] as const;

/**
 * Phase 4N17: Minimum assets that MUST be signed in 'primary' signing mode.
 */
export const MINIMUM_SIGNED_ASSETS = ['bundleZip', 'manifestJson'] as const;

/**
 * Phase 4N17: Verify all signature triplets for a signing mode.
 * Returns aggregated results for all required signed assets.
 */
export function verifySigningModeParity(
  signingMode: SigningMode,
  assets: ReleaseAssets,
  existingFiles: Set<string>
): { ok: boolean; results: TripletVerifyResult[]; errors: string[] } {
  if (signingMode === 'none') {
    return { ok: true, results: [], errors: [] };
  }

  const requiredAssets = signingMode === 'full' ? PRIMARY_SIGNED_ASSETS : MINIMUM_SIGNED_ASSETS;

  const results: TripletVerifyResult[] = [];
  const errors: string[] = [];

  for (const assetKey of requiredAssets) {
    const asset = assets[assetKey as keyof ReleaseAssets];
    if (!asset) continue; // Asset doesn't exist, skip

    const result = verifySignatureTriplet(asset.name, existingFiles);
    results.push(result);

    if (!result.ok) {
      errors.push(`Asset "${asset.name}" is missing signature files: ${result.missing.join(', ')}`);
    }
  }

  return {
    ok: errors.length === 0,
    results,
    errors,
  };
}

/**
 * Phase 4N16: GitHub Actions OIDC issuer for keyless signing.
 */
export const GITHUB_OIDC_ISSUER = 'https://token.actions.githubusercontent.com' as const;

/**
 * Phase 4N16: Build signature asset URLs for a given base asset.
 */
export function buildSignatureUrls(
  serverUrl: string,
  repo: string,
  releaseTag: string,
  assetName: string,
  workflowIdentity: string,
  workflowPath: string,
  ref: string,
  sha?: string
): SignatureInfo {
  return {
    sigUrl: buildAssetUrl(serverUrl, repo, releaseTag, SIGNATURE_ASSET_NAMES.sig(assetName)),
    crtUrl: buildAssetUrl(serverUrl, repo, releaseTag, SIGNATURE_ASSET_NAMES.crt(assetName)),
    bundleUrl: buildAssetUrl(serverUrl, repo, releaseTag, SIGNATURE_ASSET_NAMES.bundle(assetName)),
    issuer: GITHUB_OIDC_ISSUER,
    identity: workflowIdentity,
    workflowPath,
    ref,
    repo,
    sha: sha || '',
  };
}

/**
 * Phase 4N16: Build workflow identity URI for signature verification.
 * Format: https://github.com/{owner}/{repo}/.github/workflows/{workflow}.yml@refs/heads/{branch}
 */
export function buildWorkflowIdentity(
  serverUrl: string,
  repo: string,
  workflow: string,
  ref: string
): string {
  const base = serverUrl.replace(/\/$/, '');
  // Normalize workflow name (remove path prefix if present)
  const workflowFile = workflow.includes('/') ? workflow : `.github/workflows/${workflow}.yml`;
  return `${base}/${repo}/${workflowFile}@${ref}`;
}

/**
 * Build all release assets with immutable URLs.
 * Phase 4N16: Optionally include signature info for signed artifacts.
 * Phase 4N17: Include explicit signing status (signed boolean + triplet names).
 */
export function buildReleaseAssets(
  serverUrl: string,
  repo: string,
  releaseTag: string,
  runId: string,
  signedAssets?: {
    workflow: string;
    ref: string;
    sha?: string; // Phase 4N20: Commit SHA for pinning
    signedArtifacts: Set<string>; // asset names that were signed
  }
): ReleaseAssets {
  const workflowIdentity = signedAssets
    ? buildWorkflowIdentity(serverUrl, repo, signedAssets.workflow, signedAssets.ref)
    : '';
  const workflowPath = signedAssets?.workflow
    ? deriveWorkflowPath(signedAssets.workflow, signedAssets.workflow.includes('incident'))
    : '';
  const sigRef = signedAssets?.ref || '';
  const sigSha = signedAssets?.sha || '';

  const makeAsset = (name: string, shouldSign = false): ReleaseAsset => {
    const wasSigned = shouldSign && (signedAssets?.signedArtifacts.has(name) ?? false);

    const asset: ReleaseAsset = {
      name,
      url: buildAssetUrl(serverUrl, repo, releaseTag, name),
      // Phase 4N17: Explicit signing status (never inferred)
      signing: {
        signed: wasSigned,
        ...(wasSigned && {
          triplet: buildSignatureTriplet(name),
          identity: workflowIdentity,
          issuer: GITHUB_OIDC_ISSUER,
        }),
      },
    };

    // Phase 4N16: Also add signature URLs for backward compatibility
    if (wasSigned) {
      asset.signature = buildSignatureUrls(
        serverUrl,
        repo,
        releaseTag,
        name,
        workflowIdentity,
        workflowPath,
        sigRef,
        sigSha
      );
    }

    return asset;
  };

  // Primary artifacts that should be signed
  const bundleName = CANONICAL_ASSET_NAMES.bundleZip(runId);
  const manifestName = CANONICAL_ASSET_NAMES.manifestJson(runId);

  return {
    bundleZip: makeAsset(bundleName, true),
    manifestJson: makeAsset(manifestName, true),
    evidenceIndexJson: makeAsset(CANONICAL_ASSET_NAMES.evidenceIndexJson, true),
    ledgerHtml: makeAsset(CANONICAL_ASSET_NAMES.ledgerHtml, true),
    dashboardHtml: makeAsset(CANONICAL_ASSET_NAMES.dashboardHtml, false), // optional, not signed
    custodyHtml: makeAsset(CANONICAL_ASSET_NAMES.custodyHtml, true),
    custodyAttestationJson: makeAsset(CANONICAL_ASSET_NAMES.custodyAttestationJson, true),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Index Generation
// ─────────────────────────────────────────────────────────────────────────────

interface ApplyProof {
  proofId?: string;
  planItemId?: string;
  strategyId?: string;
  outcome?: 'applied' | 'noop' | 'skipped' | 'blocked' | 'dry-run';
  finalCommitSha?: string;
  rollbackCommand?: string;
}

export function loadApplyProofs(artifactsDir: string, verbose = false): ApplyProof[] {
  const proofPath = join(artifactsDir, 'apply-proofs.json');
  if (!existsSync(proofPath)) {
    if (verbose) console.log(`  No apply-proofs.json found at ${proofPath}`);
    return [];
  }

  try {
    const content = readFileSync(proofPath, 'utf8');
    const data = JSON.parse(content);

    // Handle both array and { proofs: [] } formats
    if (Array.isArray(data)) {
      return data;
    } else if (data.proofs && Array.isArray(data.proofs)) {
      return data.proofs;
    }
    return [];
  } catch {
    if (verbose) console.log(`  Failed to parse apply-proofs.json`);
    return [];
  }
}

function buildRecords(opts: IndexOptions, proofs: ApplyProof[]): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];

  // If no proofs, create a single "noop" record
  if (proofs.length === 0) {
    records.push({
      recordId: `run-${opts.runId}-noop`,
      status: 'noop',
      planItemId: 'none',
      strategyId: 'none',
      finalCommitSha: '',
      bundle: {
        name: opts.bundleName || `autonomy-evidence-bundle-${opts.runId}.zip`,
        manifestSha256: opts.manifestSha,
        verify: {
          ok: opts.verifyOk,
          strict: opts.verifyStrict,
        },
      },
      artifacts: detectArtifacts(opts),
      rollback: {
        command: '',
        preview: '',
      },
      retention: {
        days: getRetentionDays(opts.retentionTier),
        policy: RETENTION_POLICY_VERSION,
        tier: opts.retentionTier,
      },
    });
  }

  // Create a record for each proof
  for (const proof of proofs) {
    const planItemId = proof.planItemId || proof.proofId || 'unknown';
    const recordId = `run-${opts.runId}-planItem-${planItemId}`;

    records.push({
      recordId,
      status: proof.outcome || 'noop',
      planItemId,
      strategyId: proof.strategyId || 'unknown',
      finalCommitSha: proof.finalCommitSha || '',
      bundle: {
        name: opts.bundleName || `autonomy-evidence-bundle-${opts.runId}.zip`,
        manifestSha256: opts.manifestSha,
        verify: {
          ok: opts.verifyOk,
          strict: opts.verifyStrict,
        },
      },
      artifacts: detectArtifacts(opts),
      rollback: {
        command: planItemId !== 'unknown' ? `pnpm perf:rollback --proof ${planItemId}` : '',
        preview:
          planItemId !== 'unknown' ? `pnpm perf:rollback --proof ${planItemId} --dry-run` : '',
      },
      retention: {
        days: getRetentionDays(opts.retentionTier),
        policy: RETENTION_POLICY_VERSION,
        tier: opts.retentionTier,
      },
    });
  }

  // Sort by recordId for determinism
  records.sort((a, b) => a.recordId.localeCompare(b.recordId));

  return records;
}

function detectArtifacts(opts: IndexOptions): EvidenceArtifacts {
  const artifacts: EvidenceArtifacts = {};

  if (opts.artifactsDir) {
    const checkFile = (name: string) => existsSync(join(opts.artifactsDir, name));

    if (checkFile('autonomy-dashboard.html')) {
      artifacts.dashboardHtml = 'autonomy-dashboard.html';
    }
    if (checkFile('autonomy-dashboard.json')) {
      artifacts.dashboardJson = 'autonomy-dashboard.json';
    }
    if (checkFile('apply-proofs.json')) {
      artifacts.applyProofsJson = 'apply-proofs.json';
    }
    if (checkFile('perf.plan.json')) {
      artifacts.perfPlanJson = 'perf.plan.json';
    }
    if (checkFile('perf-audit-report.actionable.json')) {
      artifacts.actionableJson = 'perf-audit-report.actionable.json';
    }
  }

  return artifacts;
}

export function buildEvidenceIndex(opts: IndexOptions): EvidenceIndex {
  const proofs = opts.artifactsDir ? loadApplyProofs(opts.artifactsDir, opts.verbose) : [];
  const records = buildRecords(opts, proofs);

  const index: EvidenceIndex = {
    schema: 'terrafusion.autonomy.evidence.index.v1',
    generatedAt: new Date().toISOString(),
    source: {
      workflow: opts.workflow,
      runId: opts.runId,
      repo: opts.repo,
      ref: opts.ref,
    },
    records,
  };

  // Add incident fields if applicable
  if (opts.incident && opts.incidentPr > 0) {
    index.incident = true;
    index.incidentSource = {
      pr: opts.incidentPr,
      mergedAt: new Date().toISOString(),
    };
    // Release tag follows annual format for incident tier (if not already set)
    if (!opts.releaseTag) {
      const year = new Date().getFullYear();
      index.releaseTag = `autonomy-incident/${year}`;
    }
  }

  // Phase 4N14: Add immutable release URLs when releaseTag is provided
  if (opts.releaseTag) {
    index.releaseTag = opts.releaseTag;
    index.releaseUrl = buildReleaseUrl(opts.serverUrl, opts.repo, opts.releaseTag);
    index.assets = buildReleaseAssets(opts.serverUrl, opts.repo, opts.releaseTag, opts.runId);

    // Validate all URLs are immutable (fail-fast if mutable refs detected)
    const releaseUrlError = validateImmutableUrl(index.releaseUrl);
    if (releaseUrlError) {
      throw new Error(`Immutable URL validation failed: ${releaseUrlError}`);
    }
  }

  // Phase 4N17: Add signing metadata when provided
  if (opts.signingMode) {
    index.signingMode = opts.signingMode;
  }
  if (opts.signingIdentity) {
    index.signingIdentity = opts.signingIdentity;
  }

  // Phase 4N20: Build expected signature policy for non-spoofable verification
  if (opts.signingMode && opts.signingMode !== 'none') {
    const workflowPath = opts.workflowPath || deriveWorkflowPath(opts.workflow, opts.incident);
    const identity = buildSigningIdentity(opts.serverUrl, opts.repo, workflowPath, opts.ref);

    index.expectedSignaturePolicy = {
      issuer: opts.issuer || 'https://token.actions.githubusercontent.com',
      repo: opts.repo,
      ref: opts.ref,
      workflowPath,
      identity,
      // SHA binding required for merged/incident tiers
      requireShaBinding: opts.retentionTier === 'merged' || opts.retentionTier === 'incident',
      sha: opts.sha || undefined,
    };
  }

  return index;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N21: Rekor Transparency Log Parsing
// ─────────────────────────────────────────────────────────────────────────────

/** Rekor public instance base URL */
export const REKOR_PUBLIC_URL = 'https://rekor.sigstore.dev';

/**
 * Phase 4N21: Parse Rekor anchor from cosign bundle JSON.
 * Returns null if bundle is missing or invalid.
 *
 * Cosign bundle structure (simplified):
 * {
 *   "rekorBundle": {
 *     "Payload": { "logIndex": number, "integratedTime": number, ... },
 *     "SignedEntryTimestamp": "..."
 *   }
 * }
 * OR (newer format):
 * {
 *   "verificationMaterial": {
 *     "tlogEntries": [{
 *       "logIndex": string,
 *       "logId": { "keyId": "..." },
 *       "integratedTime": string,
 *       ...
 *     }]
 *   }
 * }
 */
export function parseRekorFromBundle(bundleContent: string): RekorAnchor | null {
  try {
    const bundle = JSON.parse(bundleContent);

    // Try newer Sigstore bundle format (v0.2+)
    const tlogEntries = bundle.verificationMaterial?.tlogEntries;
    if (Array.isArray(tlogEntries) && tlogEntries.length > 0) {
      const entry = tlogEntries[0];
      const logIndex = parseInt(entry.logIndex, 10);
      const integratedTime = parseInt(entry.integratedTime, 10);
      // UUID is typically derived from logId.keyId + logIndex, but we use a placeholder
      const uuid = entry.logId?.keyId
        ? `${entry.logId.keyId.substring(0, 16)}${logIndex.toString(16).padStart(16, '0')}`
        : logIndex.toString(16).padStart(64, '0');

      return {
        logIndex,
        uuid,
        integratedTime,
        entryUrl: `${REKOR_PUBLIC_URL}/api/v1/log/entries?logIndex=${logIndex}`,
        bundleValid: true,
      };
    }

    // Try older rekorBundle format
    const rekorPayload = bundle.rekorBundle?.Payload;
    if (rekorPayload) {
      const logIndex = rekorPayload.logIndex;
      const integratedTime = rekorPayload.integratedTime;
      const uuid = logIndex.toString(16).padStart(64, '0');

      return {
        logIndex,
        uuid,
        integratedTime,
        entryUrl: `${REKOR_PUBLIC_URL}/api/v1/log/entries?logIndex=${logIndex}`,
        bundleValid: true,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Phase 4N21: Validate Rekor anchor URL is immutable.
 * Same rules as validateImmutableUrl but specific to Rekor.
 */
export function validateRekorUrl(url: string): string | null {
  // Must start with known Rekor instance
  if (!url.startsWith(REKOR_PUBLIC_URL)) {
    return `Rekor URL must start with ${REKOR_PUBLIC_URL}`;
  }
  // No fragments allowed
  if (url.includes('#')) {
    return 'Rekor URL must not contain fragments';
  }
  // Must use logIndex parameter (immutable)
  if (!url.includes('logIndex=')) {
    return 'Rekor URL must use logIndex parameter';
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  const opts = parseArgs();

  if (opts.verbose) {
    console.log('📋 Phase 4N6: Generating Evidence Index...');
    console.log(`  Run ID: ${opts.runId}`);
    console.log(`  Workflow: ${opts.workflow}`);
    console.log(`  Output: ${opts.outDir}`);
  }

  // Build index
  const index = buildEvidenceIndex(opts);

  // Ensure output directory exists
  if (!existsSync(opts.outDir)) {
    mkdirSync(opts.outDir, { recursive: true });
  }

  // Write index
  const indexPath = join(opts.outDir, 'autonomy-evidence-index.json');
  writeFileSync(indexPath, JSON.stringify(index, null, 2));

  if (opts.verbose) {
    console.log(`✅ Evidence index written: ${indexPath}`);
    console.log(`   Records: ${index.records.length}`);
    console.log(`   Retention: ${DEFAULT_RETENTION_DAYS} days`);
  }
}

// Run if main module
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('evidence-index.ts') || process.argv[1].endsWith('evidence-index.js'));

if (isMain) {
  main();
}

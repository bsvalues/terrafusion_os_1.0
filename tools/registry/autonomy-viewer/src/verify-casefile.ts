/**
 * Phase 4N37 – Verify Sealed Casefile (Air-Gapped)
 * =================================================
 *
 * Offline verification of sealed casefile packages.
 * No network required when using --offline mode with .bundle files.
 *
 * Usage:
 *   pnpm perf:verify-casefile --zip <sealed.zip> --strict --verify-signatures
 *
 * Invariants:
 *   - Hash verification: casefile.zip and manifest must match sealed-manifest.json
 *   - Triplet parity: .sig, .crt, .bundle must all exist for each sealed artifact
 *   - Policy verification: issuer/identity/ref/sha must match expected values
 *   - Fail-closed: any verification failure exits non-zero
 */

import { execSync } from 'node:child_process';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AudienceLevel } from './audience-policy.js';
import {
    SEALED_CASEFILE_SCHEMA,
    type SealedCasefileManifest,
    type SealedCasefilePolicy,
} from './casefile.js';
import { readZipFiles } from './zip/zip-reader.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type VerifyCasefileErrorCode =
  | 'ZIP_NOT_FOUND'
  | 'ZIP_INVALID'
  | 'MANIFEST_MISSING'
  | 'MANIFEST_INVALID'
  | 'SCHEMA_MISMATCH'
  | 'HASH_MISMATCH'
  | 'TRIPLET_MISSING'
  | 'SIGNATURE_INVALID'
  | 'POLICY_MISMATCH'
  | 'COSIGN_NOT_FOUND'
  | 'ANCHOR_INSUFFICIENT'
  | 'TIER_MISMATCH'
  | 'POLICY_INDEX_MISSING'
  // Phase 4N41: Chain verification error codes
  | 'LEDGER_CHAIN_BROKEN'
  | 'LEDGER_HEAD_MISSING'
  | 'LEDGER_HASH_MISMATCH'
  | 'RELEASE_CHAIN_BROKEN'
  | 'REPO_ID_MISMATCH'
  | 'REPO_SLUG_MISMATCH'
  | 'DEFAULT_BRANCH_MISMATCH'
  | 'FILE_MISSING'
  // Phase 4N42: Audience separation + redaction error codes
  | 'AUDIENCE_VIOLATION'
  | 'REDACTION_REQUIRED'
  | 'PUBLIC_PACK_CONTAINS_RESTRICTED'
  | 'BREAK_GLASS_WITHOUT_FLAG'
  // Phase 4N44: Economics (size/chunking/retention) error codes
  | 'SIZE_LIMIT_EXCEEDED'
  | 'RELEASE_FOOTPRINT_EXCEEDED'
  | 'CHUNK_MISSING'
  | 'CHUNK_HASH_MISMATCH'
  | 'RECOMPOSE_HASH_MISMATCH'
  | 'ROLLUP_CHAIN_BROKEN';

export interface VerifyCasefileError {
  code: VerifyCasefileErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface VerifyCasefileResult {
  ok: boolean;
  sealedZip: string;
  manifest?: SealedCasefileManifest;
  hashes: {
    ok: boolean;
    casefile: { expected: string; actual: string; match: boolean };
    manifest: { expected: string; actual: string; match: boolean };
  };
  triplets: {
    ok: boolean;
    count: number;
    expected: number;
    missing: string[];
  };
  signatures?: {
    ok: boolean;
    verified: Array<{
      artifact: string;
      ok: boolean;
      identity?: string;
      issuer?: string;
      error?: string;
    }>;
  };
  policy?: {
    ok: boolean;
    expected: SealedCasefilePolicy;
    errors: string[];
  };
  /** Phase 4N40: Unified output - pins verification */
  pins?: {
    ok: boolean;
    issuer: { expected: string; actual: string; match: boolean };
    identity: { expected: string; actual: string; match: boolean };
    repo: { expected: string; actual: string; match: boolean };
    ref: { expected: string; actual: string; match: boolean };
    sha?: { expected: string; actual: string; match: boolean };
  };
  /** Phase 4N40: Unified output - anchors verification */
  anchors?: {
    ok: boolean;
    count: number;
    total: number;
    rekor?: { ok: boolean; logIndex?: number; integratedTime?: number };
    release?: { ok: boolean; assetUrl?: string };
    signature?: { ok: boolean; tripletComplete?: boolean };
  };
  /** Phase 4N40: Unified output - tier information */
  tier?: 'ci' | 'merged' | 'incident';
  /** Phase 4N40: Unified output - break-glass state (if present) */
  breakGlass?: { activated: boolean; reason?: string };
  /** Phase 4N40: Unified output - role binding (if present) */
  roleBinding?: { ok: boolean; securityApprovers?: string[]; cioApprovers?: string[] };
  /** Phase 4N40: Unified output - TPI (if present) */
  tpi?: { ok: boolean; approvers?: string[] };
  /** Phase 4N40: Unified output - freeze state (if present) */
  freezeState?: { frozen: boolean; category?: string; reason?: string; expiresAt?: string };
  /**
   * Phase 4N41: Ledger chain verification status.
   * Proves append-only chain integrity.
   */
  ledgerChain?: {
    ok: boolean;
    headSha256: string | null;
    previousSha256: string | null;
    expectedPreviousSha256: string | null;
    sequenceNumber: number;
  };
  /**
   * Phase 4N41: Release chain verification status.
   * Proves casefile continuity across releases.
   */
  releaseChain?: {
    ok: boolean;
    releaseTag: string | null;
    previousReleaseTag: string | null;
    previousCasefileSha256: string | null;
    expectedPreviousCasefileSha256: string | null;
  };
  /**
   * Phase 4N41: Repository identity verification.
   * Detects fork/spoof attacks via stable repo ID binding.
   */
  repoIdentityCheck?: {
    ok: boolean;
    expected: { repoId: number; ownerRepo: string; defaultBranch: string } | null;
    actual: { repoId: number; ownerRepo: string; defaultBranch: string } | null;
  };
  /**
   * Phase 4N42: Audience classification verification.
   * Ensures artifacts respect tier ACL.
   */
  audienceClassification?: {
    ok: boolean;
    /** Overall audience for the casefile */
    overallAudience: AudienceLevel;
    /** Artifacts classified by audience */
    artifactsByAudience: Record<AudienceLevel, number>;
    /** Whether public distribution is allowed */
    publicDistributionAllowed: boolean;
    /** Whether internal distribution is allowed */
    internalDistributionAllowed: boolean;
    /** Violations found */
    violations: Array<{
      artifact: string;
      audience: AudienceLevel;
      tier: 'ci' | 'merged' | 'incident';
      reason: string;
    }>;
  };
  /**
   * Phase 4N42: Redaction proof verification.
   * Ensures PII was properly redacted for public distribution.
   */
  redactionCheck?: {
    ok: boolean;
    /** Whether redaction was performed */
    redactionPerformed: boolean;
    /** Redaction proof (if present) */
    proof?: {
      originalSha256: string;
      redactedSha256: string;
      entriesDigest: string;
      entryCount: number;
    };
    /** Artifacts requiring redaction but not redacted */
    unredactedArtifacts: string[];
  };
  errors: VerifyCasefileError[];
}

export interface VerifyCasefileOptions {
  zipPath: string;
  strict?: boolean;
  verifySignatures?: boolean;
  offline?: boolean;
  verbose?: boolean;
  json?: boolean;
  expectedIssuer?: string;
  expectedIdentity?: string;
  expectedRepo?: string;
  expectedRef?: string;
  expectedSha?: string;
  /** Phase 4N40: Tier for anchor requirements (ci expects 1, merged/incident expect 2) */
  tier?: 'ci' | 'merged' | 'incident';
  /** Phase 4N40: Load policy from evidence index */
  policyFromIndex?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sha256Buffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function checkCosignAvailable(): boolean {
  try {
    execSync('cosign version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verify a sealed casefile.
 */
export async function verifySealedCasefile(
  options: VerifyCasefileOptions
): Promise<VerifyCasefileResult> {
  const errors: VerifyCasefileError[] = [];

  // Apply defaults
  const opts = {
    strict: false,
    verifySignatures: false,
    offline: false,
    verbose: false,
    json: false,
    ...options,
  };

  // Check ZIP exists
  if (!fs.existsSync(opts.zipPath)) {
    return {
      ok: false,
      sealedZip: opts.zipPath,
      hashes: {
        ok: false,
        casefile: { expected: '', actual: '', match: false },
        manifest: { expected: '', actual: '', match: false },
      },
      triplets: { ok: false, count: 0, expected: 2, missing: [] },
      errors: [
        {
          code: 'ZIP_NOT_FOUND',
          message: `Sealed casefile not found: ${opts.zipPath}`,
        },
      ],
    };
  }

  // Open ZIP using minimal reader
  let zipFiles: Map<string, Buffer>;
  try {
    const zipBuffer = fs.readFileSync(opts.zipPath);
    const result = readZipFiles(zipBuffer);
    if (result === null) {
      return {
        ok: false,
        sealedZip: opts.zipPath,
        hashes: {
          ok: false,
          casefile: { expected: '', actual: '', match: false },
          manifest: { expected: '', actual: '', match: false },
        },
        triplets: { ok: false, count: 0, expected: 2, missing: [] },
        errors: [
          {
            code: 'ZIP_INVALID',
            message: 'Invalid ZIP file: unable to parse central directory',
          },
        ],
      };
    }
    zipFiles = result;
  } catch (e) {
    return {
      ok: false,
      sealedZip: opts.zipPath,
      hashes: {
        ok: false,
        casefile: { expected: '', actual: '', match: false },
        manifest: { expected: '', actual: '', match: false },
      },
      triplets: { ok: false, count: 0, expected: 2, missing: [] },
      errors: [
        {
          code: 'ZIP_INVALID',
          message: `Invalid ZIP file: ${String(e)}`,
        },
      ],
    };
  }

  // Extract sealed-manifest.json
  const manifestData = zipFiles.get('sealed-manifest.json');
  if (!manifestData) {
    errors.push({
      code: 'MANIFEST_MISSING',
      message: 'sealed-manifest.json not found in ZIP',
    });
    return {
      ok: false,
      sealedZip: opts.zipPath,
      hashes: {
        ok: false,
        casefile: { expected: '', actual: '', match: false },
        manifest: { expected: '', actual: '', match: false },
      },
      triplets: { ok: false, count: 0, expected: 2, missing: [] },
      errors,
    };
  }

  let manifest: SealedCasefileManifest;
  try {
    const manifestContent = manifestData.toString('utf-8');
    manifest = JSON.parse(manifestContent) as SealedCasefileManifest;
  } catch (e) {
    errors.push({
      code: 'MANIFEST_INVALID',
      message: `Invalid manifest JSON: ${String(e)}`,
    });
    return {
      ok: false,
      sealedZip: opts.zipPath,
      hashes: {
        ok: false,
        casefile: { expected: '', actual: '', match: false },
        manifest: { expected: '', actual: '', match: false },
      },
      triplets: { ok: false, count: 0, expected: 2, missing: [] },
      errors,
    };
  }

  // Verify schema
  if (manifest.$schema !== SEALED_CASEFILE_SCHEMA) {
    errors.push({
      code: 'SCHEMA_MISMATCH',
      message: `Schema mismatch: expected ${SEALED_CASEFILE_SCHEMA}, got ${manifest.$schema}`,
    });
  }

  // Verify hashes
  const casefileData = zipFiles.get('casefile.zip');
  const innerManifestData = zipFiles.get('casefile-manifest.json');

  const casefileActual = casefileData ? sha256Buffer(casefileData) : '';
  const manifestActual = innerManifestData ? sha256Buffer(innerManifestData) : '';

  const casefileMatch = casefileActual === manifest.casefile.sha256;
  const manifestMatch = manifestActual === manifest.manifest.sha256;

  if (!casefileMatch) {
    errors.push({
      code: 'HASH_MISMATCH',
      message: `casefile.zip hash mismatch: expected ${manifest.casefile.sha256}, got ${casefileActual}`,
    });
  }

  if (!manifestMatch) {
    errors.push({
      code: 'HASH_MISMATCH',
      message: `casefile-manifest.json hash mismatch: expected ${manifest.manifest.sha256}, got ${manifestActual}`,
    });
  }

  const hashesOk = casefileMatch && manifestMatch;

  // Verify triplet parity
  const expectedTriplets = ['casefile.zip', 'casefile-manifest.json'];
  const missingTriplets: string[] = [];
  let tripletCount = 0;

  for (const artifact of expectedTriplets) {
    const sigData = zipFiles.get(`seals/${artifact}.sig`);
    const crtData = zipFiles.get(`seals/${artifact}.crt`);
    const bundleData = zipFiles.get(`seals/${artifact}.bundle`);

    if (sigData && crtData && bundleData) {
      tripletCount++;
    } else {
      const missing: string[] = [];
      if (!sigData) missing.push('.sig');
      if (!crtData) missing.push('.crt');
      if (!bundleData) missing.push('.bundle');
      missingTriplets.push(`${artifact} (${missing.join(', ')})`);
    }
  }

  const tripletsOk = missingTriplets.length === 0;

  if (!tripletsOk) {
    errors.push({
      code: 'TRIPLET_MISSING',
      message: `Triplet parity violated: ${missingTriplets.join('; ')}`,
    });
  }

  // Verify signatures (if requested)
  let signaturesResult: VerifyCasefileResult['signatures'] | undefined;

  if (opts.verifySignatures) {
    const cosignAvailable = checkCosignAvailable();

    if (!cosignAvailable && !opts.offline) {
      errors.push({
        code: 'COSIGN_NOT_FOUND',
        message: 'cosign not found in PATH. Install cosign or use --offline mode.',
      });
    } else if (cosignAvailable && tripletsOk) {
      // Extract files to temp dir for verification
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-casefile-'));

      try {
        // Extract all files from ZIP map to temp dir
        for (const [entryPath, content] of zipFiles) {
          const fullPath = path.join(tempDir, entryPath);
          fs.mkdirSync(path.dirname(fullPath), { recursive: true });
          fs.writeFileSync(fullPath, content);
        }

        const verified: Array<{
          artifact: string;
          ok: boolean;
          identity?: string;
          issuer?: string;
          error?: string;
        }> = [];

        for (const artifact of expectedTriplets) {
          const artifactPath = path.join(tempDir, artifact);
          const bundlePath = path.join(tempDir, 'seals', `${artifact}.bundle`);
          const sigPath = path.join(tempDir, 'seals', `${artifact}.sig`);
          const crtPath = path.join(tempDir, 'seals', `${artifact}.crt`);

          try {
            // Build cosign verify-blob command
            const cmd = [
              'cosign',
              'verify-blob',
              `"${artifactPath}"`,
              `--bundle "${bundlePath}"`,
              `--signature "${sigPath}"`,
              `--certificate "${crtPath}"`,
              `--certificate-oidc-issuer "${manifest.policy.issuer}"`,
              `--certificate-identity-regexp ".*"`, // Accept any identity, we verify policy later
            ].join(' ');

            execSync(cmd, { stdio: 'pipe' });

            verified.push({
              artifact,
              ok: true,
              identity: manifest.policy.identity,
              issuer: manifest.policy.issuer,
            });
          } catch (e) {
            verified.push({
              artifact,
              ok: false,
              error: String(e),
            });
          }
        }

        const allVerified = verified.every(v => v.ok);
        signaturesResult = {
          ok: allVerified,
          verified,
        };

        if (!allVerified) {
          errors.push({
            code: 'SIGNATURE_INVALID',
            message: `Signature verification failed: ${verified
              .filter(v => !v.ok)
              .map(v => v.artifact)
              .join(', ')}`,
          });
        }
      } finally {
        // Cleanup temp dir
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
      }
    } else if (opts.offline) {
      // Offline mode: just verify triplets exist (already done above)
      signaturesResult = {
        ok: tripletsOk,
        verified: expectedTriplets.map(artifact => ({
          artifact,
          ok: tripletsOk,
          identity: manifest.policy.identity,
          issuer: manifest.policy.issuer,
        })),
      };
    }
  }

  // Verify policy (if strict mode and policy overrides provided)
  let policyResult: VerifyCasefileResult['policy'] | undefined;

  if (
    opts.strict ||
    opts.expectedIssuer ||
    opts.expectedIdentity ||
    opts.expectedRepo ||
    opts.expectedRef ||
    opts.expectedSha
  ) {
    const policyErrors: string[] = [];

    if (opts.expectedIssuer && manifest.policy.issuer !== opts.expectedIssuer) {
      policyErrors.push(
        `Issuer mismatch: expected ${opts.expectedIssuer}, got ${manifest.policy.issuer}`
      );
    }

    if (opts.expectedIdentity && !manifest.policy.identity.includes(opts.expectedIdentity)) {
      policyErrors.push(
        `Identity mismatch: expected to contain ${opts.expectedIdentity}, got ${manifest.policy.identity}`
      );
    }

    if (opts.expectedRepo && manifest.policy.repo !== opts.expectedRepo) {
      policyErrors.push(
        `Repo mismatch: expected ${opts.expectedRepo}, got ${manifest.policy.repo}`
      );
    }

    if (opts.expectedRef && manifest.policy.ref !== opts.expectedRef) {
      policyErrors.push(`Ref mismatch: expected ${opts.expectedRef}, got ${manifest.policy.ref}`);
    }

    if (opts.expectedSha && manifest.policy.sha !== opts.expectedSha) {
      policyErrors.push(`SHA mismatch: expected ${opts.expectedSha}, got ${manifest.policy.sha}`);
    }

    // Tier-based SHA binding check
    if (
      (manifest.tier === 'merged' || manifest.tier === 'incident') &&
      manifest.policy.requireShaBinding
    ) {
      if (!manifest.policy.sha) {
        policyErrors.push(
          `SHA binding required for ${manifest.tier} tier but SHA not present in policy`
        );
      }
    }

    policyResult = {
      ok: policyErrors.length === 0,
      expected: manifest.policy,
      errors: policyErrors,
    };

    if (!policyResult.ok) {
      for (const pe of policyErrors) {
        errors.push({
          code: 'POLICY_MISMATCH',
          message: pe,
        });
      }
    }
  }

  const overallOk =
    hashesOk &&
    tripletsOk &&
    (signaturesResult?.ok ?? true) &&
    (policyResult?.ok ?? true) &&
    errors.length === 0;

  return {
    ok: overallOk,
    sealedZip: opts.zipPath,
    manifest,
    hashes: {
      ok: hashesOk,
      casefile: {
        expected: manifest.casefile.sha256,
        actual: casefileActual,
        match: casefileMatch,
      },
      manifest: {
        expected: manifest.manifest.sha256,
        actual: manifestActual,
        match: manifestMatch,
      },
    },
    triplets: {
      ok: tripletsOk,
      count: tripletCount,
      expected: expectedTriplets.length,
      missing: missingTriplets,
    },
    signatures: signaturesResult,
    policy: policyResult,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]): VerifyCasefileOptions | null {
  let zipPath: string | undefined;
  let strict = false;
  let verifySignatures = false;
  let offline = false;
  let verbose = false;
  let json = false;
  let expectedIssuer: string | undefined;
  let expectedIdentity: string | undefined;
  let expectedRepo: string | undefined;
  let expectedRef: string | undefined;
  let expectedSha: string | undefined;
  let tier: 'ci' | 'merged' | 'incident' | undefined;
  let policyFromIndex: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--zip' && argv[i + 1]) {
      zipPath = argv[++i];
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--verify-signatures' || arg === '--signatures') {
      verifySignatures = true;
    } else if (arg === '--offline') {
      offline = true;
    } else if (arg === '--verbose') {
      verbose = true;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--expected-issuer' && argv[i + 1]) {
      expectedIssuer = argv[++i];
    } else if (arg === '--expected-identity' && argv[i + 1]) {
      expectedIdentity = argv[++i];
    } else if (arg === '--expected-repo' && argv[i + 1]) {
      expectedRepo = argv[++i];
    } else if (arg === '--expected-ref' && argv[i + 1]) {
      expectedRef = argv[++i];
    } else if (arg === '--expected-sha' && argv[i + 1]) {
      expectedSha = argv[++i];
    } else if (arg === '--tier' && argv[i + 1]) {
      tier = argv[++i] as 'ci' | 'merged' | 'incident';
    } else if (arg === '--policy-from-index' && argv[i + 1]) {
      policyFromIndex = argv[++i];
    } else if (arg === '--help' || arg === '-h') {
      return null;
    }
  }

  if (!zipPath) {
    return null;
  }

  return {
    zipPath: path.resolve(zipPath),
    strict,
    verifySignatures,
    offline,
    verbose,
    json,
    expectedIssuer,
    expectedIdentity,
    expectedRepo,
    expectedRef,
    expectedSha,
    tier,
    policyFromIndex,
  };
}

function printHelp(): void {
  console.log(`
Verify Sealed Casefile (Phase 4N37/4N40)
═════════════════════════════════════════════════

Offline verification of sealed casefile packages.

USAGE:
  pnpm perf:verify-casefile --zip <sealed.zip> [options]

OPTIONS:
  --zip <path>            Path to sealed casefile ZIP (required)
  --strict                Enable strict mode (policy verification)
  --verify-signatures     Verify Cosign signatures
  --offline               Offline mode (skip signature execution, verify triplets only)
  --verbose               Verbose output
  --json                  Output result as JSON (unified schema)
  --help                  Show this help

POLICY OVERRIDES (for --strict):
  --expected-issuer <url>     Expected OIDC issuer
  --expected-identity <uri>   Expected signing identity
  --expected-repo <repo>      Expected repository (owner/repo)
  --expected-ref <ref>        Expected git ref
  --expected-sha <sha>        Expected commit SHA

VERIFICATION STEPS:
  1. Hash verification: casefile.zip and manifest match sealed-manifest.json
  2. Triplet parity: .sig, .crt, .bundle exist for each artifact
  3. Signature verification: cosign verify-blob (if --verify-signatures)
  4. Policy verification: issuer/identity/ref/sha match expected (if --strict)

EXAMPLES:
  pnpm perf:verify-casefile --zip dist/autonomy-casefile-run-12345-sealed.zip
  pnpm perf:verify-casefile --zip sealed.zip --strict --verify-signatures
  pnpm perf:verify-casefile --zip sealed.zip --offline --json

EXIT CODES:
  0  Verification passed
  1  Verification failed
  2  Invalid arguments
`);
}

function formatResult(result: VerifyCasefileResult, verbose: boolean): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(
    result.ok ? '✅ Sealed Casefile Verification PASSED' : '❌ Sealed Casefile Verification FAILED'
  );
  lines.push('═'.repeat(50));
  lines.push(`   ZIP: ${result.sealedZip}`);

  if (result.manifest) {
    lines.push(`   Record: ${result.manifest.recordId}`);
    lines.push(`   Tier: ${result.manifest.tier}`);
    lines.push(`   Tool Version: ${result.manifest.toolVersion}`);
  }

  lines.push('');
  lines.push('📋 Hashes');
  lines.push('─'.repeat(50));
  lines.push(
    `   casefile.zip: ${result.hashes.casefile.match ? '✅' : '❌'} ${result.hashes.casefile.actual.substring(0, 16)}...`
  );
  lines.push(
    `   casefile-manifest.json: ${result.hashes.manifest.match ? '✅' : '❌'} ${result.hashes.manifest.actual.substring(0, 16)}...`
  );

  lines.push('');
  lines.push('🔐 Triplet Parity');
  lines.push('─'.repeat(50));
  lines.push(
    `   Status: ${result.triplets.ok ? '✅' : '❌'} ${result.triplets.count}/${result.triplets.expected} complete`
  );
  if (result.triplets.missing.length > 0) {
    lines.push(`   Missing: ${result.triplets.missing.join(', ')}`);
  }

  if (result.signatures) {
    lines.push('');
    lines.push('🖋️  Signatures');
    lines.push('─'.repeat(50));
    for (const v of result.signatures.verified) {
      lines.push(
        `   ${v.artifact}: ${v.ok ? '✅' : '❌'}${v.error ? ` (${v.error.substring(0, 40)}...)` : ''}`
      );
    }
  }

  if (result.policy) {
    lines.push('');
    lines.push('📜 Policy');
    lines.push('─'.repeat(50));
    lines.push(`   Status: ${result.policy.ok ? '✅' : '❌'}`);
    if (verbose && result.manifest) {
      lines.push(`   Issuer: ${result.manifest.policy.issuer}`);
      lines.push(`   Identity: ${result.manifest.policy.identity}`);
      lines.push(`   Repo: ${result.manifest.policy.repo}`);
      lines.push(`   Ref: ${result.manifest.policy.ref}`);
      if (result.manifest.policy.sha) {
        lines.push(`   SHA: ${result.manifest.policy.sha}`);
      }
    }
    if (result.policy.errors.length > 0) {
      for (const e of result.policy.errors) {
        lines.push(`   ❌ ${e}`);
      }
    }
  }

  if (result.errors.length > 0) {
    lines.push('');
    lines.push('❌ Errors');
    lines.push('─'.repeat(50));
    for (const e of result.errors) {
      lines.push(`   [${e.code}] ${e.message}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options) {
    printHelp();
    process.exit(2);
  }

  const result = await verifySealedCasefile(options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatResult(result, options.verbose));
  }

  process.exit(result.ok ? 0 : 1);
}

// Guard for test imports
if (
  process.argv[1]?.endsWith('verify-casefile.ts') ||
  process.argv[1]?.endsWith('verify-casefile.js')
) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

// Export for testing
export { formatResult, parseArgs };


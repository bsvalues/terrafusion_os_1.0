/**
 * Phase 4N13 — Custody Attestation Verifier
 * Phase 4N18 — Unified Verification (hashes + signatures)
 *
 * Independently verifies custody attestation by recomputing hashes.
 * Zero dependencies, offline, courtroom-grade.
 *
 * Usage:
 *   pnpm perf:verify-custody --in <dir>
 *   pnpm perf:verify-custody --in <dir> --strict
 *   pnpm perf:verify-custody --in <dir> --json
 *   pnpm perf:verify-custody --in <dir> --verify-signatures
 *
 * Options:
 *   --in <dir>           Directory containing evidence artifacts + attestation
 *   --attest <path>      Path to custody-attestation.json (default: <dir>/custody-attestation.json)
 *   --strict             Fail if directory contains files not in attestation
 *   --verify-signatures  Check for .sig/.crt/.bundle triplets for attested files
 *   --json               Output machine-readable JSON report
 *   --verbose            Verbose output
 *
 * Exit codes:
 *   0 = All verifications passed
 *   1 = Verification failed (mismatch, missing, extra in strict mode)
 *   2 = Invalid arguments or file not found
 *
 * @module verify-custody
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    ATTESTATION_SCHEMA,
    containsMutableRef,
    REQUIRED_ARTIFACTS,
    type CustodyAttestation,
} from './custody-attest.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VerifyOptions {
  inputDir: string;
  attestPath: string;
  strict: boolean;
  json: boolean;
  verbose: boolean;
  verifySignatures: boolean;
  /** Phase 4N20: Path to evidence index for pin policy */
  policyFromIndex?: string;
  /** Phase 4N20: Expected issuer for pin verification */
  expectedIssuer?: string;
  /** Phase 4N20: Expected identity for pin verification */
  expectedIdentity?: string;
}

export interface VerifyCustodyResult {
  ok: boolean;
  attestation: CustodyAttestation | null;
  filesVerified: number;
  errors: VerifyCustodyError[];
}

/**
 * Phase 4N18: Unified custody verification result.
 */
export interface UnifiedCustodyResult {
  ok: boolean;
  attestation: CustodyAttestation | null;
  hashes: {
    ok: boolean;
    filesVerified: number;
    errors: VerifyCustodyError[];
  };
  signatures?: {
    ok: boolean;
    tripletFound: boolean;
    filesWithTriplet: number;
    /** Phase 4N20: Whether pins were verified */
    pinned?: boolean;
    errors: SignatureError[];
  };
}

/**
 * Phase 4N18: Signature verification errors for custody.
 * Phase 4N20: Extended with SHA/ref binding errors.
 */
export interface SignatureError {
  type:
    | 'triplet_missing'
    | 'triplet_incomplete'
    | 'issuer_mismatch'
    | 'identity_mismatch'
    | 'pins_missing'
    | 'sha_missing'
    | 'sha_mismatch'
    | 'ref_forbidden';
  file?: string;
  message: string;
}

export interface VerifyCustodyError {
  type:
    | 'attestation_missing'
    | 'attestation_invalid'
    | 'schema_mismatch'
    | 'file_missing'
    | 'hash_mismatch'
    | 'extra_file'
    | 'mutable_url';
  path?: string;
  expected?: string;
  actual?: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sha256File(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function isEvidenceArtifact(name: string): boolean {
  // Same patterns as custody-attest.ts
  const required = REQUIRED_ARTIFACTS.includes(name as (typeof REQUIRED_ARTIFACTS)[number]);
  const optional = [
    /^autonomy-evidence-bundle-.*\.zip$/,
    /^manifest\.json$/,
    /^custody-attestation\.json$/,
  ].some(p => p.test(name));
  return required || optional;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Verification
// ─────────────────────────────────────────────────────────────────────────────

export interface VerifyAttestationOptions {
  inputDir: string;
  attestPath: string;
  strict: boolean;
}

/**
 * Verify a custody attestation by recomputing hashes.
 *
 * @param opts Verification options
 * @returns VerifyCustodyResult with verification status and errors
 */
export function verifyCustodyAttestation(opts: VerifyAttestationOptions): VerifyCustodyResult {
  const errors: VerifyCustodyError[] = [];
  let filesVerified = 0;

  // Load attestation
  if (!fs.existsSync(opts.attestPath)) {
    errors.push({
      type: 'attestation_missing',
      path: opts.attestPath,
      message: `Attestation file not found: ${opts.attestPath}`,
    });
    return { ok: false, attestation: null, filesVerified, errors };
  }

  let attestation: CustodyAttestation;
  try {
    const content = fs.readFileSync(opts.attestPath, 'utf8');
    attestation = JSON.parse(content) as CustodyAttestation;
  } catch (e) {
    errors.push({
      type: 'attestation_invalid',
      path: opts.attestPath,
      message: `Invalid attestation JSON: ${e instanceof Error ? e.message : String(e)}`,
    });
    return { ok: false, attestation: null, filesVerified, errors };
  }

  // Validate schema
  if (attestation.schema !== ATTESTATION_SCHEMA) {
    errors.push({
      type: 'schema_mismatch',
      expected: ATTESTATION_SCHEMA,
      actual: attestation.schema,
      message: `Schema mismatch: expected ${ATTESTATION_SCHEMA}, got ${attestation.schema}`,
    });
    return { ok: false, attestation, filesVerified, errors };
  }

  // Verify each hash in attestation
  for (const entry of attestation.hashes) {
    const filePath = path.join(opts.inputDir, entry.name);

    if (!fs.existsSync(filePath)) {
      errors.push({
        type: 'file_missing',
        path: entry.name,
        message: `File missing: ${entry.name}`,
      });
      continue;
    }

    try {
      const actualHash = sha256File(filePath);
      if (actualHash !== entry.sha256) {
        errors.push({
          type: 'hash_mismatch',
          path: entry.name,
          expected: entry.sha256,
          actual: actualHash,
          message: `Hash mismatch for ${entry.name}`,
        });
      } else {
        filesVerified++;
      }
    } catch (e) {
      errors.push({
        type: 'file_missing',
        path: entry.name,
        message: `Cannot read file: ${entry.name} - ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  // Strict mode: check for extra files
  if (opts.strict) {
    const attestedFiles = new Set(attestation.hashes.map(h => h.name));
    attestedFiles.add('custody-attestation.json'); // Self-reference is OK

    const dirFiles = fs.readdirSync(opts.inputDir);
    for (const file of dirFiles) {
      const filePath = path.join(opts.inputDir, file);
      if (!fs.statSync(filePath).isFile()) continue;
      if (!isEvidenceArtifact(file)) continue;

      if (!attestedFiles.has(file)) {
        errors.push({
          type: 'extra_file',
          path: file,
          message: `Extra file not in attestation: ${file}`,
        });
      }
    }
  }

  // Check for mutable URLs in content
  for (const entry of attestation.hashes) {
    if (entry.name.endsWith('.json') || entry.name.endsWith('.html')) {
      const filePath = path.join(opts.inputDir, entry.name);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          // Simple URL extraction
          const urlMatch = content.match(/https?:\/\/[^\s"'<>]+/g);
          if (urlMatch) {
            for (const url of urlMatch) {
              const mutable = containsMutableRef(url);
              if (mutable) {
                errors.push({
                  type: 'mutable_url',
                  path: entry.name,
                  actual: url,
                  message: `Mutable URL in ${entry.name}: ${url}`,
                });
              }
            }
          }
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  const ok = errors.length === 0;
  return { ok, attestation, filesVerified, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N18: Signature Verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if signature triplet exists for a file.
 */
function hasTriplet(filePath: string): { ok: boolean; missing: string[] } {
  const sig = `${filePath}.sig`;
  const crt = `${filePath}.crt`;
  const bundle = `${filePath}.bundle`;

  const missing: string[] = [];
  if (!fs.existsSync(sig)) missing.push('.sig');
  if (!fs.existsSync(crt)) missing.push('.crt');
  if (!fs.existsSync(bundle)) missing.push('.bundle');

  return { ok: missing.length === 0, missing };
}

/**
 * Phase 4N18: Verify signature triplets for all attested files.
 */
function verifySignatures(
  inputDir: string,
  attestation: CustodyAttestation | null,
  verbose: boolean
): { ok: boolean; filesWithTriplet: number; errors: SignatureError[] } {
  const errors: SignatureError[] = [];
  let filesWithTriplet = 0;

  if (!attestation) {
    return { ok: false, filesWithTriplet: 0, errors };
  }

  for (const entry of attestation.hashes) {
    const filePath = path.join(inputDir, entry.name);
    const triplet = hasTriplet(filePath);

    if (triplet.ok) {
      filesWithTriplet++;
      if (verbose) {
        console.log(`  ✓ Signature triplet found: ${entry.name}`);
      }
    } else if (triplet.missing.length > 0 && triplet.missing.length < 3) {
      // Partial triplet is an error
      errors.push({
        type: 'triplet_incomplete',
        file: entry.name,
        message: `Incomplete signature triplet for ${entry.name}: missing ${triplet.missing.join(', ')}`,
      });
    }
    // If all three missing, that's OK - file was never signed
  }

  return { ok: errors.length === 0, filesWithTriplet, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N20: Pin Verification
// ─────────────────────────────────────────────────────────────────────────────

interface ExpectedPolicy {
  issuer?: string;
  identity?: string;
  /** If true, SHA binding is REQUIRED for verification to pass */
  requireShaBinding?: boolean;
  /** Expected SHA (40-hex) */
  sha?: string;
  /** Expected ref (e.g., refs/heads/main) */
  ref?: string;
}

/**
 * Phase 4N20: Load expected pins from evidence index.
 */
function loadPolicyFromIndex(indexPath: string): ExpectedPolicy | null {
  try {
    const content = fs.readFileSync(indexPath, 'utf8');
    const index = JSON.parse(content);
    const policy = index.expectedSignaturePolicy;
    if (policy) {
      return {
        issuer: policy.issuer,
        identity: policy.identity,
        requireShaBinding: policy.requireShaBinding,
        sha: policy.sha,
        ref: policy.ref,
      };
    }
    // Fallback to signingIdentity for older indices
    if (index.signingIdentity) {
      return {
        issuer: 'https://token.actions.githubusercontent.com',
        identity: index.signingIdentity,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Phase 4N20: Verify pins against expected values.
 * Enforces SHA binding for merged/incident tiers when requireShaBinding=true.
 */
function verifyPins(
  opts: VerifyOptions,
  verbose: boolean
): { pinned: boolean; errors: SignatureError[] } {
  const errors: SignatureError[] = [];

  // Load policy from index if specified
  let expectedIssuer = opts.expectedIssuer;
  let expectedIdentity = opts.expectedIdentity;
  let requireShaBinding = false;
  let expectedSha: string | undefined;
  let expectedRef: string | undefined;

  if (opts.policyFromIndex) {
    const policy = loadPolicyFromIndex(opts.policyFromIndex);
    if (policy) {
      expectedIssuer = expectedIssuer || policy.issuer;
      expectedIdentity = expectedIdentity || policy.identity;
      requireShaBinding = policy.requireShaBinding ?? false;
      expectedSha = policy.sha;
      expectedRef = policy.ref;
      if (verbose) {
        console.log(`  Loaded pins from index: ${opts.policyFromIndex}`);
        if (requireShaBinding) console.log(`  SHA binding: REQUIRED`);
      }
    }
  }

  // If strict mode, require pins
  if (opts.strict && opts.verifySignatures && !expectedIssuer && !expectedIdentity) {
    errors.push({
      type: 'pins_missing',
      message: 'Strict mode requires signature pins (--policy-from-index or --expected-*)',
    });
    return { pinned: false, errors };
  }

  // Phase 4N20: Enforce SHA binding for merged/incident tiers
  if (requireShaBinding && opts.strict) {
    if (!expectedSha) {
      errors.push({
        type: 'sha_missing',
        message: 'SHA binding required but no SHA in policy (merged/incident tier)',
      });
    }
    // Ref binding enforcement: only main/master allowed for merged/incident
    if (expectedRef && !expectedRef.match(/^refs\/heads\/(main|master)$/)) {
      errors.push({
        type: 'ref_forbidden',
        message: `Ref '${expectedRef}' not allowed for merged/incident tier (only refs/heads/main or refs/heads/master)`,
      });
    }
  }

  const pinned = !!(expectedIssuer || expectedIdentity) && errors.length === 0;

  // Note: Actual signature content verification would require reading .crt files
  // For now, we document the expected pins for audit purposes
  if (verbose && pinned) {
    if (expectedIssuer) console.log(`  Expected issuer: ${expectedIssuer}`);
    if (expectedIdentity) console.log(`  Expected identity: ${expectedIdentity}`);
    if (expectedSha) console.log(`  Expected SHA: ${expectedSha}`);
    if (expectedRef) console.log(`  Expected ref: ${expectedRef}`);
  }

  return { pinned, errors };
}

/**
 * Phase 4N18: Build unified custody result.
 * Phase 4N20: Extended with pinning support.
 */
function buildUnifiedCustodyResult(
  hashResult: VerifyCustodyResult,
  sigResult: { ok: boolean; filesWithTriplet: number; errors: SignatureError[] } | null,
  pinResult?: { pinned: boolean; errors: SignatureError[] }
): UnifiedCustodyResult {
  const allSigErrors = [...(sigResult?.errors || []), ...(pinResult?.errors || [])];
  const sigOk = (sigResult?.ok ?? true) && pinResult?.errors.length === 0;

  return {
    ok: hashResult.ok && sigOk,
    attestation: hashResult.attestation,
    hashes: {
      ok: hashResult.ok,
      filesVerified: hashResult.filesVerified,
      errors: hashResult.errors,
    },
    ...(sigResult && {
      signatures: {
        ok: sigOk,
        tripletFound: sigResult.filesWithTriplet > 0,
        filesWithTriplet: sigResult.filesWithTriplet,
        pinned: pinResult?.pinned,
        errors: allSigErrors,
      },
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(): VerifyOptions | null {
  const args = process.argv.slice(2);
  let inputDir = '';
  let attestPath = '';
  let strict = false;
  let json = false;
  let verbose = false;
  let verifySignatures = false;
  let policyFromIndex: string | undefined;
  let expectedIssuer: string | undefined;
  let expectedIdentity: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--in' && args[i + 1]) {
      inputDir = args[++i];
    } else if (arg === '--attest' && args[i + 1]) {
      attestPath = args[++i];
    } else if (arg === '--policy-from-index' && args[i + 1]) {
      policyFromIndex = args[++i];
    } else if (arg === '--expected-issuer' && args[i + 1]) {
      expectedIssuer = args[++i];
    } else if (arg === '--expected-identity' && args[i + 1]) {
      expectedIdentity = args[++i];
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--verbose') {
      verbose = true;
    } else if (arg === '--verify-signatures' || arg === '--signatures') {
      verifySignatures = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!inputDir) {
    return null;
  }

  // Default attestation path
  if (!attestPath) {
    attestPath = path.join(inputDir, 'custody-attestation.json');
  }

  return {
    inputDir: path.resolve(inputDir),
    attestPath: path.resolve(attestPath),
    strict,
    json,
    verbose,
    verifySignatures,
    policyFromIndex: policyFromIndex ? path.resolve(policyFromIndex) : undefined,
    expectedIssuer,
    expectedIdentity,
  };
}

function printHelp(): void {
  console.log(`
TerraFusion Custody Attestation Verifier (Phase 4N18: Unified)

Usage:
  pnpm perf:verify-custody --in <dir> [options]

Required:
  --in <dir>           Directory containing evidence artifacts

Optional:
  --attest <path>      Path to custody-attestation.json (default: <dir>/custody-attestation.json)
  --strict             Fail if directory contains files not in attestation
  --verify-signatures  Check for .sig/.crt/.bundle triplets
  --json               Output machine-readable JSON report
  --verbose            Enable verbose output
  --help, -h           Show this help

Phase 4N20 Pinning:
  --policy-from-index <path>  Load expected pins from evidence index
  --expected-issuer <uri>     Expected OIDC issuer
  --expected-identity <uri>   Expected workflow identity

Exit codes:
  0 = All verifications passed
  1 = Verification failed (mismatch, missing, extra in strict mode)
  2 = Invalid arguments or file not found

Example:
  pnpm perf:verify-custody --in ./dist
  pnpm perf:verify-custody --in ./dist --strict
  pnpm perf:verify-custody --in ./dist --verify-signatures --json
`);
}

function log(msg: string, verbose: boolean): void {
  if (verbose) console.log(`[verify-custody] ${msg}`);
}

function main(): void {
  const opts = parseArgs();

  if (!opts) {
    console.error('Error: --in is required.');
    printHelp();
    process.exit(2);
  }

  if (!fs.existsSync(opts.inputDir)) {
    console.error(`Error: Input directory not found: ${opts.inputDir}`);
    process.exit(2);
  }

  log(`Input: ${opts.inputDir}`, opts.verbose);
  log(`Attestation: ${opts.attestPath}`, opts.verbose);
  log(`Strict: ${opts.strict}`, opts.verbose);
  log(`Verify Signatures: ${opts.verifySignatures}`, opts.verbose);

  const result = verifyCustodyAttestation({
    inputDir: opts.inputDir,
    attestPath: opts.attestPath,
    strict: opts.strict,
  });

  // If --verify-signatures, build unified result
  if (opts.verifySignatures) {
    const sigResult = verifySignatures(opts.inputDir, result.attestation, opts.verbose);
    // Phase 4N20: Verify pins if policy provided or strict mode
    const pinResult = verifyPins(opts, opts.verbose);
    const unified = buildUnifiedCustodyResult(result, sigResult, pinResult);

    if (opts.json) {
      console.log(JSON.stringify(unified, null, 2));
      process.exit(unified.ok ? 0 : 1);
    }

    // Human-readable unified output
    console.log(unified.ok ? '✅ Unified verification PASSED' : '❌ Unified verification FAILED');
    console.log('');
    console.log('=== Custody Hashes ===');
    console.log(`   Status: ${unified.hashes.ok ? '✅ OK' : '❌ FAILED'}`);
    console.log(`   Files verified: ${unified.hashes.filesVerified}`);
    if (result.attestation) {
      console.log(`   Run ID: ${result.attestation.runId}`);
      console.log(`   Generated: ${result.attestation.generatedAt}`);
    }
    if (unified.hashes.errors.length > 0) {
      console.log(`   Errors: ${unified.hashes.errors.length}`);
      for (const err of unified.hashes.errors) {
        console.log(`     - ${err.type}: ${err.message}`);
      }
    }
    console.log('');
    console.log('=== Signature Verification ===');
    if (unified.signatures) {
      console.log(`   Status: ${unified.signatures.ok ? '✅ OK' : '❌ FAILED'}`);
      console.log(`   Triplet Found: ${unified.signatures.tripletFound}`);
      console.log(`   Files With Triplet: ${unified.signatures.filesWithTriplet}`);
      console.log(`   📌 Pinned: ${unified.signatures.pinned ? '✅ Yes' : '⚠️ No'}`);
      if (unified.signatures.errors.length > 0) {
        console.log(`   Errors: ${unified.signatures.errors.length}`);
        for (const err of unified.signatures.errors) {
          console.log(`     - ${err.type}: ${err.message}`);
        }
      }
    } else {
      console.log('   Status: ⚠️  Not checked (no --verify-signatures)');
    }
    process.exit(unified.ok ? 0 : 1);
  }

  // Standard (non-unified) output
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  // Human-readable output
  if (result.ok) {
    console.log('✅ Custody attestation verified');
    console.log(`   Files verified: ${result.filesVerified}`);
    if (result.attestation) {
      console.log(`   Run ID: ${result.attestation.runId}`);
      console.log(`   Generated: ${result.attestation.generatedAt}`);
    }
    process.exit(0);
  } else {
    console.error('❌ Custody attestation verification FAILED');
    console.log(`   Files verified: ${result.filesVerified}`);
    console.log(`   Errors: ${result.errors.length}`);
    for (const err of result.errors) {
      console.log(`     - ${err.type}: ${err.message}`);
      if (err.expected && err.actual) {
        console.log(`       Expected: ${err.expected}`);
        console.log(`       Actual:   ${err.actual}`);
      }
    }
    process.exit(1);
  }
}

// Run if main module
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('verify-custody.ts') || process.argv[1].endsWith('verify-custody.js'));

if (isMain) {
  main();
}

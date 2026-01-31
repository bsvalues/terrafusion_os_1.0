/**
 * Phase 4N13 — Custody Attestation Verifier
 *
 * Independently verifies custody attestation by recomputing hashes.
 * Zero dependencies, offline, courtroom-grade.
 *
 * Usage:
 *   pnpm perf:verify-custody --in <dir>
 *   pnpm perf:verify-custody --in <dir> --strict
 *   pnpm perf:verify-custody --in <dir> --json
 *
 * Options:
 *   --in <dir>        Directory containing evidence artifacts + attestation
 *   --attest <path>   Path to custody-attestation.json (default: <dir>/custody-attestation.json)
 *   --strict          Fail if directory contains files not in attestation
 *   --json            Output machine-readable JSON report
 *   --verbose         Verbose output
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
}

export interface VerifyCustodyResult {
  ok: boolean;
  attestation: CustodyAttestation | null;
  filesVerified: number;
  errors: VerifyCustodyError[];
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
  const required = REQUIRED_ARTIFACTS.includes(name as typeof REQUIRED_ARTIFACTS[number]);
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
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(): VerifyOptions | null {
  const args = process.argv.slice(2);
  let inputDir = '';
  let attestPath = '';
  let strict = false;
  let json = false;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--in' && args[i + 1]) {
      inputDir = args[++i];
    } else if (arg === '--attest' && args[i + 1]) {
      attestPath = args[++i];
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--verbose') {
      verbose = true;
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
  };
}

function printHelp(): void {
  console.log(`
TerraFusion Custody Attestation Verifier (Phase 4N13)

Usage:
  pnpm perf:verify-custody --in <dir> [options]

Required:
  --in <dir>         Directory containing evidence artifacts

Optional:
  --attest <path>    Path to custody-attestation.json (default: <dir>/custody-attestation.json)
  --strict           Fail if directory contains files not in attestation
  --json             Output machine-readable JSON report
  --verbose          Enable verbose output
  --help, -h         Show this help

Exit codes:
  0 = All verifications passed
  1 = Verification failed (mismatch, missing, extra in strict mode)
  2 = Invalid arguments or file not found

Example:
  pnpm perf:verify-custody --in ./dist
  pnpm perf:verify-custody --in ./dist --strict
  pnpm perf:verify-custody --in ./dist --json
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

  const result = verifyCustodyAttestation({
    inputDir: opts.inputDir,
    attestPath: opts.attestPath,
    strict: opts.strict,
  });

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
  (process.argv[1].endsWith('verify-custody.ts') ||
    process.argv[1].endsWith('verify-custody.js'));

if (isMain) {
  main();
}

/**
 * Phase 4N5 — Evidence Bundle Verifier CLI
 *
 * Independently validates ZIP bundle integrity against manifest.
 * Zero dependencies, offline, courtroom-grade.
 *
 * Usage:
 *   pnpm perf:verify-bundle --zip <bundle.zip>
 *   pnpm perf:verify-bundle --zip <bundle.zip> --strict
 *   pnpm perf:verify-bundle --zip <bundle.zip> --json
 *
 * Options:
 *   --zip <path>      Path to evidence bundle ZIP
 *   --strict          Fail if ZIP contains files not in manifest
 *   --json            Output machine-readable JSON report
 *   --verbose         Verbose output
 *
 * Exit codes:
 *   0 = All verifications passed
 *   1 = Verification failed (mismatch, missing, schema error)
 *   2 = Invalid arguments or file not found
 */

import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { sha256, type EvidenceManifest } from './manifest.js';
import { readZipEntries, readZipFileData } from './zip/zip-reader.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface VerifyOptions {
  zipPath: string;
  strict: boolean;
  json: boolean;
  verbose: boolean;
}

interface VerifyResult {
  ok: boolean;
  bundle: string;
  manifestSha: string;
  filesVerified: number;
  errors: VerifyError[];
}

interface VerifyError {
  type:
    | 'schema_invalid'
    | 'manifest_missing'
    | 'file_missing'
    | 'hash_mismatch'
    | 'extra_file'
    | 'path_traversal'
    | 'zip_invalid'
    | 'compression_unsupported';
  path?: string;
  expected?: string;
  actual?: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(): VerifyOptions | null {
  const args = process.argv.slice(2);
  let zipPath = '';
  let strict = false;
  let json = false;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--zip' && args[i + 1]) {
      zipPath = args[++i];
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

  if (!zipPath) {
    return null;
  }

  return { zipPath: resolve(zipPath), strict, json, verbose };
}

function printHelp(): void {
  console.log(`
TerraFusion Evidence Bundle Verifier

Usage:
  pnpm perf:verify-bundle --zip <bundle.zip> [--strict] [--json] [--verbose]

Options:
  --zip <path>    Path to evidence bundle ZIP (required)
  --strict        Fail if ZIP contains files not in manifest
  --json          Output machine-readable JSON report
  --verbose       Verbose output
  --help, -h      Show this help

Exit codes:
  0 = All verifications passed
  1 = Verification failed
  2 = Invalid arguments or file not found
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification Logic
// ─────────────────────────────────────────────────────────────────────────────

const EXPECTED_SCHEMA = 'terrafusion.autonomy.evidence.v1';
const MANIFEST_PATH = 'MANIFEST.json';

function verifyBundle(zipData: Buffer, options: VerifyOptions): VerifyResult {
  const errors: VerifyError[] = [];
  const bundleName = basename(options.zipPath);

  // Step 1: Parse ZIP structure
  const zipResult = readZipEntries(zipData);
  if (!zipResult.ok) {
    return {
      ok: false,
      bundle: bundleName,
      manifestSha: '',
      filesVerified: 0,
      errors: [
        {
          type: 'zip_invalid',
          message: zipResult.error || 'Invalid ZIP structure',
        },
      ],
    };
  }

  // Step 2: Find MANIFEST.json
  const manifestEntry = zipResult.entries.find((e) => e.path === MANIFEST_PATH);
  if (!manifestEntry) {
    return {
      ok: false,
      bundle: bundleName,
      manifestSha: '',
      filesVerified: 0,
      errors: [
        {
          type: 'manifest_missing',
          message: `${MANIFEST_PATH} not found in bundle`,
        },
      ],
    };
  }

  // Step 3: Read and parse manifest
  const manifestData = readZipFileData(zipData, manifestEntry);
  if (!manifestData) {
    return {
      ok: false,
      bundle: bundleName,
      manifestSha: '',
      filesVerified: 0,
      errors: [
        {
          type: 'manifest_missing',
          message: 'Failed to read MANIFEST.json data',
        },
      ],
    };
  }

  const manifestSha = sha256(manifestData);

  let manifest: EvidenceManifest;
  try {
    manifest = JSON.parse(manifestData.toString('utf8'));
  } catch {
    return {
      ok: false,
      bundle: bundleName,
      manifestSha,
      filesVerified: 0,
      errors: [
        {
          type: 'schema_invalid',
          message: 'MANIFEST.json is not valid JSON',
        },
      ],
    };
  }

  // Step 4: Validate schema version
  if (manifest.schema !== EXPECTED_SCHEMA) {
    errors.push({
      type: 'schema_invalid',
      expected: EXPECTED_SCHEMA,
      actual: manifest.schema,
      message: `Schema mismatch: expected "${EXPECTED_SCHEMA}", got "${manifest.schema}"`,
    });
  }

  // Step 4b: Validate manifest has files array
  if (!Array.isArray(manifest.files)) {
    errors.push({
      type: 'schema_invalid',
      message: 'MANIFEST.json missing or invalid "files" array',
    });
    return {
      ok: false,
      bundle: bundleName,
      manifestSha,
      filesVerified: 0,
      errors,
    };
  }

  // Step 5: Create lookup of ZIP entries (excluding manifest itself for verification)
  const zipEntryMap = new Map<string, typeof zipResult.entries[0]>();
  for (const entry of zipResult.entries) {
    zipEntryMap.set(entry.path, entry);
  }

  // Step 6: Verify each manifest file exists and matches hash
  let verified = 0;
  const manifestPaths = new Set<string>();

  for (const file of manifest.files) {
    manifestPaths.add(file.path);

    // Skip MANIFEST.json itself (it's not in its own list)
    if (file.path === MANIFEST_PATH) {
      continue;
    }

    const entry = zipEntryMap.get(file.path);

    if (!entry) {
      errors.push({
        type: 'file_missing',
        path: file.path,
        message: `File missing from ZIP: ${file.path}`,
      });
      continue;
    }

    // Check compression
    if (entry.compression !== 0) {
      errors.push({
        type: 'compression_unsupported',
        path: file.path,
        message: `Unsupported compression for: ${file.path}`,
      });
      continue;
    }

    // Read file data
    const fileData = readZipFileData(zipData, entry);
    if (!fileData) {
      errors.push({
        type: 'file_missing',
        path: file.path,
        message: `Failed to read file data: ${file.path}`,
      });
      continue;
    }

    // Verify SHA256
    const actualHash = sha256(fileData);
    if (actualHash !== file.sha256) {
      errors.push({
        type: 'hash_mismatch',
        path: file.path,
        expected: file.sha256,
        actual: actualHash,
        message: `Hash mismatch for ${file.path}`,
      });
      continue;
    }

    verified++;
  }

  // Step 7: Strict mode - check for extra files
  if (options.strict) {
    for (const entry of zipResult.entries) {
      // MANIFEST.json is allowed
      if (entry.path === MANIFEST_PATH) {
        continue;
      }
      if (!manifestPaths.has(entry.path)) {
        errors.push({
          type: 'extra_file',
          path: entry.path,
          message: `Extra file not in manifest: ${entry.path}`,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    bundle: bundleName,
    manifestSha,
    filesVerified: verified,
    errors,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Output Formatting
// ─────────────────────────────────────────────────────────────────────────────

function formatHumanResult(result: VerifyResult, verbose: boolean): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('  TerraFusion Evidence Bundle Verification');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`  Bundle:         ${result.bundle}`);
  lines.push(`  Manifest SHA:   ${result.manifestSha || '(not found)'}`);
  lines.push(`  Files Verified: ${result.filesVerified}`);
  lines.push('');

  if (result.ok) {
    lines.push('  ✅ VERIFICATION PASSED');
    lines.push('');
    lines.push('  All files match their manifest hashes.');
    lines.push('  This bundle has not been tampered with.');
  } else {
    lines.push('  ❌ VERIFICATION FAILED');
    lines.push('');
    lines.push(`  ${result.errors.length} error${result.errors.length === 1 ? '' : 's'} found:`);
    lines.push('');

    // Show first error in detail, summarize rest
    const firstError = result.errors[0];
    lines.push(`  → [${firstError.type.toUpperCase()}] ${firstError.message}`);

    if (firstError.path) {
      lines.push(`    Path: ${firstError.path}`);
    }
    if (firstError.expected && firstError.actual) {
      lines.push(`    Expected: ${firstError.expected.substring(0, 16)}...`);
      lines.push(`    Actual:   ${firstError.actual.substring(0, 16)}...`);
    }

    if (result.errors.length > 1) {
      lines.push('');
      lines.push(`  ... and ${result.errors.length - 1} more error(s).`);
      if (verbose) {
        lines.push('');
        for (let i = 1; i < result.errors.length; i++) {
          const err = result.errors[i];
          lines.push(`  → [${err.type.toUpperCase()}] ${err.message}`);
        }
      } else {
        lines.push('  Use --verbose to see all errors.');
      }
    }
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  const options = parseArgs();

  if (!options) {
    console.error('Error: --zip <path> is required');
    console.error('Use --help for usage information');
    process.exit(2);
  }

  if (!existsSync(options.zipPath)) {
    console.error(`Error: File not found: ${options.zipPath}`);
    process.exit(2);
  }

  // Read ZIP file
  const zipData = readFileSync(options.zipPath);

  // Verify bundle
  const result = verifyBundle(zipData, options);

  // Output result
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatHumanResult(result, options.verbose));
  }

  // Exit with appropriate code
  process.exit(result.ok ? 0 : 1);
}

// Run if main module
if (process.argv[1] && (process.argv[1].endsWith('verify-bundle.ts') || process.argv[1].endsWith('verify-bundle.js'))) {
  main();
}

// Export for testing
export { verifyBundle, parseArgs, type VerifyResult, type VerifyError, type VerifyOptions };

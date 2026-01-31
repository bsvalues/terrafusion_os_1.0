/**
 * Phase 4N13 — Custody Attestation Generator
 *
 * Computes SHA256 hashes for all evidence artifacts to create
 * a self-verifying custody attestation. Like a digital evidence bag.
 *
 * Usage:
 *   pnpm perf:custody-attest --in <dir> --out custody-attestation.json
 *   pnpm perf:custody-attest --in <dir> --out custody-attestation.json --strict
 *
 * Options:
 *   --in <dir>        Directory containing evidence artifacts
 *   --out <path>      Output path for attestation JSON
 *   --strict          Fail if any expected artifact is missing
 *   --verbose         Verbose output
 *
 * @module custody-attest
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { readZipEntries, readZipFileData } from './zip/zip-reader.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const ATTESTATION_SCHEMA = 'terrafusion.autonomy.custody-attestation.v1' as const;
export const TOOL_VERSION = '1.0.0' as const;

/**
 * Required artifacts for a complete attestation.
 * Names are either exact or glob patterns (single * only).
 */
export const REQUIRED_ARTIFACTS = [
  'autonomy-ledger.html',
  'autonomy-dashboard.html',
  'autonomy-evidence-index.json',
  'autonomy-custody.html',
] as const;

/**
 * Patterns for optional artifacts that should be hashed if present.
 */
export const OPTIONAL_ARTIFACT_PATTERNS = [
  /^autonomy-evidence-bundle-.*\.zip$/,
  /^manifest\.json$/,
  /^custody-attestation\.json$/,
] as const;

/**
 * Mutable URL patterns that MUST be rejected.
 */
export const MUTABLE_URL_PATTERNS = [
  /\/latest\/?$/i,
  /\/download\/latest/i,
  /refs\/heads\//i,
  /git\.io\//i,
  /bit\.ly\//i,
  /tinyurl\./i,
  /@latest$/i,
  /branch=/i,
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ArtifactHash {
  /** Artifact filename */
  name: string;
  /** SHA256 hex string */
  sha256: string;
  /** File size in bytes */
  bytes: number;
  /** Source: 'file' or 'zip-entry' (for manifest inside bundle) */
  source: 'file' | 'zip-entry';
}

export interface ManifestHashFromBundle {
  /** Source bundle name */
  bundleName: string;
  /** SHA256 of manifest.json inside the bundle */
  manifestSha256: string;
}

export interface CustodyAttestation {
  /** Schema identifier */
  schema: typeof ATTESTATION_SCHEMA;
  /** Tool version */
  toolVersion: string;
  /** Generation timestamp (ISO 8601) */
  generatedAt: string;
  /** CI run ID (from env or explicit) */
  runId: string;
  /** Input directory used */
  inputDir: string;
  /** All artifact hashes (deterministic order) */
  hashes: ArtifactHash[];
  /** Manifest hashes extracted from ZIP bundles */
  manifestsFromBundles: ManifestHashFromBundle[];
  /** Present artifact count */
  presentCount: number;
  /** Missing required artifacts */
  missingRequired: string[];
  /** All artifact names found */
  foundArtifacts: string[];
}

export interface AttestOptions {
  inputDir: string;
  outputPath: string;
  strict: boolean;
  verbose: boolean;
  runId?: string;
}

export interface AttestResult {
  ok: boolean;
  attestation: CustodyAttestation;
  errors: AttestError[];
}

export interface AttestError {
  type: 'missing_required' | 'mutable_url' | 'hash_failed' | 'invalid_input';
  artifact?: string;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function sha256File(filePath: string): { sha256: string; bytes: number } {
  const data = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return { sha256: hash, bytes: data.length };
}

function sha256Buffer(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function isRequiredArtifact(name: string): boolean {
  return REQUIRED_ARTIFACTS.includes(name as (typeof REQUIRED_ARTIFACTS)[number]);
}

function isOptionalArtifact(name: string): boolean {
  return OPTIONAL_ARTIFACT_PATTERNS.some(pattern => pattern.test(name));
}

function isEvidenceArtifact(name: string): boolean {
  return isRequiredArtifact(name) || isOptionalArtifact(name);
}

/**
 * Check if a URL/string contains mutable references.
 * Returns the matching pattern if mutable, null if immutable.
 */
export function containsMutableRef(value: string): RegExp | null {
  for (const pattern of MUTABLE_URL_PATTERNS) {
    if (pattern.test(value)) {
      return pattern;
    }
  }
  return null;
}

/**
 * Extract manifest.json SHA256 from inside a ZIP bundle.
 */
function extractManifestFromBundle(zipPath: string): ManifestHashFromBundle | null {
  try {
    const zipData = fs.readFileSync(zipPath);
    const entriesResult = readZipEntries(zipData);
    if (!entriesResult.ok || !entriesResult.entries) return null;

    const manifestEntry = entriesResult.entries.find(e => e.path === 'manifest.json');
    if (!manifestEntry) return null;

    const manifestData = readZipFileData(zipData, manifestEntry);
    if (!manifestData) return null;

    return {
      bundleName: path.basename(zipPath),
      manifestSha256: sha256Buffer(manifestData),
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Attestation Builder
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildAttestOptions {
  inputDir: string;
  runId?: string;
}

/**
 * Build a custody attestation from artifacts in a directory.
 *
 * @param opts Options including input directory
 * @returns AttestResult with attestation and any errors
 */
export function buildAttestation(opts: BuildAttestOptions): AttestResult {
  const errors: AttestError[] = [];
  const hashes: ArtifactHash[] = [];
  const manifestsFromBundles: ManifestHashFromBundle[] = [];
  const foundArtifacts: string[] = [];
  const missingRequired: string[] = [];

  // Read directory
  let files: string[];
  try {
    files = fs.readdirSync(opts.inputDir);
  } catch (e) {
    errors.push({
      type: 'invalid_input',
      message: `Cannot read directory: ${opts.inputDir}`,
    });
    return {
      ok: false,
      attestation: createEmptyAttestation(opts),
      errors,
    };
  }

  // Process each file
  for (const file of files) {
    if (!isEvidenceArtifact(file)) continue;

    const filePath = path.join(opts.inputDir, file);
    if (!fs.statSync(filePath).isFile()) continue;

    foundArtifacts.push(file);

    try {
      const { sha256, bytes } = sha256File(filePath);
      hashes.push({
        name: file,
        sha256,
        bytes,
        source: 'file',
      });

      // Extract manifest from ZIP bundles
      if (file.endsWith('.zip')) {
        const manifestHash = extractManifestFromBundle(filePath);
        if (manifestHash) {
          manifestsFromBundles.push(manifestHash);
        }
      }
    } catch (e) {
      errors.push({
        type: 'hash_failed',
        artifact: file,
        message: `Failed to hash: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  // Check for missing required artifacts
  for (const required of REQUIRED_ARTIFACTS) {
    if (!foundArtifacts.includes(required)) {
      missingRequired.push(required);
      errors.push({
        type: 'missing_required',
        artifact: required,
        message: `Missing required artifact: ${required}`,
      });
    }
  }

  // Sort everything for determinism
  hashes.sort((a, b) => a.name.localeCompare(b.name));
  manifestsFromBundles.sort((a, b) => a.bundleName.localeCompare(b.bundleName));
  foundArtifacts.sort();
  missingRequired.sort();

  const attestation: CustodyAttestation = {
    schema: ATTESTATION_SCHEMA,
    toolVersion: TOOL_VERSION,
    generatedAt: new Date().toISOString(),
    runId: opts.runId ?? process.env.GITHUB_RUN_ID ?? 'local',
    inputDir: opts.inputDir,
    hashes,
    manifestsFromBundles,
    presentCount: foundArtifacts.length,
    missingRequired,
    foundArtifacts,
  };

  const ok = errors.filter(e => e.type === 'missing_required').length === 0;

  return { ok, attestation, errors };
}

function createEmptyAttestation(opts: BuildAttestOptions): CustodyAttestation {
  return {
    schema: ATTESTATION_SCHEMA,
    toolVersion: TOOL_VERSION,
    generatedAt: new Date().toISOString(),
    runId: opts.runId ?? process.env.GITHUB_RUN_ID ?? 'local',
    inputDir: opts.inputDir,
    hashes: [],
    manifestsFromBundles: [],
    presentCount: 0,
    missingRequired: [...REQUIRED_ARTIFACTS],
    foundArtifacts: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// URL Validation (for evidence index/custody files)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate all URLs in an evidence file to ensure no mutable refs.
 *
 * @param content File content (JSON string or parsed object)
 * @returns Array of mutable URL errors
 */
export function validateNoMutableUrls(content: string | object): AttestError[] {
  const errors: AttestError[] = [];
  const text = typeof content === 'string' ? content : JSON.stringify(content);

  // Find all URL-like strings
  const urlPatterns = [
    /https?:\/\/[^\s"'<>]+/g,
    /"(ledgerUrl|releaseUrl|bundleDownloadUrl|dashboardUrl|custodyUrl)":\s*"([^"]+)"/g,
  ];

  for (const pattern of urlPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const url = match[2] ?? match[0];
      const mutablePattern = containsMutableRef(url);
      if (mutablePattern) {
        errors.push({
          type: 'mutable_url',
          artifact: url,
          message: `Mutable URL detected: "${url}" matches ${mutablePattern}`,
        });
      }
    }
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(): AttestOptions | null {
  const args = process.argv.slice(2);
  let inputDir = '';
  let outputPath = '';
  let strict = false;
  let verbose = false;
  let runId: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--in' && args[i + 1]) {
      inputDir = args[++i];
    } else if (arg === '--out' && args[i + 1]) {
      outputPath = args[++i];
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg === '--verbose') {
      verbose = true;
    } else if (arg === '--run-id' && args[i + 1]) {
      runId = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!inputDir || !outputPath) {
    return null;
  }

  return {
    inputDir: path.resolve(inputDir),
    outputPath: path.resolve(outputPath),
    strict,
    verbose,
    runId,
  };
}

function printHelp(): void {
  console.log(`
TerraFusion Custody Attestation Generator (Phase 4N13)

Usage:
  pnpm perf:custody-attest --in <dir> --out <path> [options]

Required:
  --in <dir>         Directory containing evidence artifacts
  --out <path>       Output path for attestation JSON

Optional:
  --strict           Fail if any required artifact is missing
  --verbose          Enable verbose output
  --run-id <id>      Override run ID (default: GITHUB_RUN_ID or 'local')
  --help, -h         Show this help

Required artifacts:
  autonomy-ledger.html
  autonomy-dashboard.html
  autonomy-evidence-index.json
  autonomy-custody.html

Optional artifacts (hashed if present):
  autonomy-evidence-bundle-*.zip
  manifest.json

Example:
  pnpm perf:custody-attest --in ./dist --out ./dist/custody-attestation.json
  pnpm perf:custody-attest --in ./dist --out ./dist/custody-attestation.json --strict
`);
}

function log(msg: string, verbose: boolean): void {
  if (verbose) console.log(`[custody-attest] ${msg}`);
}

function main(): void {
  const opts = parseArgs();

  if (!opts) {
    console.error('Error: --in and --out are required.');
    printHelp();
    process.exit(2);
  }

  if (!fs.existsSync(opts.inputDir)) {
    console.error(`Error: Input directory not found: ${opts.inputDir}`);
    process.exit(2);
  }

  log(`Input: ${opts.inputDir}`, opts.verbose);
  log(`Output: ${opts.outputPath}`, opts.verbose);

  const result = buildAttestation({
    inputDir: opts.inputDir,
    runId: opts.runId,
  });

  // Check for mutable URLs in evidence files
  for (const artifact of result.attestation.foundArtifacts) {
    if (artifact.endsWith('.json') || artifact.endsWith('.html')) {
      const filePath = path.join(opts.inputDir, artifact);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const urlErrors = validateNoMutableUrls(content);
        result.errors.push(...urlErrors);
        if (urlErrors.length > 0) {
          result.ok = false;
        }
      } catch {
        // Skip files that can't be read
      }
    }
  }

  // Output attestation
  const outDir = path.dirname(opts.outputPath);
  if (outDir && !fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(opts.outputPath, JSON.stringify(result.attestation, null, 2) + '\n', 'utf8');
  log(`Wrote: ${opts.outputPath}`, opts.verbose);

  // Report results
  console.log(`✅ Attestation generated: ${opts.outputPath}`);
  console.log(`   Artifacts: ${result.attestation.presentCount} present`);
  console.log(
    `   Required: ${REQUIRED_ARTIFACTS.length - result.attestation.missingRequired.length}/${REQUIRED_ARTIFACTS.length}`
  );

  if (result.attestation.missingRequired.length > 0) {
    console.log(`   Missing: ${result.attestation.missingRequired.join(', ')}`);
  }

  if (result.errors.length > 0) {
    console.log(`   Errors: ${result.errors.length}`);
    for (const err of result.errors) {
      console.log(`     - ${err.type}: ${err.message}`);
    }
  }

  if (opts.strict && !result.ok) {
    console.error('STRICT mode: Attestation failed.');
    process.exit(1);
  }

  process.exit(result.ok ? 0 : 1);
}

// Run if main module
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('custody-attest.ts') || process.argv[1].endsWith('custody-attest.js'));

if (isMain) {
  main();
}

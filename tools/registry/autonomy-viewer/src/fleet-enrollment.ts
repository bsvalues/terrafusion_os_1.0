/**
 * Fleet Enrollment - Batch County Rollout
 * ========================================
 * Phase I: Operator-Scale Rollout
 *
 * Generates accreditation packets for multiple counties in a single run.
 * Produces:
 * - Per-county accreditation bundles
 * - Fleet summary index with verification status
 * - Isolated failure handling (one county failure doesn't block others)
 *
 * @schema terrafusion.autonomy.fleet-index.v1
 * @version 4N51.1
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateAccreditationPacket } from './accreditation-packet.js';
import { verifyAccreditationPacket } from './accreditation-verify.js';
import { toJsonWithLF } from './utils/deterministic-json.js';
import { normalizePath } from './utils/path-normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const FLEET_INDEX_SCHEMA = 'terrafusion.autonomy.fleet-index.v1';
export const FLEET_INDEX_VERSION = '4N51.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CountyEnrollmentInput {
  /** Unique county identifier (e.g., 'benton-wa') */
  readonly id: string;
  /** Human-readable county name */
  readonly name: string;
  /** Jurisdiction code (e.g., 'WA', 'OR') */
  readonly jurisdiction: string;
  /** Profile to use (default: 'county') */
  readonly profile?: string;
  /** Additional notes */
  readonly notes?: string;
}

export interface FleetEnrollmentOptions {
  /** List of counties to enroll */
  readonly counties: readonly CountyEnrollmentInput[];
  /** Base output directory for all counties */
  readonly outDir: string;
  /** Whether to verify each packet after generation */
  readonly verify?: boolean;
  /** Continue on failure (default: true) */
  readonly continueOnError?: boolean;
  /** Profile to use for all counties (can be overridden per-county) */
  readonly defaultProfile?: string;
  /** Base directory for profile lookup */
  readonly baseDir?: string;
}

export interface CountyEnrollmentResult {
  readonly id: string;
  readonly name: string;
  readonly jurisdiction: string;
  readonly profile: string;
  readonly outDir: string;
  readonly ok: boolean;
  readonly packetHash?: string;
  readonly verifyResult?: 'passed' | 'failed' | 'skipped';
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly generatedAt: string;
  readonly durationMs: number;
}

export interface FleetIndexResult {
  readonly $schema: typeof FLEET_INDEX_SCHEMA;
  readonly version: typeof FLEET_INDEX_VERSION;
  readonly generatedAt: string;
  readonly totalCounties: number;
  readonly succeeded: number;
  readonly failed: number;
  readonly verified: number;
  readonly verifyFailed: number;
  readonly counties: readonly CountyEnrollmentResult[];
  readonly ok: boolean;
  readonly durationMs: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Codes
// ─────────────────────────────────────────────────────────────────────────────

const ERROR_CODES = {
  MISSING_COUNTIES: 'FLEET_MISSING_COUNTIES',
  MISSING_OUTDIR: 'FLEET_MISSING_OUTDIR',
  INVALID_INPUT: 'FLEET_INVALID_INPUT',
  COUNTY_GENERATION_FAILED: 'FLEET_COUNTY_GENERATION_FAILED',
  COUNTY_VERIFICATION_FAILED: 'FLEET_COUNTY_VERIFICATION_FAILED',
  WRITE_FAILED: 'FLEET_WRITE_FAILED',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enroll multiple counties in a single batch operation.
 *
 * @param options - Fleet enrollment options
 * @returns FleetIndexResult with per-county results and summary
 */
export function enrollFleet(options: FleetEnrollmentOptions): FleetIndexResult {
  const startTime = Date.now();
  const generatedAt = new Date().toISOString();
  const continueOnError = options.continueOnError ?? true;
  const verify = options.verify ?? true;
  const defaultProfile = options.defaultProfile ?? 'county';
  const baseDir = options.baseDir ?? resolve(__dirname, '..');

  // ─────────────────────────────────────────────────────────────────────────
  // Input Validation
  // ─────────────────────────────────────────────────────────────────────────

  if (!options.counties || options.counties.length === 0) {
    return createFailureResult({
      generatedAt,
      errorCode: ERROR_CODES.MISSING_COUNTIES,
      errorMessage: 'No counties provided for enrollment',
      durationMs: Date.now() - startTime,
    });
  }

  if (!options.outDir || options.outDir.trim() === '') {
    return createFailureResult({
      generatedAt,
      errorCode: ERROR_CODES.MISSING_OUTDIR,
      errorMessage: 'Output directory is required',
      durationMs: Date.now() - startTime,
    });
  }

  // Validate each county input
  const validationErrors: string[] = [];
  for (const county of options.counties) {
    if (!county.id || county.id.trim() === '') {
      validationErrors.push(`County missing 'id' field`);
    }
    if (!county.name || county.name.trim() === '') {
      validationErrors.push(`County '${county.id}' missing 'name' field`);
    }
    if (!county.jurisdiction || county.jurisdiction.trim() === '') {
      validationErrors.push(`County '${county.id}' missing 'jurisdiction' field`);
    }
  }

  if (validationErrors.length > 0) {
    return createFailureResult({
      generatedAt,
      errorCode: ERROR_CODES.INVALID_INPUT,
      errorMessage: validationErrors.join('; '),
      durationMs: Date.now() - startTime,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Setup Output Directory
  // ─────────────────────────────────────────────────────────────────────────

  const outDir = resolve(options.outDir);
  try {
    mkdirSync(outDir, { recursive: true });
  } catch (err) {
    return createFailureResult({
      generatedAt,
      errorCode: ERROR_CODES.WRITE_FAILED,
      errorMessage: `Failed to create output directory: ${(err as Error).message}`,
      durationMs: Date.now() - startTime,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Process Each County
  // ─────────────────────────────────────────────────────────────────────────

  const results: CountyEnrollmentResult[] = [];

  for (const county of options.counties) {
    const countyStart = Date.now();
    const countyOutDir = join(outDir, county.id);
    const profile = county.profile ?? defaultProfile;

    try {
      // Generate accreditation packet
      const packetResult = generateAccreditationPacket({
        profile,
        outDir: countyOutDir,
        baseDir,
        accreditationInfo: {
          countyName: county.name,
          jurisdiction: county.jurisdiction,
          preparedBy: 'TerraFusion Fleet Enrollment',
          preparedFor: 'County CIO Review',
          notes: county.notes,
        },
      });

      if (!packetResult.ok) {
        results.push({
          id: county.id,
          name: county.name,
          jurisdiction: county.jurisdiction,
          profile,
          outDir: normalizePath(countyOutDir),
          ok: false,
          verifyResult: 'skipped',
          errorCode: packetResult.errorCode ?? ERROR_CODES.COUNTY_GENERATION_FAILED,
          errorMessage: packetResult.errorMessage ?? 'Packet generation failed',
          generatedAt: packetResult.generatedAt,
          durationMs: Date.now() - countyStart,
        });

        if (!continueOnError) break;
        continue;
      }

      // Calculate packet hash (manifest hash serves as packet identity)
      const manifestPath = join(countyOutDir, 'manifest.json');
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifestData = JSON.parse(manifestContent);
      const packetHash = manifestData.files?.find(
        (f: { path: string }) => f.path === 'accreditation-packet.json'
      )?.sha256;

      // Verify if requested
      let verifyResult: 'passed' | 'failed' | 'skipped' = 'skipped';
      let verifyError: string | undefined;

      if (verify) {
        const verifyOutput = verifyAccreditationPacket({
          packetDir: countyOutDir,
        });
        verifyResult = verifyOutput.ok ? 'passed' : 'failed';
        if (!verifyOutput.ok) {
          verifyError = verifyOutput.errorMessage;
        }
      }

      results.push({
        id: county.id,
        name: county.name,
        jurisdiction: county.jurisdiction,
        profile,
        outDir: normalizePath(countyOutDir),
        ok: true,
        packetHash,
        verifyResult,
        errorCode: verifyResult === 'failed' ? ERROR_CODES.COUNTY_VERIFICATION_FAILED : undefined,
        errorMessage: verifyError,
        generatedAt: packetResult.generatedAt,
        durationMs: Date.now() - countyStart,
      });
    } catch (err) {
      results.push({
        id: county.id,
        name: county.name,
        jurisdiction: county.jurisdiction,
        profile,
        outDir: normalizePath(countyOutDir),
        ok: false,
        verifyResult: 'skipped',
        errorCode: ERROR_CODES.COUNTY_GENERATION_FAILED,
        errorMessage: (err as Error).message,
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - countyStart,
      });

      if (!continueOnError) break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Build Summary
  // ─────────────────────────────────────────────────────────────────────────

  const succeeded = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const verified = results.filter(r => r.verifyResult === 'passed').length;
  const verifyFailed = results.filter(r => r.verifyResult === 'failed').length;

  const fleetIndex: FleetIndexResult = {
    $schema: FLEET_INDEX_SCHEMA,
    version: FLEET_INDEX_VERSION,
    generatedAt,
    totalCounties: options.counties.length,
    succeeded,
    failed,
    verified,
    verifyFailed,
    counties: results.sort((a, b) => a.id.localeCompare(b.id)),
    ok: failed === 0 && verifyFailed === 0,
    durationMs: Date.now() - startTime,
  };

  // Write fleet index
  const indexPath = join(outDir, 'fleet-index.json');
  writeFileSync(indexPath, toJsonWithLF(fleetIndex), 'utf-8');

  return fleetIndex;
}

/**
 * Load county enrollment input from a JSON file.
 *
 * @param filePath - Path to counties JSON file
 * @returns Array of county enrollment inputs
 */
export function loadCountiesFromFile(filePath: string): CountyEnrollmentInput[] {
  if (!existsSync(filePath)) {
    throw new Error(`Counties file not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  if (!Array.isArray(data.counties)) {
    throw new Error('Counties file must contain a "counties" array');
  }

  return data.counties as CountyEnrollmentInput[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createFailureResult(params: {
  generatedAt: string;
  errorCode: string;
  errorMessage: string;
  durationMs: number;
}): FleetIndexResult {
  return {
    $schema: FLEET_INDEX_SCHEMA,
    version: FLEET_INDEX_VERSION,
    generatedAt: params.generatedAt,
    totalCounties: 0,
    succeeded: 0,
    failed: 0,
    verified: 0,
    verifyFailed: 0,
    counties: [],
    ok: false,
    durationMs: params.durationMs,
  };
}

export default enrollFleet;

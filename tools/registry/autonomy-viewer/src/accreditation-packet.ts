/**
 * Accreditation Packet Generator
 * ================================
 * Phase: County Deployment Package + Accreditation Packet Automation
 *
 * Generates a complete accreditation evidence bundle that includes:
 * - County Kit execution results
 * - Manifest with SHA256 hashes for all artifacts
 * - Compliance summary for review
 * - Accreditation metadata
 *
 * One command produces a ready-to-file evidence bundle for county accreditation.
 *
 * @schema terrafusion.autonomy.accreditation-packet.v1
 * @version 4N51.1
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runCountyKit, type CountyKitResult } from './county-kit.js';
import { toJsonWithLF } from './utils/deterministic-json.js';
import { normalizePath } from './utils/path-normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const ACCREDITATION_PACKET_SCHEMA = 'terrafusion.autonomy.accreditation-packet.v1';
export const ACCREDITATION_PACKET_VERSION = '4N51.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AccreditationPacketOptions {
  /** Profile name (e.g., 'benton-county') */
  readonly profile: string;
  /** Output directory for all artifacts */
  readonly outDir: string;
  /** Base directory for profile lookup */
  readonly baseDir?: string;
  /** Optional accreditation metadata */
  readonly accreditationInfo?: AccreditationInfo;
}

export interface AccreditationInfo {
  readonly countyName?: string;
  readonly jurisdiction?: string;
  readonly preparedBy?: string;
  readonly preparedFor?: string;
  readonly notes?: string;
}

export interface AccreditationPacketResult {
  readonly schemaId: typeof ACCREDITATION_PACKET_SCHEMA;
  readonly schemaVersion: typeof ACCREDITATION_PACKET_VERSION;
  readonly generatedAt: string;
  readonly profile: string;
  readonly outDir: string;
  readonly ok: boolean;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  readonly manifest: ManifestSummary;
  readonly evidence: EvidenceReferences;
  readonly accreditationInfo?: AccreditationInfo;
  readonly complianceSummary?: ComplianceSummary;
}

export interface ManifestSummary {
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly manifestPath: string;
}

export interface EvidenceReferences {
  readonly kitSummary: string;
  readonly manifest: string;
  readonly steps: readonly string[];
}

export interface ComplianceSummary {
  readonly overallStatus: 'passed' | 'failed' | 'partial';
  readonly sloGateStatus: 'pass' | 'warn' | 'fail' | 'unknown';
  readonly drillsCompleted: number;
  readonly drillsPassed: number;
  readonly bootstrapValid: boolean;
}

export interface ManifestFile {
  readonly path: string;
  readonly sha256: string;
  readonly sizeBytes: number;
}

export interface Manifest {
  readonly $schema: 'terrafusion.autonomy.manifest.v1';
  readonly version: '4N51.1';
  readonly generatedAt: string;
  readonly profile: string;
  readonly files: readonly ManifestFile[];
  readonly totalBytes: number;
  readonly fileCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Codes
// ─────────────────────────────────────────────────────────────────────────────

const ERROR_CODES = {
  MISSING_PROFILE: 'ACCREDITATION_MISSING_PROFILE',
  MISSING_OUTDIR: 'ACCREDITATION_MISSING_OUTDIR',
  KIT_FAILED: 'ACCREDITATION_KIT_FAILED',
  WRITE_FAILED: 'ACCREDITATION_WRITE_FAILED',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a complete accreditation packet.
 *
 * @param options - Generation options
 * @returns AccreditationPacketResult with all evidence references
 */
export function generateAccreditationPacket(
  options: AccreditationPacketOptions
): AccreditationPacketResult {
  const generatedAt = new Date().toISOString();

  // ─────────────────────────────────────────────────────────────────────────
  // Input Validation
  // ─────────────────────────────────────────────────────────────────────────

  if (!options.profile || options.profile.trim() === '') {
    return createFailureResult({
      generatedAt,
      profile: options.profile || '',
      outDir: options.outDir || '',
      errorCode: ERROR_CODES.MISSING_PROFILE,
      errorMessage: 'Profile name is required',
    });
  }

  if (!options.outDir || options.outDir.trim() === '') {
    return createFailureResult({
      generatedAt,
      profile: options.profile,
      outDir: options.outDir || '',
      errorCode: ERROR_CODES.MISSING_OUTDIR,
      errorMessage: 'Output directory is required',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Run County Kit
  // ─────────────────────────────────────────────────────────────────────────

  const outDir = resolve(options.outDir);
  const baseDir = options.baseDir ?? resolve(__dirname, '..');

  const kitResult = runCountyKit({
    profile: options.profile,
    outDir,
    baseDir,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Generate Manifest
  // ─────────────────────────────────────────────────────────────────────────

  const manifest = generateManifest(outDir, options.profile, generatedAt);
  const manifestPath = join(outDir, 'manifest.json');
  writeFileSync(manifestPath, toJsonWithLF(manifest), 'utf-8');

  // ─────────────────────────────────────────────────────────────────────────
  // Build Compliance Summary
  // ─────────────────────────────────────────────────────────────────────────

  const complianceSummary = buildComplianceSummary(kitResult, outDir);

  // ─────────────────────────────────────────────────────────────────────────
  // Build Evidence References
  // ─────────────────────────────────────────────────────────────────────────

  const evidence: EvidenceReferences = {
    kitSummary: 'county-kit-summary.json',
    manifest: 'manifest.json',
    steps: kitResult.steps.map(s => s.outputFile),
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Build Result
  // ─────────────────────────────────────────────────────────────────────────

  const result: AccreditationPacketResult = {
    schemaId: ACCREDITATION_PACKET_SCHEMA,
    schemaVersion: ACCREDITATION_PACKET_VERSION,
    generatedAt,
    profile: options.profile,
    outDir: normalizePath(outDir),
    ok: kitResult.ok,
    errorCode: kitResult.ok ? undefined : ERROR_CODES.KIT_FAILED,
    errorMessage: kitResult.ok ? undefined : kitResult.errorMessage,
    manifest: {
      fileCount: manifest.fileCount,
      totalBytes: manifest.totalBytes,
      manifestPath: 'manifest.json',
    },
    evidence,
    accreditationInfo: options.accreditationInfo,
    complianceSummary,
  };

  // Write accreditation packet
  const packetPath = join(outDir, 'accreditation-packet.json');
  writeFileSync(packetPath, toJsonWithLF(result), 'utf-8');

  // Update manifest with accreditation packet itself
  const finalManifest = generateManifest(outDir, options.profile, generatedAt);
  writeFileSync(manifestPath, toJsonWithLF(finalManifest), 'utf-8');

  return {
    ...result,
    manifest: {
      fileCount: finalManifest.fileCount,
      totalBytes: finalManifest.totalBytes,
      manifestPath: 'manifest.json',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateManifest(outDir: string, profile: string, generatedAt: string): Manifest {
  const files: ManifestFile[] = [];
  let totalBytes = 0;

  function walkDir(dir: string, relativePath: string) {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = join(dir, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walkDir(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        // Skip manifest itself to avoid circular reference
        if (entry.name === 'manifest.json') continue;

        const content = readFileSync(fullPath);
        const sha256 = createHash('sha256').update(content).digest('hex');
        const sizeBytes = content.length;

        files.push({
          path: normalizePath(relPath),
          sha256,
          sizeBytes,
        });

        totalBytes += sizeBytes;
      }
    }
  }

  walkDir(outDir, '');

  return {
    $schema: 'terrafusion.autonomy.manifest.v1',
    version: '4N51.1',
    generatedAt,
    profile,
    files,
    totalBytes,
    fileCount: files.length,
  };
}

function buildComplianceSummary(kitResult: CountyKitResult, outDir: string): ComplianceSummary {
  // Read drills result if available
  const drillsPath = join(outDir, 'steps', 'drills.json');
  let drillsCompleted = 0;
  let drillsPassed = 0;

  if (existsSync(drillsPath)) {
    try {
      const drillsData = JSON.parse(readFileSync(drillsPath, 'utf-8'));
      if (Array.isArray(drillsData.exercisesRun)) {
        drillsCompleted = drillsData.exercisesRun.length;
        drillsPassed = drillsData.exercisesRun.filter(
          (e: { status?: string }) => e.status === 'passed'
        ).length;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Read bootstrap result
  const bootstrapPath = join(outDir, 'steps', 'bootstrap.json');
  let bootstrapValid = false;

  if (existsSync(bootstrapPath)) {
    try {
      const bootstrapData = JSON.parse(readFileSync(bootstrapPath, 'utf-8'));
      bootstrapValid = bootstrapData.ok === true;
    } catch {
      // Ignore parse errors
    }
  }

  // Determine overall status
  let overallStatus: 'passed' | 'failed' | 'partial' = 'passed';
  if (!kitResult.ok) {
    overallStatus = kitResult.summary.stepsPassed === 0 ? 'failed' : 'partial';
  }

  return {
    overallStatus,
    sloGateStatus: kitResult.summary.sloGateStatus ?? 'unknown',
    drillsCompleted,
    drillsPassed,
    bootstrapValid,
  };
}

function createFailureResult(params: {
  generatedAt: string;
  profile: string;
  outDir: string;
  errorCode: string;
  errorMessage: string;
}): AccreditationPacketResult {
  return {
    schemaId: ACCREDITATION_PACKET_SCHEMA,
    schemaVersion: ACCREDITATION_PACKET_VERSION,
    generatedAt: params.generatedAt,
    profile: params.profile,
    outDir: normalizePath(params.outDir),
    ok: false,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
    manifest: {
      fileCount: 0,
      totalBytes: 0,
      manifestPath: '',
    },
    evidence: {
      kitSummary: '',
      manifest: '',
      steps: [],
    },
  };
}

export default generateAccreditationPacket;

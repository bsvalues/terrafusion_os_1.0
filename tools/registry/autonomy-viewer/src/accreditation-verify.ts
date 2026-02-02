/**
 * Accreditation Packet Verifier
 * =============================
 * Verifies the integrity of accreditation packets by:
 * - Recomputing SHA256 hashes and comparing to manifest
 * - Validating required files exist
 * - Checking schema compliance
 *
 * Fails closed: any anomaly = verification failure
 *
 * @module accreditation-verify
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { normalizePath } from './utils/path-normalize.js';

// ============================================================================
// Contract Definition
// ============================================================================

/**
 * Accreditation Contract v1
 * Defines the immutable requirements for valid accreditation packets.
 */
export const ACCREDITATION_CONTRACT = {
  version: '1.0.0',

  /** Files that must exist in every valid packet */
  requiredFiles: ['accreditation-packet.json', 'manifest.json', 'county-kit-summary.json'],

  /** Fields that must exist in accreditation-packet.json */
  requiredPacketFields: [
    'schemaId',
    'schemaVersion',
    'generatedAt',
    'profile',
    'manifest',
    'evidence',
    'complianceSummary',
  ],

  /** Determinism rules for cross-platform consistency */
  determinismRules: {
    sortedKeys: true,
    normalizedPaths: true,
    lfLineEndings: true,
  },

  /** Supported schema versions (for forward/backward compat) */
  supportedSchemaVersions: ['4N51.1'],
} as const;

// ============================================================================
// Types
// ============================================================================

export interface AccreditationVerifyOptions {
  /** Absolute path to the accreditation packet directory */
  packetDir: string;

  /** If true, warn instead of fail on version mismatch */
  lenientVersionCheck?: boolean;
}

export interface HashMismatch {
  file: string;
  expected: string;
  actual: string;
}

export interface AccreditationVerifyResult {
  ok: boolean;
  verifiedAt: string;
  packetDir: string;
  filesVerified: number;
  hashMismatches: HashMismatch[];
  missingFiles: string[];
  schemaViolations: string[];
  errorCode?: string;
  errorMessage?: string;
}

interface ManifestFile {
  path: string;
  sha256: string;
  bytes: number;
}

interface Manifest {
  $schema: string;
  version: string;
  generatedAt: string;
  profile: string;
  files: ManifestFile[];
  totalBytes: number;
  fileCount: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function computeSha256(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

function validatePacketFields(packet: Record<string, unknown>): string[] {
  const violations: string[] = [];

  for (const field of ACCREDITATION_CONTRACT.requiredPacketFields) {
    if (!(field in packet) || packet[field] === undefined || packet[field] === null) {
      violations.push(`Missing required field: ${field}`);
    }
  }

  return violations;
}

function validateSchemaVersion(packet: Record<string, unknown>): string[] {
  const violations: string[] = [];

  const version = packet.schemaVersion as string | undefined;
  if (version && !ACCREDITATION_CONTRACT.supportedSchemaVersions.includes(version as never)) {
    violations.push(
      `Unsupported schema version: ${version}. Supported: ${ACCREDITATION_CONTRACT.supportedSchemaVersions.join(', ')}`
    );
  }

  return violations;
}

// ============================================================================
// Main Verification Function
// ============================================================================

/**
 * Verifies an accreditation packet's integrity and compliance.
 *
 * @param options Verification options
 * @returns Verification result (fails closed on any anomaly)
 */
export function verifyAccreditationPacket(
  options: AccreditationVerifyOptions
): AccreditationVerifyResult {
  const { packetDir, lenientVersionCheck = false } = options;
  const verifiedAt = new Date().toISOString();

  const result: AccreditationVerifyResult = {
    ok: false,
    verifiedAt,
    packetDir: normalizePath(packetDir),
    filesVerified: 0,
    hashMismatches: [],
    missingFiles: [],
    schemaViolations: [],
  };

  // Check directory exists
  if (!existsSync(packetDir)) {
    result.errorCode = 'DIRECTORY_NOT_FOUND';
    result.errorMessage = `Packet directory does not exist: ${packetDir}`;
    return result;
  }

  if (!statSync(packetDir).isDirectory()) {
    result.errorCode = 'NOT_A_DIRECTORY';
    result.errorMessage = `Path is not a directory: ${packetDir}`;
    return result;
  }

  // Check manifest exists
  const manifestPath = join(packetDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    result.errorCode = 'MANIFEST_NOT_FOUND';
    result.errorMessage = 'manifest.json not found in packet directory';
    return result;
  }

  // Parse manifest
  let manifest: Manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch (err) {
    result.errorCode = 'MANIFEST_PARSE_ERROR';
    result.errorMessage = `Failed to parse manifest.json: ${err instanceof Error ? err.message : String(err)}`;
    return result;
  }

  // Validate manifest structure
  if (!Array.isArray(manifest.files)) {
    result.errorCode = 'MANIFEST_INVALID';
    result.errorMessage = 'manifest.json missing files array';
    return result;
  }

  // Check accreditation-packet.json exists and validate
  const packetPath = join(packetDir, 'accreditation-packet.json');
  if (!existsSync(packetPath)) {
    result.errorCode = 'PACKET_NOT_FOUND';
    result.errorMessage = 'accreditation-packet.json not found in packet directory';
    return result;
  }

  let packet: Record<string, unknown>;
  try {
    packet = JSON.parse(readFileSync(packetPath, 'utf-8'));
  } catch (err) {
    result.errorCode = 'PACKET_PARSE_ERROR';
    result.errorMessage = `Failed to parse accreditation-packet.json: ${err instanceof Error ? err.message : String(err)}`;
    return result;
  }

  // Validate packet fields
  result.schemaViolations.push(...validatePacketFields(packet));

  // Validate schema version (if not lenient)
  if (!lenientVersionCheck) {
    result.schemaViolations.push(...validateSchemaVersion(packet));
  }

  // Check required files exist
  for (const requiredFile of ACCREDITATION_CONTRACT.requiredFiles) {
    const filePath = join(packetDir, requiredFile);
    if (!existsSync(filePath)) {
      result.missingFiles.push(requiredFile);
    }
  }

  // Verify all manifest files
  for (const manifestFile of manifest.files) {
    const filePath = join(packetDir, manifestFile.path);
    const normalizedPath = normalizePath(manifestFile.path);

    if (!existsSync(filePath)) {
      result.missingFiles.push(normalizedPath);
      continue;
    }

    // Compute actual hash
    const actualHash = computeSha256(filePath);

    if (actualHash !== manifestFile.sha256) {
      result.hashMismatches.push({
        file: normalizedPath,
        expected: manifestFile.sha256,
        actual: actualHash,
      });
    }

    result.filesVerified++;
  }

  // Determine overall result
  result.ok =
    result.hashMismatches.length === 0 &&
    result.missingFiles.length === 0 &&
    result.schemaViolations.length === 0;

  return result;
}

// ============================================================================
// CLI Interface
// ============================================================================

export interface VerifyCLIOptions {
  packetDir: string;
  verbose?: boolean;
  json?: boolean;
}

export function runVerifyCLI(options: VerifyCLIOptions): number {
  const result = verifyAccreditationPacket({
    packetDir: options.packetDir,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TerraFusion Accreditation Packet Verification');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`  Packet Directory: ${result.packetDir}`);
    console.log(`  Verified At:      ${result.verifiedAt}`);
    console.log(`  Files Verified:   ${result.filesVerified}`);
    console.log('');

    if (result.ok) {
      console.log('  ✅ VERIFICATION PASSED');
      console.log('');
      console.log('  All files match their recorded hashes.');
      console.log('  All required fields present.');
      console.log('  Schema compliance verified.');
    } else {
      console.log('  ❌ VERIFICATION FAILED');
      console.log('');

      if (result.errorCode) {
        console.log(`  Error: ${result.errorCode}`);
        console.log(`  ${result.errorMessage}`);
        console.log('');
      }

      if (result.missingFiles.length > 0) {
        console.log('  Missing Files:');
        for (const file of result.missingFiles) {
          console.log(`    - ${file}`);
        }
        console.log('');
      }

      if (result.hashMismatches.length > 0) {
        console.log('  Hash Mismatches (TAMPERING DETECTED):');
        for (const mismatch of result.hashMismatches) {
          console.log(`    - ${mismatch.file}`);
          if (options.verbose) {
            console.log(`        Expected: ${mismatch.expected}`);
            console.log(`        Actual:   ${mismatch.actual}`);
          }
        }
        console.log('');
      }

      if (result.schemaViolations.length > 0) {
        console.log('  Schema Violations:');
        for (const violation of result.schemaViolations) {
          console.log(`    - ${violation}`);
        }
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
  }

  return result.ok ? 0 : 1;
}

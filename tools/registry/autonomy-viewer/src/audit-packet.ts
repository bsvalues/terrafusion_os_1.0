/**
 * Phase 4N46 – Audit Packet Generator
 * ====================================
 *
 * Produces a signed, verifiable audit packet for external auditors:
 *   - Ledger head + rollup head
 *   - Selected casefiles + packs
 *   - Verification reports
 *   - Key epoch + revocation summary
 *   - Telemetry excerpt hashes
 *   - Runbooks + policy profile
 *
 * @module audit-packet
 * @version 4N46.1
 */

import { createHash, randomUUID } from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIT_PACKET_SCHEMA = 'terrafusion.autonomy.audit-packet.v1';
export const AUDIT_PACKET_VERSION = '4N46.1';

// ─────────────────────────────────────────────────────────────────────────────
// Required Artifacts
// ─────────────────────────────────────────────────────────────────────────────

export const REQUIRED_AUDIT_ARTIFACTS = [
  'ledger-head',
  'rollup-head',
  'key-epoch-summary',
  'revocation-summary',
  'policy-profile',
] as const;

export type RequiredArtifact = (typeof REQUIRED_AUDIT_ARTIFACTS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LedgerHeadSummary {
  readonly sha256: string;
  readonly sequenceNumber: number;
  readonly timestamp: string;
}

export interface RollupHeadSummary {
  readonly sha256: string;
  readonly month: string;
  readonly timestamp: string;
}

export interface CasefileSummary {
  readonly casefileId: string;
  readonly sha256: string;
  readonly timestamp: string;
  readonly audience: 'internal' | 'county' | 'state' | 'public';
}

export interface VerificationReportSummary {
  readonly reportId: string;
  readonly sha256: string;
  readonly timestamp: string;
  readonly outcome: 'PASS' | 'FAIL';
}

export interface RotationHistoryEntry {
  readonly epoch: number;
  readonly rotatedAt: string;
}

export interface KeyEpochSummary {
  readonly currentEpoch: number;
  readonly validFrom: string;
  readonly rotationHistory: readonly RotationHistoryEntry[];
}

export interface RevocationSummary {
  readonly revokedEpochs: readonly number[];
  readonly lastRevocationCheck: string;
}

export interface ComplianceReference {
  readonly framework: 'FISMA' | 'SOC2' | 'HIPAA' | 'StateAudit';
  readonly controls: readonly string[];
}

export interface AuditPeriod {
  readonly start: string;
  readonly end: string;
}

export interface ArtifactCounts {
  readonly casefiles: number;
  readonly verificationReports: number;
  readonly runbooks: number;
  readonly telemetryExcerpts: number;
}

export interface AuditPacketManifest {
  readonly $schema: typeof AUDIT_PACKET_SCHEMA;
  readonly version: typeof AUDIT_PACKET_VERSION;
  readonly packetId: string;
  readonly generatedAt: string;
  readonly generatedBy: string;
  readonly repoIdentity: string;

  // Core artifacts
  readonly ledgerHead: LedgerHeadSummary;
  readonly rollupHead: RollupHeadSummary;
  readonly casefiles: readonly CasefileSummary[];
  readonly verificationReports: readonly VerificationReportSummary[];

  // Key management
  readonly keyEpochSummary: KeyEpochSummary;
  readonly revocationSummary: RevocationSummary;

  // Telemetry
  readonly telemetryExcerptHashes: readonly string[];

  // Configuration
  readonly profileUsed: string;
  readonly runbooksIncluded: readonly string[];

  // Metadata
  readonly artifactTypes: readonly string[];
  readonly artifactCounts: ArtifactCounts;
  readonly complianceReferences: readonly ComplianceReference[];
  readonly auditPeriod: AuditPeriod;

  // Signing
  readonly signatureSlot: string | null;
  readonly packetHash?: string;
}

export interface AuditPacketOptions {
  readonly repoIdentity: string;
  readonly generatedBy: string;
  readonly ledgerHead: LedgerHeadSummary;
  readonly rollupHead: RollupHeadSummary;
  casefiles: readonly CasefileSummary[];
  verificationReports: readonly VerificationReportSummary[];
  readonly keyEpochSummary: KeyEpochSummary;
  readonly revocationSummary: RevocationSummary;
  readonly telemetryExcerptHashes: readonly string[];
  readonly profileUsed: string;
  readonly runbooksIncluded: readonly string[];
  readonly auditPeriodStart?: string;
  readonly auditPeriodEnd?: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings?: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Manifest Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an audit packet manifest from options.
 */
export function createAuditPacketManifest(options: AuditPacketOptions): AuditPacketManifest {
  const now = new Date().toISOString();

  const artifactTypes: string[] = [
    'ledger-head',
    'rollup-head',
    'key-epoch-summary',
    'revocation-summary',
  ];

  if (options.casefiles.length > 0) {
    artifactTypes.push('casefile');
  }
  if (options.verificationReports.length > 0) {
    artifactTypes.push('verification-report');
  }
  if (options.runbooksIncluded.length > 0) {
    artifactTypes.push('runbook');
  }
  if (options.telemetryExcerptHashes.length > 0) {
    artifactTypes.push('telemetry-excerpt');
  }

  const manifest: AuditPacketManifest = {
    $schema: AUDIT_PACKET_SCHEMA,
    version: AUDIT_PACKET_VERSION,
    packetId: randomUUID(),
    generatedAt: now,
    generatedBy: options.generatedBy,
    repoIdentity: options.repoIdentity,

    ledgerHead: options.ledgerHead,
    rollupHead: options.rollupHead,
    casefiles: options.casefiles,
    verificationReports: options.verificationReports,

    keyEpochSummary: options.keyEpochSummary,
    revocationSummary: options.revocationSummary,

    telemetryExcerptHashes: options.telemetryExcerptHashes,

    profileUsed: options.profileUsed,
    runbooksIncluded: options.runbooksIncluded,

    artifactTypes,
    artifactCounts: {
      casefiles: options.casefiles.length,
      verificationReports: options.verificationReports.length,
      runbooks: options.runbooksIncluded.length,
      telemetryExcerpts: options.telemetryExcerptHashes.length,
    },

    complianceReferences: [
      {
        framework: 'FISMA',
        controls: ['AU-2', 'AU-3', 'AU-6', 'AU-9', 'AU-12'],
      },
      {
        framework: 'StateAudit',
        controls: ['EVIDENCE-INTEGRITY', 'CHAIN-OF-CUSTODY', 'RETENTION'],
      },
    ],

    auditPeriod: {
      start: options.auditPeriodStart ?? deriveAuditPeriodStart(options),
      end: options.auditPeriodEnd ?? now,
    },

    signatureSlot: null,
  };

  return manifest;
}

/**
 * Derive audit period start from earliest artifact.
 */
function deriveAuditPeriodStart(options: AuditPacketOptions): string {
  const timestamps: string[] = [
    options.ledgerHead.timestamp,
    options.rollupHead.timestamp,
    ...options.casefiles.map(c => c.timestamp),
    ...options.verificationReports.map(r => r.timestamp),
  ];

  const sorted = timestamps.sort();
  return sorted[0] ?? new Date().toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Manifest Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate an audit packet manifest.
 */
export function validateAuditPacketManifest(manifest: AuditPacketManifest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required artifacts
  if (!manifest.ledgerHead) {
    errors.push('Missing required artifact: ledger-head');
  }
  if (!manifest.rollupHead) {
    errors.push('Missing required artifact: rollup-head');
  }
  if (!manifest.keyEpochSummary) {
    errors.push('Missing required artifact: key-epoch-summary');
  }
  if (!manifest.revocationSummary) {
    errors.push('Missing required artifact: revocation-summary');
  }

  // Check schema
  if (manifest.$schema !== AUDIT_PACKET_SCHEMA) {
    errors.push(`Invalid schema: ${manifest.$schema}`);
  }

  // Warnings for missing but optional artifacts
  if (!manifest.verificationReports || manifest.verificationReports.length === 0) {
    warnings.push('No verification reports included - consider adding external verification');
  }
  if (!manifest.runbooksIncluded || manifest.runbooksIncluded.length === 0) {
    warnings.push('No runbooks included - auditor may need operational context');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Packet Hash
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute SHA256 hash of the manifest for signing.
 */
export function computePacketHash(manifest: AuditPacketManifest): string {
  // Create a copy without signature slot for hashing
  const { signatureSlot: _sig, packetHash: _hash, ...hashableContent } = manifest;

  const canonical = JSON.stringify(hashableContent, Object.keys(hashableContent).sort());
  const hash = createHash('sha256').update(canonical).digest('hex');

  return `sha256:${hash}`;
}

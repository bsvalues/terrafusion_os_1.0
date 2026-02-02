/**
 * Phase 4N45d – Disaster Recovery Reconstitution
 * ===============================================
 *
 * Deterministic head reconstitution from released artifacts:
 *   - Artifact discovery from multiple sources
 *   - Chain validation and head selection
 *   - Fail-closed on ambiguity
 *   - Signed reconstitution reports
 *
 * @module dr-reconstitution
 * @version 4N45.1
 */

import { createHash, randomUUID } from 'node:crypto';
import { emitTelemetry, type TelemetrySink } from './telemetry-sinks.js';
import { createTelemetryEvent, type TelemetryEnvelope } from './telemetry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const DR_SCHEMA = 'terrafusion.autonomy.dr.v1';
export const DR_VERSION = '4N45.1';

// ─────────────────────────────────────────────────────────────────────────────
// DR Event Types
// ─────────────────────────────────────────────────────────────────────────────

export const DR_EVENT_TYPES = [
  'dr_reconstitution_started',
  'dr_head_rebuilt',
  'dr_reconstitution_failed',
] as const;

export type DREventType = (typeof DR_EVENT_TYPES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DRArtifactType =
  | 'ledger-head'
  | 'ledger-snapshot'
  | 'rollup-head'
  | 'rollup'
  | 'casefile'
  | 'verification-report'
  | 'telemetry-log'
  | 'public-pack'
  | 'internal-pack'
  | 'deletion-intent'
  | 'revocation-record';

export interface DRArtifact {
  readonly type: DRArtifactType;
  readonly path: string;
  readonly sha256: string;
  readonly timestamp: string;
  readonly source?: 'github-release' | 'airgap-usb' | 'file-sink' | 'local';
  readonly content?: Readonly<Record<string, unknown>>;
}

export interface DiscoveredArtifacts {
  readonly ledgerHead?: DRArtifact;
  readonly ledgerSnapshots: readonly DRArtifact[];
  readonly rollupHead?: DRArtifact;
  readonly rollups: readonly DRArtifact[];
  readonly casefiles: readonly DRArtifact[];
  readonly verificationReports: readonly DRArtifact[];
  readonly telemetryLogs: readonly DRArtifact[];
  readonly publicPacks: readonly DRArtifact[];
  readonly internalPacks: readonly DRArtifact[];
  readonly deletionIntents: readonly DRArtifact[];
  readonly revocationRecords: readonly DRArtifact[];
}

export type DRErrorCode =
  | 'DR_HEAD_AMBIGUOUS'
  | 'DR_HEAD_NOT_FOUND'
  | 'DR_CHAIN_BROKEN'
  | 'DR_INSUFFICIENT_ASSETS';

export interface RebuiltHead {
  readonly sha256: string;
  readonly sequenceNumber: number;
  readonly month?: string;
}

export interface DRReconstitutionResult {
  readonly ok: boolean;
  readonly rebuiltHead?: RebuiltHead;
  readonly headSource?:
    | 'existing'
    | 'reconstructed'
    | 'public-pack'
    | 'internal-pack'
    | 'telemetry-log';
  readonly errorCode?: DRErrorCode;
  readonly errorMessage?: string;
  readonly artifacts: readonly DRArtifact[];
  readonly missingArtifacts: readonly string[];
  readonly warnings: readonly string[];
  readonly chainValidation?: ChainValidationResult;
}

export interface ChainValidationResult {
  readonly valid: boolean;
  readonly chainLength: number;
  readonly brokenLinks?: readonly string[];
  readonly gaps?: readonly number[];
}

export interface DeletionIntent {
  readonly caseId: string;
  readonly reason: string;
  readonly deletedAt: string;
  readonly authorizedBy: string;
}

export interface RevocationContext {
  readonly revokedEpochs?: readonly { epochNumber: number; reason: string; revokedAt: string }[];
}

export interface PartialLossResult {
  readonly ok: boolean;
  readonly recoveredHead?: RebuiltHead;
  readonly partialRecovery?: boolean;
  readonly errorCode?: DRErrorCode;
  readonly errorMessage?: string;
  readonly missingArtifacts?: readonly string[];
  readonly warnings?: readonly string[];
  readonly deletionIntents?: readonly DeletionIntent[];
  readonly revocationContext?: RevocationContext;
}

// ─────────────────────────────────────────────────────────────────────────────
// Artifact Discovery
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Discover and categorize artifacts from a bag of inputs.
 */
export function discoverArtifacts(artifacts: readonly DRArtifact[]): DiscoveredArtifacts {
  const ledgerSnapshots: DRArtifact[] = [];
  const rollups: DRArtifact[] = [];
  const casefiles: DRArtifact[] = [];
  const verificationReports: DRArtifact[] = [];
  const telemetryLogs: DRArtifact[] = [];
  const publicPacks: DRArtifact[] = [];
  const internalPacks: DRArtifact[] = [];
  const deletionIntents: DRArtifact[] = [];
  const revocationRecords: DRArtifact[] = [];

  let ledgerHead: DRArtifact | undefined;
  let rollupHead: DRArtifact | undefined;

  for (const artifact of artifacts) {
    switch (artifact.type) {
      case 'ledger-head':
        ledgerHead = artifact;
        break;
      case 'ledger-snapshot':
        ledgerSnapshots.push(artifact);
        break;
      case 'rollup-head':
        rollupHead = artifact;
        break;
      case 'rollup':
        rollups.push(artifact);
        break;
      case 'casefile':
        casefiles.push(artifact);
        break;
      case 'verification-report':
        verificationReports.push(artifact);
        break;
      case 'telemetry-log':
        telemetryLogs.push(artifact);
        break;
      case 'public-pack':
        publicPacks.push(artifact);
        break;
      case 'internal-pack':
        internalPacks.push(artifact);
        break;
      case 'deletion-intent':
        deletionIntents.push(artifact);
        break;
      case 'revocation-record':
        revocationRecords.push(artifact);
        break;
    }
  }

  // Sort by timestamp
  const sortByTimestamp = (a: DRArtifact, b: DRArtifact) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();

  return {
    ledgerHead,
    ledgerSnapshots: [...ledgerSnapshots].sort(sortByTimestamp),
    rollupHead,
    rollups: [...rollups].sort(sortByTimestamp),
    casefiles: [...casefiles].sort(sortByTimestamp),
    verificationReports: [...verificationReports].sort(sortByTimestamp),
    telemetryLogs: [...telemetryLogs].sort(sortByTimestamp),
    publicPacks: [...publicPacks].sort(sortByTimestamp),
    internalPacks: [...internalPacks].sort(sortByTimestamp),
    deletionIntents: [...deletionIntents].sort(sortByTimestamp),
    revocationRecords: [...revocationRecords].sort(sortByTimestamp),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chain Validation
// ─────────────────────────────────────────────────────────────────────────────

interface ChainLink {
  readonly sha256: string;
  readonly previousHash: string | null;
  readonly sequenceNumber: number;
}

/**
 * Extract sequence number from artifact content.
 * For rollups, derive sequence from month (YYYY-MM).
 */
function extractSequenceNumber(
  content: Readonly<Record<string, unknown>> | undefined,
  artifactType: DRArtifactType
): number {
  if (!content) return 0;

  // Direct sequence number takes precedence
  if (typeof content.sequenceNumber === 'number') {
    return content.sequenceNumber;
  }

  // For rollups, derive sequence from month
  if (artifactType === 'rollup' && typeof content.month === 'string') {
    const match = content.month.match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      // Convert to monotonic sequence: 2024-01 = 202401
      return year * 100 + month;
    }
  }

  return 0;
}

/**
 * Validate a chain of linked artifacts.
 */
export function validateChain(chain: readonly ChainLink[]): ChainValidationResult {
  if (chain.length === 0) {
    return { valid: true, chainLength: 0 };
  }

  // Sort by sequence number
  const sorted = [...chain].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  const brokenLinks: string[] = [];
  const gaps: number[] = [];
  const hashMap = new Map<string, ChainLink>();

  // Build hash lookup
  for (const link of sorted) {
    hashMap.set(link.sha256, link);
  }

  // Check first element's previousHash if non-null and non-genesis
  const first = sorted[0];
  if (first.previousHash && !hashMap.has(first.previousHash)) {
    brokenLinks.push(first.previousHash);
  }

  // Validate linkage and gaps for remaining elements
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Check sequence gap
    if (curr.sequenceNumber !== prev.sequenceNumber + 1) {
      for (let seq = prev.sequenceNumber + 1; seq < curr.sequenceNumber; seq++) {
        gaps.push(seq);
      }
    }

    // Check previousHash linkage
    if (curr.previousHash && !hashMap.has(curr.previousHash)) {
      brokenLinks.push(curr.previousHash);
    }
  }

  const valid = brokenLinks.length === 0 && gaps.length === 0;

  return {
    valid,
    chainLength: sorted.length,
    brokenLinks: brokenLinks.length > 0 ? brokenLinks : undefined,
    gaps: gaps.length > 0 ? gaps : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Candidate Head Selection
// ─────────────────────────────────────────────────────────────────────────────

interface CandidateHead {
  readonly sha256: string;
  readonly sequenceNumber: number;
  readonly source: DRArtifact;
}

/**
 * Select candidate head from artifacts.
 */
export function selectCandidateHead(
  snapshots: readonly DRArtifact[],
  headType: 'ledger' | 'rollup'
): { candidates: CandidateHead[]; ambiguous: boolean } {
  if (snapshots.length === 0) {
    return { candidates: [], ambiguous: false };
  }

  // Group by sequence number to detect forks
  const bySequence = new Map<number, CandidateHead[]>();

  for (const snap of snapshots) {
    const seq = extractSequenceNumber(
      snap.content as Readonly<Record<string, unknown>> | undefined,
      snap.type
    );
    const candidate: CandidateHead = {
      sha256: snap.sha256,
      sequenceNumber: seq,
      source: snap,
    };

    const existing = bySequence.get(seq) ?? [];
    existing.push(candidate);
    bySequence.set(seq, existing);
  }

  // Find highest sequence
  const maxSeq = Math.max(...bySequence.keys());
  const headsAtMax = bySequence.get(maxSeq) ?? [];

  // Multiple different heads at same sequence = fork = ambiguous
  if (headsAtMax.length > 1) {
    const uniqueHashes = new Set(headsAtMax.map(h => h.sha256));
    if (uniqueHashes.size > 1) {
      return { candidates: headsAtMax, ambiguous: true };
    }
  }

  return { candidates: headsAtMax, ambiguous: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Head Reconstitution
// ─────────────────────────────────────────────────────────────────────────────

export interface ReconstituteHeadOptions {
  readonly artifacts: readonly DRArtifact[];
  readonly headType: 'ledger' | 'rollup';
  readonly preferSource?: 'github-release' | 'airgap-usb' | 'file-sink';
  readonly preferPublicPack?: boolean;
  readonly requireInternalPack?: boolean;
  readonly useTelemetryFallback?: boolean;
}

/**
 * Reconstitute head from artifacts.
 */
export function reconstituteHead(options: ReconstituteHeadOptions): DRReconstitutionResult {
  const { artifacts, headType, preferPublicPack, requireInternalPack, useTelemetryFallback } =
    options;

  const discovered = discoverArtifacts(artifacts);
  const warnings: string[] = [];
  const missingArtifacts: string[] = [];

  // Check for existing head
  const existingHead = headType === 'ledger' ? discovered.ledgerHead : discovered.rollupHead;
  if (existingHead) {
    return {
      ok: true,
      rebuiltHead: {
        sha256: existingHead.sha256,
        sequenceNumber: (existingHead.content as { sequenceNumber?: number })?.sequenceNumber ?? 0,
      },
      headSource: 'existing',
      artifacts,
      missingArtifacts,
      warnings,
    };
  }

  // Check for public pack
  if (preferPublicPack && discovered.publicPacks.length > 0) {
    const pack = discovered.publicPacks[discovered.publicPacks.length - 1];
    const headSha = (pack.content as { ledgerHeadSha256?: string })?.ledgerHeadSha256;
    if (headSha) {
      return {
        ok: true,
        rebuiltHead: { sha256: headSha, sequenceNumber: 0 },
        headSource: 'public-pack',
        artifacts,
        missingArtifacts,
        warnings,
      };
    }
  }

  // Check for internal pack
  if (requireInternalPack && discovered.internalPacks.length > 0) {
    const pack = discovered.internalPacks[discovered.internalPacks.length - 1];
    const headSha = (pack.content as { ledgerHeadSha256?: string })?.ledgerHeadSha256;
    if (headSha) {
      return {
        ok: true,
        rebuiltHead: { sha256: headSha, sequenceNumber: 0 },
        headSource: 'internal-pack',
        artifacts,
        missingArtifacts,
        warnings,
      };
    }
  }

  // Check for telemetry fallback
  if (useTelemetryFallback && discovered.telemetryLogs.length > 0) {
    for (const log of [...discovered.telemetryLogs].reverse()) {
      const events = (
        log.content as {
          events?: Array<{
            eventType?: string;
            ledgerHeadSha256?: string;
            sequenceNumber?: number;
          }>;
        }
      )?.events;
      if (events) {
        const headUpdate = events.find(e => e.eventType === 'ledger_head_updated');
        if (headUpdate?.ledgerHeadSha256) {
          return {
            ok: true,
            rebuiltHead: {
              sha256: headUpdate.ledgerHeadSha256,
              sequenceNumber: headUpdate.sequenceNumber ?? 0,
            },
            headSource: 'telemetry-log',
            artifacts,
            missingArtifacts,
            warnings,
          };
        }
      }
    }
  }

  // Attempt reconstruction from snapshots
  const snapshots = headType === 'ledger' ? discovered.ledgerSnapshots : discovered.rollups;

  if (snapshots.length === 0) {
    return {
      ok: false,
      errorCode: 'DR_INSUFFICIENT_ASSETS',
      errorMessage: `No ${headType} snapshots found`,
      artifacts,
      missingArtifacts,
      warnings,
    };
  }

  // Select candidate head
  const { candidates, ambiguous } = selectCandidateHead(snapshots, headType);

  if (ambiguous) {
    return {
      ok: false,
      errorCode: 'DR_HEAD_AMBIGUOUS',
      errorMessage: `Multiple candidate heads found at same sequence number`,
      artifacts,
      missingArtifacts,
      warnings,
    };
  }

  if (candidates.length === 0) {
    return {
      ok: false,
      errorCode: 'DR_HEAD_NOT_FOUND',
      errorMessage: 'No valid head candidates',
      artifacts,
      missingArtifacts,
      warnings,
    };
  }

  // Build chain for validation
  const chain: ChainLink[] = snapshots.map(snap => ({
    sha256: snap.sha256,
    previousHash: (snap.content as { previousHash?: string | null })?.previousHash ?? null,
    sequenceNumber: extractSequenceNumber(
      snap.content as Readonly<Record<string, unknown>> | undefined,
      snap.type
    ),
  }));

  const chainValidation = validateChain(chain);

  if (!chainValidation.valid && chainValidation.brokenLinks?.length) {
    return {
      ok: false,
      errorCode: 'DR_CHAIN_BROKEN',
      errorMessage: `Chain break detected: missing ${chainValidation.brokenLinks.join(', ')}`,
      artifacts,
      missingArtifacts,
      warnings,
      chainValidation,
    };
  }

  const selectedHead = candidates[0];

  return {
    ok: true,
    rebuiltHead: {
      sha256: selectedHead.sha256,
      sequenceNumber: selectedHead.sequenceNumber,
    },
    headSource: 'reconstructed',
    artifacts,
    missingArtifacts,
    warnings,
    chainValidation,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Partial Loss Handling
// ─────────────────────────────────────────────────────────────────────────────

export interface HandlePartialLossOptions {
  readonly artifacts: readonly DRArtifact[];
  readonly headType: 'ledger' | 'rollup';
  readonly expectVerificationReports?: boolean;
  readonly expectedReportPaths?: readonly string[];
  readonly includeDeletionIntents?: boolean;
  readonly includeRevocationContext?: boolean;
}

/**
 * Handle partial loss scenarios with graceful degradation.
 */
export function handlePartialLoss(options: HandlePartialLossOptions): PartialLossResult {
  const {
    artifacts,
    headType,
    expectVerificationReports,
    expectedReportPaths,
    includeDeletionIntents,
    includeRevocationContext,
  } = options;

  const discovered = discoverArtifacts(artifacts);
  const warnings: string[] = [];
  const missingArtifacts: string[] = [];

  // Build deletion intents if requested (always extract, even without snapshots)
  let deletionIntents: DeletionIntent[] | undefined;
  if (includeDeletionIntents && discovered.deletionIntents.length > 0) {
    deletionIntents = discovered.deletionIntents.map(d => ({
      caseId: (d.content as { caseId?: string })?.caseId ?? '',
      reason: (d.content as { reason?: string })?.reason ?? '',
      deletedAt: (d.content as { deletedAt?: string })?.deletedAt ?? '',
      authorizedBy: (d.content as { authorizedBy?: string })?.authorizedBy ?? '',
    }));
  }

  // Build revocation context if requested
  let revocationContext: RevocationContext | undefined;
  if (includeRevocationContext && discovered.revocationRecords.length > 0) {
    revocationContext = {
      revokedEpochs: discovered.revocationRecords.map(r => ({
        epochNumber: (r.content as { epochNumber?: number })?.epochNumber ?? 0,
        reason: (r.content as { reason?: string })?.reason ?? '',
        revokedAt: (r.content as { revokedAt?: string })?.revokedAt ?? '',
      })),
    };
  }

  // Get snapshots
  const snapshots = headType === 'ledger' ? discovered.ledgerSnapshots : discovered.rollups;

  if (snapshots.length === 0) {
    // Return with deletion intents even if no head can be recovered
    return {
      ok: false,
      errorCode: 'DR_INSUFFICIENT_ASSETS',
      errorMessage: `No ${headType} artifacts found`,
      deletionIntents,
      revocationContext,
    };
  }

  // Build chain
  const chain: ChainLink[] = snapshots.map(snap => ({
    sha256: snap.sha256,
    previousHash: (snap.content as { previousHash?: string | null })?.previousHash ?? null,
    sequenceNumber: extractSequenceNumber(
      snap.content as Readonly<Record<string, unknown>> | undefined,
      snap.type
    ),
  }));

  const chainValidation = validateChain(chain);

  // Report gaps as warnings but continue
  if (chainValidation.gaps?.length) {
    warnings.push(`Chain gap detected at sequence(s): ${chainValidation.gaps.join(', ')}`);
  }

  if (chainValidation.brokenLinks?.length) {
    warnings.push(`Missing linked artifacts: ${chainValidation.brokenLinks.join(', ')}`);
    for (const link of chainValidation.brokenLinks) {
      missingArtifacts.push(link);
    }
  }

  // Check for missing verification reports
  if (expectVerificationReports) {
    if (discovered.verificationReports.length === 0) {
      warnings.push('No verification reports found');
    }
    if (expectedReportPaths?.length) {
      const existingPaths = discovered.verificationReports.map(r => r.path);
      for (const expected of expectedReportPaths) {
        if (!existingPaths.includes(expected)) {
          missingArtifacts.push(expected);
        }
      }
    }
  }

  // Select best available head (highest sequence number)
  const sorted = [...snapshots].sort((a, b) => {
    const seqA = extractSequenceNumber(
      a.content as Readonly<Record<string, unknown>> | undefined,
      a.type
    );
    const seqB = extractSequenceNumber(
      b.content as Readonly<Record<string, unknown>> | undefined,
      b.type
    );
    return seqB - seqA;
  });

  const bestHead = sorted[0];
  const bestSeq = extractSequenceNumber(
    bestHead.content as Readonly<Record<string, unknown>> | undefined,
    bestHead.type
  );
  const recoveredHead: RebuiltHead = {
    sha256: bestHead.sha256,
    sequenceNumber: bestSeq,
    month: (bestHead.content as { month?: string })?.month,
  };

  return {
    ok: true,
    recoveredHead,
    partialRecovery: warnings.length > 0 || missingArtifacts.length > 0,
    missingArtifacts,
    warnings,
    deletionIntents,
    revocationContext,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DR Report
// ─────────────────────────────────────────────────────────────────────────────

export interface DRReport {
  readonly $schema: typeof DR_SCHEMA;
  readonly version: typeof DR_VERSION;
  readonly reportId: string;
  readonly reportSha256: string;
  readonly generatedAt: string;
  readonly correlationId: string;
  readonly repoIdentity: string;
  readonly outcome: 'SUCCESS' | 'FAILURE';
  readonly rebuiltHeadSha256?: string;
  readonly rebuiltHeadSequence?: number;
  readonly headSource?: string;
  readonly errorCode?: DRErrorCode;
  readonly errorMessage?: string;
  readonly missingArtifacts: readonly string[];
  readonly warnings: readonly string[];
  readonly chainValidation?: ChainValidationResult;
  readonly artifactCount: number;
}

export interface CreateDRReportOptions {
  readonly result: DRReconstitutionResult;
  readonly repoIdentity: string;
  readonly correlationId: string;
}

/**
 * Create a signed reconstitution report.
 */
export function createDRReport(options: CreateDRReportOptions): DRReport {
  const { result, repoIdentity, correlationId } = options;

  const reportId = randomUUID();
  const generatedAt = new Date().toISOString();

  const reportBody = {
    $schema: DR_SCHEMA as typeof DR_SCHEMA,
    version: DR_VERSION as typeof DR_VERSION,
    reportId,
    generatedAt,
    correlationId,
    repoIdentity,
    outcome: result.ok ? ('SUCCESS' as const) : ('FAILURE' as const),
    rebuiltHeadSha256: result.rebuiltHead?.sha256,
    rebuiltHeadSequence: result.rebuiltHead?.sequenceNumber,
    headSource: result.headSource,
    errorCode: result.errorCode,
    errorMessage: result.errorMessage,
    missingArtifacts: result.missingArtifacts,
    warnings: result.warnings,
    chainValidation: result.chainValidation,
    artifactCount: result.artifacts.length,
  };

  // Compute report hash
  const reportHash = createHash('sha256').update(JSON.stringify(reportBody)).digest('hex');

  return {
    ...reportBody,
    reportSha256: `sha256:${reportHash}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DR Telemetry Events
// ─────────────────────────────────────────────────────────────────────────────

interface DREventBase {
  readonly correlationId: string;
  readonly repoIdentity: string;
  readonly headType: 'ledger' | 'rollup';
  readonly timestampUtc?: string;
}

interface DRStartedEventOptions extends DREventBase {
  readonly artifactCount?: number;
}

/**
 * Create DR reconstitution started event.
 */
export function createDRStartedEvent(options: DRStartedEventOptions): TelemetryEnvelope {
  return createTelemetryEvent({
    eventType: 'dr_reconstitution_started' as unknown as Parameters<
      typeof createTelemetryEvent
    >[0]['eventType'],
    correlationId: options.correlationId,
    repoIdentity: options.repoIdentity,
    outcome: 'SUCCESS',
    timestampUtc: options.timestampUtc,
    details: {
      headType: options.headType,
      artifactCount: options.artifactCount,
    },
  });
}

interface DRHeadRebuiltEventOptions extends DREventBase {
  readonly rebuiltHeadSha256: string;
  readonly sequenceNumber: number;
  readonly headSource:
    | 'existing'
    | 'reconstructed'
    | 'public-pack'
    | 'internal-pack'
    | 'telemetry-log';
  readonly signerEpochId?: number;
  readonly warnings?: readonly string[];
}

/**
 * Create DR head rebuilt event.
 */
export function createDRHeadRebuiltEvent(options: DRHeadRebuiltEventOptions): TelemetryEnvelope {
  return createTelemetryEvent({
    eventType: 'dr_head_rebuilt' as unknown as Parameters<
      typeof createTelemetryEvent
    >[0]['eventType'],
    correlationId: options.correlationId,
    repoIdentity: options.repoIdentity,
    outcome: 'SUCCESS',
    timestampUtc: options.timestampUtc,
    ledgerHeadSha256: options.rebuiltHeadSha256,
    signerEpochId: options.signerEpochId,
    details: {
      headType: options.headType,
      sequenceNumber: options.sequenceNumber,
      headSource: options.headSource,
      warnings: options.warnings,
    },
  });
}

interface DRFailedEventOptions extends DREventBase {
  readonly errorCode: DRErrorCode;
  readonly errorMessage: string;
  readonly brokenLinks?: readonly string[];
  readonly missingArtifacts?: readonly string[];
}

/**
 * Create DR reconstitution failed event.
 */
export function createDRFailedEvent(options: DRFailedEventOptions): TelemetryEnvelope {
  return createTelemetryEvent({
    eventType: 'dr_reconstitution_failed' as unknown as Parameters<
      typeof createTelemetryEvent
    >[0]['eventType'],
    correlationId: options.correlationId,
    repoIdentity: options.repoIdentity,
    outcome: 'FAILURE',
    timestampUtc: options.timestampUtc,
    errorCodes: [options.errorCode],
    details: {
      headType: options.headType,
      errorMessage: options.errorMessage,
      brokenLinks: options.brokenLinks,
      missingArtifacts: options.missingArtifacts,
    },
  });
}

/**
 * Emit DR telemetry event to sink.
 */
export function emitDRTelemetry(event: TelemetryEnvelope, sink: TelemetrySink): void {
  emitTelemetry(event, sink);
}

/**
 * Phase 4N45c – Telemetry System
 * ==============================
 *
 * Canonical telemetry event envelope with:
 *   - Versioned schema (fail-closed on incompatible versions)
 *   - Cryptographic bindings to ledger/casefile heads
 *   - Correlation IDs for pipeline tracing
 *   - PII-safe event details
 *   - Deterministic canonicalization
 *
 * @module telemetry
 * @version 4N45.1
 */

import { createHash, randomUUID } from 'node:crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const TELEMETRY_SCHEMA = 'terrafusion.autonomy.telemetry.v1';
export const TELEMETRY_VERSION = '4N45.1';

// ─────────────────────────────────────────────────────────────────────────────
// Event Types (Explicit Enumeration - No Free-Form)
// ─────────────────────────────────────────────────────────────────────────────

export const TELEMETRY_EVENT_TYPES = [
  'casefile_generated',
  'casefile_signed',
  'casefile_verified',
  'ledger_published',
  'ledger_head_updated',
  'rollup_emitted',
  'distribution_pack_emitted',
  'redaction_applied',
  'retention_expired',
  'retention_deleted',
  'break_glass_invoked',
  'signer_epoch_created',
  'signer_rotated',
  'signer_revoked',
  // Phase 4N45d: DR event types
  'dr_reconstitution_started',
  'dr_head_rebuilt',
  'dr_reconstitution_failed',
] as const;

export type TelemetryEventType = (typeof TELEMETRY_EVENT_TYPES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Event Envelope
// ─────────────────────────────────────────────────────────────────────────────

export interface TelemetryMetrics {
  readonly sizeBytes?: number;
  readonly durationMs?: number;
  readonly chunkCount?: number;
  readonly redactionCount?: number;
}

export interface TelemetryEnvelope {
  // Schema
  readonly schemaVersion: typeof TELEMETRY_VERSION;
  readonly eventType: TelemetryEventType;
  readonly eventId: string;
  readonly eventSha256: string;
  readonly timestampUtc: string;

  // Correlation
  readonly correlationId: string;
  readonly parentEventId?: string;
  readonly repoIdentity: string;
  readonly releaseTag?: string;
  readonly caseId?: string;

  // Cryptographic Bindings
  readonly casefileSha256?: string;
  readonly ledgerHeadSha256?: string;
  readonly rollupHeadSha256?: string;

  // Signer Context
  readonly signerEpochId?: number;
  readonly signerKeyId?: string;
  readonly revocationState?: 'active' | 'retired' | 'revoked';

  // Outcome
  readonly outcome: 'SUCCESS' | 'FAILURE';
  readonly errorCodes?: readonly string[];

  // Metrics
  readonly metrics?: TelemetryMetrics;

  // Event-Specific Details (bounded keyset)
  readonly details?: Readonly<Record<string, unknown>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Required Fields by Event Type
// ─────────────────────────────────────────────────────────────────────────────

export const REQUIRED_FIELDS_BY_EVENT_TYPE: Record<TelemetryEventType, readonly string[]> = {
  casefile_generated: [],
  casefile_signed: ['casefileSha256', 'signerEpochId'],
  casefile_verified: ['casefileSha256'],
  ledger_published: [],
  ledger_head_updated: [],
  rollup_emitted: [],
  distribution_pack_emitted: ['metrics.sizeBytes'],
  redaction_applied: ['casefileSha256'],
  retention_expired: [],
  retention_deleted: [],
  break_glass_invoked: [],
  signer_epoch_created: ['signerEpochId'],
  signer_rotated: ['signerEpochId'],
  signer_revoked: ['signerEpochId', 'revocationState'],
  // DR event types (Phase 4N45d)
  dr_reconstitution_started: [],
  dr_head_rebuilt: ['ledgerHeadSha256'],
  dr_reconstitution_failed: ['errorCodes'],
};

// ─────────────────────────────────────────────────────────────────────────────
// PII Patterns (Must Never Appear in Events)
// ─────────────────────────────────────────────────────────────────────────────

export const PII_FIELD_PATTERNS: readonly RegExp[] = [
  /email/i,
  /phone/i,
  /ssn/i,
  /socialSecurity/i,
  /password/i,
  /secret/i,
  /token/i,
  /apiKey/i,
  /privateKey/i,
  /creditCard/i,
  /address/i,
  /rawContent/i,
  /extractedValue/i,
  /originalText/i,
];

// ─────────────────────────────────────────────────────────────────────────────
// Canonicalization & Hashing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonicalize an event for deterministic hashing.
 * Keys are sorted alphabetically, values are JSON-stringified.
 */
export function canonicalizeEvent(event: Partial<TelemetryEnvelope>): string {
  const sortedKeys = Object.keys(event).sort();
  const canonical: Record<string, unknown> = {};

  for (const key of sortedKeys) {
    const value = (event as Record<string, unknown>)[key];
    if (value !== undefined) {
      canonical[key] = value;
    }
  }

  return JSON.stringify(canonical);
}

/**
 * Compute SHA256 hash of event content.
 */
export function computeEventHash(event: Partial<TelemetryEnvelope>): string {
  const canonical = canonicalizeEvent(event);
  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Correlation ID Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new correlation ID.
 */
export function createCorrelationId(): string {
  return randomUUID();
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Creation
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateTelemetryEventOptions {
  readonly eventType: TelemetryEventType;
  readonly correlationId: string;
  readonly repoIdentity: string;
  readonly outcome: 'SUCCESS' | 'FAILURE';
  readonly timestampUtc?: string;
  readonly parentEventId?: string;
  readonly releaseTag?: string;
  readonly caseId?: string;
  readonly casefileSha256?: string;
  readonly ledgerHeadSha256?: string;
  readonly rollupHeadSha256?: string;
  readonly signerEpochId?: number;
  readonly signerKeyId?: string;
  readonly revocationState?: 'active' | 'retired' | 'revoked';
  readonly errorCodes?: readonly string[];
  readonly metrics?: TelemetryMetrics;
  readonly details?: Readonly<Record<string, unknown>>;
}

/**
 * Create a new telemetry event envelope.
 */
export function createTelemetryEvent(options: CreateTelemetryEventOptions): TelemetryEnvelope {
  const timestampUtc = options.timestampUtc ?? new Date().toISOString();
  const eventId = randomUUID();

  // Build event without hash first
  const eventBody: Omit<TelemetryEnvelope, 'eventSha256'> = {
    schemaVersion: TELEMETRY_VERSION,
    eventType: options.eventType,
    eventId,
    timestampUtc,
    correlationId: options.correlationId,
    repoIdentity: options.repoIdentity,
    outcome: options.outcome,
  };

  // Add optional fields
  if (options.parentEventId)
    (eventBody as Record<string, unknown>).parentEventId = options.parentEventId;
  if (options.releaseTag) (eventBody as Record<string, unknown>).releaseTag = options.releaseTag;
  if (options.caseId) (eventBody as Record<string, unknown>).caseId = options.caseId;
  if (options.casefileSha256)
    (eventBody as Record<string, unknown>).casefileSha256 = options.casefileSha256;
  if (options.ledgerHeadSha256)
    (eventBody as Record<string, unknown>).ledgerHeadSha256 = options.ledgerHeadSha256;
  if (options.rollupHeadSha256)
    (eventBody as Record<string, unknown>).rollupHeadSha256 = options.rollupHeadSha256;
  if (options.signerEpochId !== undefined)
    (eventBody as Record<string, unknown>).signerEpochId = options.signerEpochId;
  if (options.signerKeyId) (eventBody as Record<string, unknown>).signerKeyId = options.signerKeyId;
  if (options.revocationState)
    (eventBody as Record<string, unknown>).revocationState = options.revocationState;
  if (options.errorCodes) (eventBody as Record<string, unknown>).errorCodes = options.errorCodes;
  if (options.metrics) (eventBody as Record<string, unknown>).metrics = options.metrics;
  if (options.details) (eventBody as Record<string, unknown>).details = options.details;

  // Compute hash over event body
  const eventSha256 = computeEventHash(eventBody);

  return {
    ...eventBody,
    eventSha256,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Event Linking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Link a child event to a parent event.
 */
export function linkEvents(parent: TelemetryEnvelope, child: TelemetryEnvelope): TelemetryEnvelope {
  const linked = {
    ...child,
    parentEventId: parent.eventId,
    correlationId: parent.correlationId,
  };

  // Recompute hash with new parent link
  const eventSha256 = computeEventHash(linked);

  return {
    ...linked,
    eventSha256,
  };
}

/**
 * Get all events in a correlation chain, sorted by timestamp.
 */
export function getEventChain(
  events: readonly TelemetryEnvelope[],
  correlationId: string
): TelemetryEnvelope[] {
  return events
    .filter(e => e.correlationId === correlationId)
    .sort((a, b) => new Date(a.timestampUtc).getTime() - new Date(b.timestampUtc).getTime());
}

// ─────────────────────────────────────────────────────────────────────────────
// Field Validation
// ─────────────────────────────────────────────────────────────────────────────

export interface ValidationResult {
  readonly valid: boolean;
  readonly missingFields?: readonly string[];
}

/**
 * Validate that required fields are present for the event type.
 */
export function validateEventFields(event: TelemetryEnvelope): ValidationResult {
  const required = REQUIRED_FIELDS_BY_EVENT_TYPE[event.eventType];
  const missing: string[] = [];
  const eventRecord = event as unknown as Record<string, unknown>;

  for (const field of required) {
    if (field.includes('.')) {
      // Nested field like 'metrics.sizeBytes'
      const [parent, child] = field.split('.');
      const parentObj = eventRecord[parent] as Record<string, unknown> | undefined;
      if (!parentObj || parentObj[child] === undefined) {
        missing.push(field);
      }
    } else {
      if (eventRecord[field] === undefined) {
        missing.push(field);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missingFields: missing.length > 0 ? missing : undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PII Validation
// ─────────────────────────────────────────────────────────────────────────────

export interface PiiValidationResult {
  readonly safe: boolean;
  readonly violations: readonly string[];
}

/**
 * Validate that no PII fields are present in the event.
 */
export function validateNoPii(event: TelemetryEnvelope): PiiValidationResult {
  const violations: string[] = [];

  function checkObject(obj: unknown, path: string): void {
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const fullPath = path ? `${path}.${key}` : key;

        // Check if key matches PII pattern
        for (const pattern of PII_FIELD_PATTERNS) {
          if (pattern.test(key)) {
            violations.push(`PII field detected: ${fullPath}`);
            break;
          }
        }

        // Recurse into nested objects
        if (typeof value === 'object' && value !== null) {
          checkObject(value, fullPath);
        }
      }
    }
  }

  checkObject(event.details, 'details');

  return {
    safe: violations.length === 0,
    violations,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Redaction Event Helper
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRedactionEventOptions {
  readonly correlationId: string;
  readonly repoIdentity: string;
  readonly casefileSha256: string;
  readonly redactedContentHash: string;
  readonly reasonCode: string;
  readonly fieldPath: string;
  readonly proofDigest?: string;
}

/**
 * Create a redaction event that is guaranteed PII-safe.
 */
export function createRedactionEvent(options: CreateRedactionEventOptions): TelemetryEnvelope {
  return createTelemetryEvent({
    eventType: 'redaction_applied',
    correlationId: options.correlationId,
    repoIdentity: options.repoIdentity,
    outcome: 'SUCCESS',
    casefileSha256: options.casefileSha256,
    details: {
      redactedContentHash: options.redactedContentHash,
      reasonCode: options.reasonCode,
      fieldPath: options.fieldPath,
      proofDigest: options.proofDigest,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Cryptographic Bindings
// ─────────────────────────────────────────────────────────────────────────────

export interface LedgerHeadBinding {
  readonly ledgerHeadSha256: string;
  readonly rollupHeadSha256?: string;
  readonly releaseTag: string;
  readonly sequenceNumber: number;
}

/**
 * Bind an event to a ledger head.
 */
export function bindToLedgerHead(
  event: TelemetryEnvelope,
  binding: LedgerHeadBinding
): TelemetryEnvelope {
  const bound: TelemetryEnvelope = {
    ...event,
    ledgerHeadSha256: binding.ledgerHeadSha256,
    rollupHeadSha256: binding.rollupHeadSha256,
    releaseTag: binding.releaseTag,
    details: {
      ...event.details,
      ledgerSequenceNumber: binding.sequenceNumber,
    },
  };

  // Recompute hash
  const eventSha256 = computeEventHash(bound);

  return {
    ...bound,
    eventSha256,
  };
}

export interface SignerEpochBinding {
  readonly signerEpochId: number;
  readonly signerKeyId: string;
  readonly signerIdentity: string;
  readonly revocationState?: 'active' | 'retired' | 'revoked';
  readonly revokedAt?: string;
}

/**
 * Bind an event to a signer epoch.
 */
export function bindToSignerEpoch(
  event: TelemetryEnvelope,
  binding: SignerEpochBinding
): TelemetryEnvelope {
  const bound: TelemetryEnvelope = {
    ...event,
    signerEpochId: binding.signerEpochId,
    signerKeyId: binding.signerKeyId,
    revocationState: binding.revocationState,
    details: {
      ...event.details,
      signerIdentity: binding.signerIdentity,
      revokedAt: binding.revokedAt,
    },
  };

  // Recompute hash
  const eventSha256 = computeEventHash(bound);

  return {
    ...bound,
    eventSha256,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Binding Verification
// ─────────────────────────────────────────────────────────────────────────────

export interface VerifyBindingOptions {
  readonly expectedLedgerHead?: string;
  readonly expectedSignerEpoch?: number;
}

export interface BindingVerificationResult {
  readonly valid: boolean;
  readonly error?: string;
}

/**
 * Verify cryptographic bindings in an event.
 */
export function verifyBinding(
  event: TelemetryEnvelope,
  options: VerifyBindingOptions
): BindingVerificationResult {
  if (options.expectedLedgerHead !== undefined) {
    if (event.ledgerHeadSha256 !== options.expectedLedgerHead) {
      return {
        valid: false,
        error: `Binding mismatch: expected ledger head ${options.expectedLedgerHead}, got ${event.ledgerHeadSha256}`,
      };
    }
  }

  if (options.expectedSignerEpoch !== undefined) {
    if (event.signerEpochId !== options.expectedSignerEpoch) {
      return {
        valid: false,
        error: `Binding mismatch: expected signer epoch ${options.expectedSignerEpoch}, got ${event.signerEpochId}`,
      };
    }
  }

  return { valid: true };
}

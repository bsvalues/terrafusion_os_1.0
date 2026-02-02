/**
 * TerraFusion Security Incident Bundle Builder
 * =============================================
 *
 * Phase IIIh: Incident bundle generation for security events.
 *
 * Design Principles:
 * - PII-clean: All identifiers are hashed before bundling
 * - Fail-silent: Bundle generation never throws
 * - Cardinality-bounded: Only allowlisted dimensions included
 * - Limited size: Bundles contain last N events maximum
 */

import { createHash } from 'node:crypto';
import { ALLOWED_SLO_DIMENSIONS } from '../slo/catalog.js';

// ============================================================================
// Incident Event Types
// ============================================================================

/**
 * Security event types.
 */
export type SecurityEventType =
  | 'AUTH_DENIED'
  | 'AUTH_SUCCESS'
  | 'JWKS_REFRESH_FAIL'
  | 'JWKS_REFRESH_SUCCESS'
  | 'PROVIDER_ERROR'
  | 'CONFIG_ERROR';

/**
 * Raw security event (may contain PII).
 */
export interface RawSecurityEvent {
  /** Event type */
  readonly type: SecurityEventType;
  /** ISO timestamp */
  readonly timestamp: string;
  /** Provider type */
  readonly provider?: string;
  /** Denial code (if applicable) */
  readonly denyCode?: string;
  /** Stage where event occurred */
  readonly stage?: string;
  /** User ID (PII - will be hashed) */
  readonly userId?: string;
  /** Email (PII - will be hashed) */
  readonly email?: string;
  /** IP address (PII - will be hashed) */
  readonly ipAddress?: string;
  /** Session ID (PII - will be hashed) */
  readonly sessionId?: string;
  /** Error message (may contain PII) */
  readonly errorMessage?: string;
  /** Additional context (will be sanitized) */
  readonly context?: Record<string, unknown>;
}

/**
 * PII-clean security event for bundling.
 */
export interface CleanSecurityEvent {
  /** Event type */
  readonly type: SecurityEventType;
  /** ISO timestamp */
  readonly timestamp: string;
  /** Provider type (if present, from allowlist) */
  readonly provider?: string;
  /** Denial code (if present, from allowlist) */
  readonly denyCode?: string;
  /** Stage (if present, from allowlist) */
  readonly stage?: string;
  /** Hashed user ID (sha256:prefix) */
  readonly userIdHash?: string;
  /** Hashed email (sha256:prefix) */
  readonly emailHash?: string;
  /** Hashed IP address (sha256:prefix) */
  readonly ipAddressHash?: string;
  /** Hashed session ID (sha256:prefix) */
  readonly sessionIdHash?: string;
  /** Sanitized error message */
  readonly errorMessageSanitized?: string;
}

/**
 * Incident bundle.
 */
export interface IncidentBundle {
  /** Bundle ID */
  readonly bundleId: string;
  /** Generation timestamp */
  readonly generatedAt: string;
  /** Schema version */
  readonly schemaVersion: string;
  /** Time range covered */
  readonly timeRange: {
    readonly start: string;
    readonly end: string;
  };
  /** Events in bundle */
  readonly events: readonly CleanSecurityEvent[];
  /** Event counts by type */
  readonly summary: {
    readonly totalEvents: number;
    readonly byType: Record<SecurityEventType, number>;
  };
  /** Generation was truncated */
  readonly truncated: boolean;
  /** Maximum events allowed */
  readonly maxEvents: number;
}

// ============================================================================
// PII Hashing
// ============================================================================

const PII_HASH_PREFIX = 'sha256:';

/**
 * Hash a PII value using SHA-256.
 * Returns null if input is null/undefined.
 */
export function hashPii(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  try {
    const hash = createHash('sha256').update(value).digest('hex');
    return `${PII_HASH_PREFIX}${hash.substring(0, 16)}`;
  } catch {
    // Fail-silent
    return undefined;
  }
}

/**
 * Check if a value is a valid PII hash.
 */
export function isPiiHash(value: string | undefined): boolean {
  return value !== undefined && value.startsWith(PII_HASH_PREFIX);
}

// ============================================================================
// Error Message Sanitization
// ============================================================================

/**
 * Patterns that may indicate PII in error messages.
 */
const PII_PATTERNS: RegExp[] = [
  // Email patterns
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // IP addresses
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  // UUIDs (often session/user IDs)
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
  // Bearer tokens
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
  // JWT patterns
  /eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.+/=]*/g,
  // API keys (common patterns)
  /[a-zA-Z0-9]{32,}/g,
];

/**
 * Sanitize error message by removing potential PII.
 */
export function sanitizeErrorMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;

  try {
    let sanitized = message;
    for (const pattern of PII_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    // Truncate very long messages
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500) + '...[TRUNCATED]';
    }
    return sanitized;
  } catch {
    // Fail-silent
    return '[SANITIZATION_ERROR]';
  }
}

// ============================================================================
// Event Cleaning
// ============================================================================

/**
 * Clean a raw security event to remove PII.
 */
export function cleanSecurityEvent(raw: RawSecurityEvent): CleanSecurityEvent {
  try {
    return {
      type: raw.type,
      timestamp: raw.timestamp,
      // Only include allowlisted dimensions
      // Dimension 'provider' maps to 'provider'
      provider: ALLOWED_SLO_DIMENSIONS.includes('provider' as never) ? raw.provider : undefined,
      // Dimension 'code' (denyCode) is included since 'code' is allowlisted
      denyCode: ALLOWED_SLO_DIMENSIONS.includes('code' as never) ? raw.denyCode : undefined,
      // Dimension 'stage' maps to 'stage'
      stage: ALLOWED_SLO_DIMENSIONS.includes('stage' as never) ? raw.stage : undefined,
      // Hash PII fields
      userIdHash: hashPii(raw.userId),
      emailHash: hashPii(raw.email),
      ipAddressHash: hashPii(raw.ipAddress),
      sessionIdHash: hashPii(raw.sessionId),
      // Sanitize error message
      errorMessageSanitized: sanitizeErrorMessage(raw.errorMessage),
    };
  } catch {
    // Fail-silent: return minimal event
    return {
      type: raw.type,
      timestamp: raw.timestamp,
    };
  }
}

/**
 * Check if a cleaned event is PII-clean.
 */
export function isEventPiiClean(event: CleanSecurityEvent): boolean {
  // Should not have raw PII fields
  const asAny = event as unknown as Record<string, unknown>;
  const rawPiiFields = ['userId', 'email', 'ipAddress', 'sessionId'];

  for (const field of rawPiiFields) {
    if (asAny[field] !== undefined) {
      return false;
    }
  }

  // Hash fields should be proper hashes or undefined
  const hashFields = ['userIdHash', 'emailHash', 'ipAddressHash', 'sessionIdHash'];
  for (const field of hashFields) {
    const value = asAny[field];
    if (value !== undefined && !isPiiHash(value as string)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Bundle Generation
// ============================================================================

/**
 * Default maximum events in a bundle.
 */
export const DEFAULT_MAX_EVENTS = 1000;

/**
 * Event ring buffer for incident collection.
 */
export class EventRingBuffer {
  private readonly buffer: RawSecurityEvent[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = DEFAULT_MAX_EVENTS) {
    this.maxSize = maxSize;
  }

  /**
   * Add event to buffer. Fail-silent.
   */
  push(event: RawSecurityEvent): void {
    try {
      this.buffer.push(event);
      if (this.buffer.length > this.maxSize) {
        this.buffer.shift();
      }
    } catch {
      // Fail-silent
    }
  }

  /**
   * Get events in time range.
   */
  getEventsInRange(startTime: string, endTime: string): RawSecurityEvent[] {
    try {
      return this.buffer.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
    } catch {
      return [];
    }
  }

  /**
   * Get last N events.
   */
  getLastEvents(n: number): RawSecurityEvent[] {
    try {
      return this.buffer.slice(-Math.min(n, this.buffer.length));
    } catch {
      return [];
    }
  }

  /**
   * Get total event count.
   */
  get eventCount(): number {
    return this.buffer.length;
  }

  /**
   * Clear all events.
   */
  clear(): void {
    this.buffer.length = 0;
  }
}

/**
 * Generate incident bundle from events. Fail-silent.
 */
export function generateIncidentBundle(
  events: readonly RawSecurityEvent[],
  options: {
    maxEvents?: number;
  } = {}
): IncidentBundle {
  const maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
  const now = new Date().toISOString();

  try {
    // Limit events
    const truncated = events.length > maxEvents;
    const limitedEvents = events.slice(-maxEvents);

    // Clean all events
    const cleanedEvents = limitedEvents.map(cleanSecurityEvent);

    // Calculate summary
    const byType: Record<string, number> = {};
    for (const event of cleanedEvents) {
      byType[event.type] = (byType[event.type] ?? 0) + 1;
    }

    // Calculate time range
    let start = now;
    let end = now;
    if (cleanedEvents.length > 0) {
      const timestamps = cleanedEvents.map(e => e.timestamp).sort();
      start = timestamps[0];
      end = timestamps[timestamps.length - 1];
    }

    return {
      bundleId: `incident-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      generatedAt: now,
      schemaVersion: 'terrafusion.ops.incident.v1',
      timeRange: { start, end },
      events: cleanedEvents,
      summary: {
        totalEvents: cleanedEvents.length,
        byType: byType as Record<SecurityEventType, number>,
      },
      truncated,
      maxEvents,
    };
  } catch {
    // Fail-silent: return empty bundle
    return {
      bundleId: `incident-error-${Date.now()}`,
      generatedAt: now,
      schemaVersion: 'terrafusion.ops.incident.v1',
      timeRange: { start: now, end: now },
      events: [],
      summary: {
        totalEvents: 0,
        byType: {} as Record<SecurityEventType, number>,
      },
      truncated: false,
      maxEvents,
    };
  }
}

/**
 * Check if entire bundle is PII-clean.
 */
export function isBundlePiiClean(bundle: IncidentBundle): boolean {
  try {
    for (const event of bundle.events) {
      if (!isEventPiiClean(event)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Export bundle as JSON. Fail-silent.
 */
export function exportBundleJson(bundle: IncidentBundle): string {
  try {
    return JSON.stringify(bundle, null, 2);
  } catch {
    return '{"error": "serialization_failed"}';
  }
}

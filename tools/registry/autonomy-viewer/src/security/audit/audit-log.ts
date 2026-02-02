import { createHash, randomUUID } from 'node:crypto';

import {
    AUDIT_LOG_SCHEMA,
    AUDIT_LOG_VERSION,
} from '../../schemas/terrafusion.security.audit-log.v1.js';
import { deterministicStringify } from '../../utils/deterministic-json.js';
import { normalizePathsInObject } from '../../utils/path-normalize.js';
import type { RbacDecision } from '../rbac/rbac.js';
import type { AuditSink } from './audit-sinks.js';

export interface AuditDecisionSummary {
  readonly allowed: boolean;
  readonly reasonCodes: readonly string[];
}

export interface AuditPolicyRefs {
  readonly breakGlass: {
    readonly path: string;
    readonly version: string | null;
    readonly sha256: string | null;
  };
  readonly tpi: {
    readonly path: string;
    readonly version: string | null;
    readonly sha256: string | null;
  };
}

export interface AuditEvent {
  readonly schema: typeof AUDIT_LOG_SCHEMA;
  readonly version: typeof AUDIT_LOG_VERSION;
  readonly eventId: string;
  readonly eventType: 'rbac_decision';
  readonly timestamp: string;
  readonly actionId: string;
  readonly profile?: string;
  readonly tier?: string;
  readonly decision: AuditDecisionSummary;
  readonly policyRefs: AuditPolicyRefs;
  readonly correlationId?: string;
  readonly actorIdHash?: string;
}

export interface AuditLogEntry {
  readonly schema: typeof AUDIT_LOG_SCHEMA;
  readonly version: typeof AUDIT_LOG_VERSION;
  readonly index: number;
  readonly prevHash: string | null;
  readonly entryHash: string;
  readonly event: AuditEvent;
}

export interface AuditAppendResult {
  readonly entry: AuditLogEntry;
  readonly line: string;
}

export interface AuditLogger {
  readonly sink: AuditSink;
  readonly entries: AuditLogEntry[];
  append(event: AuditEvent): AuditAppendResult;
  verify(): AuditChainVerification;
}

export interface AuditChainVerification {
  readonly ok: boolean;
  readonly errors: string[];
}

export const PII_FIELD_PATTERNS = [
  /email/i,
  /phone/i,
  /ssn/i,
  /password/i,
  /secret/i,
  /token/i,
  /apiKey/i,
  /privateKey/i,
  /creditCard/i,
  /address/i,
] as const;

export function createAuditLogger(sink: AuditSink): AuditLogger {
  const entries: AuditLogEntry[] = [];

  return {
    sink,
    entries,
    append(event: AuditEvent): AuditAppendResult {
      const validation = validateNoPii(event);
      if (!validation.safe) {
        throw new Error(`Audit event rejected (PII): ${validation.violations.join(', ')}`);
      }

      const entry = createAuditEntry(event, entries.length, entries.at(-1)?.entryHash ?? null);
      const line = formatEntryAsJsonl(entry);

      sink.append(entry, line);
      entries.push(entry);

      return { entry, line };
    },
    verify(): AuditChainVerification {
      return verifyAuditChain(entries);
    },
  };
}

export function createAuditDecisionEvent(
  decision: RbacDecision,
  options?: {
    readonly correlationId?: string;
    readonly actorId?: string;
    readonly eventId?: string;
    readonly timestamp?: string;
  }
): AuditEvent {
  const timestamp = options?.timestamp ?? decision.evaluatedAt;
  const actorIdHash = options?.actorId ? hashValue(options.actorId) : undefined;

  return {
    schema: AUDIT_LOG_SCHEMA,
    version: AUDIT_LOG_VERSION,
    eventId: options?.eventId ?? randomUUID(),
    eventType: 'rbac_decision',
    timestamp,
    actionId: decision.actionId,
    profile: decision.profile,
    tier: decision.tier,
    decision: {
      allowed: decision.allowed,
      reasonCodes: decision.reasonCodes,
    },
    policyRefs: decision.policyRefs,
    correlationId: options?.correlationId,
    actorIdHash,
  };
}

export function createAuditEntry(
  event: AuditEvent,
  index: number,
  prevHash: string | null
): AuditLogEntry {
  const hashable = {
    schema: AUDIT_LOG_SCHEMA,
    version: AUDIT_LOG_VERSION,
    index,
    prevHash,
    event: canonicalizeEvent(event),
  };

  const entryHash = hashValue(deterministicStringify(hashable, 0));

  return {
    schema: AUDIT_LOG_SCHEMA,
    version: AUDIT_LOG_VERSION,
    index,
    prevHash,
    entryHash,
    event,
  };
}

export function verifyAuditChain(entries: readonly AuditLogEntry[]): AuditChainVerification {
  const errors: string[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPrev = i === 0 ? null : entries[i - 1].entryHash;

    if (entry.prevHash !== expectedPrev) {
      errors.push(`Entry ${i} prevHash mismatch`);
    }

    const recomputed = createAuditEntry(entry.event, entry.index, entry.prevHash).entryHash;
    if (recomputed !== entry.entryHash) {
      errors.push(`Entry ${i} hash mismatch`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function formatEntryAsJsonl(entry: AuditLogEntry): string {
  const normalized = normalizePathsInObject(entry);
  const json = deterministicStringify(normalized, 0);
  return json + '\n';
}

export function validateNoPii(event: AuditEvent): { safe: boolean; violations: string[] } {
  const violations: string[] = [];
  scanForPii(event, 'event', violations);
  return { safe: violations.length === 0, violations };
}

function canonicalizeEvent(event: AuditEvent): AuditEvent {
  return normalizePathsInObject(event);
}

function scanForPii(value: unknown, path: string, violations: string[]): void {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === 'string') {
    for (const pattern of PII_FIELD_PATTERNS) {
      if (pattern.test(value)) {
        violations.push(path);
        return;
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForPii(item, `${path}[${index}]`, violations));
    return;
  }

  if (typeof value === 'object') {
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      for (const pattern of PII_FIELD_PATTERNS) {
        if (pattern.test(key)) {
          violations.push(`${path}.${key}`);
          break;
        }
      }
      scanForPii(entry, `${path}.${key}`, violations);
    }
  }
}

function hashValue(value: string): string {
  const hash = createHash('sha256').update(value).digest('hex');
  return `sha256:${hash}`;
}

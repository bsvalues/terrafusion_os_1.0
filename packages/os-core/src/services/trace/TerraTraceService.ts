import { v4 as uuidv4 } from 'uuid';

// --- Types (Mirroring v3.1 Contracts) ---
export interface TraceEvent {
  id: string;
  timestamp: string;
  countyId: string;
  parcelId?: string;
  dossierId?: string;
  actor: { userId: string; role: string; pilotId?: string };
  event: {
    suite: 'forge' | 'atlas' | 'dais' | 'dossier' | 'gpt' | 'os';
    module: string;
    action: string;
    category: 'valuation' | 'workflow' | 'compliance' | 'system';
  };
  data: {
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
    metadata?: Record<string, any>;
  };
  compliance: {
    classification: 'PUBLIC' | 'CONFIDENTIAL' | 'RESTRICTED';
    retention: '7_years' | 'permanent' | 'audit_cycle';
  };
}

type RedactionRule = { regex: RegExp; replace: string };

export class TerraTraceService {
  private static readonly PII_PATTERNS: ReadonlyArray<RedactionRule> = [
    { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replace: '[REDACTED-SSN]' },
    { regex: /\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, replace: '[REDACTED-EMAIL]' },
    // Conservative CC pattern (Visa, MC, Amex, Discover)
    {
      regex: /\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13}|6(?:011|5\d{2})\d{12})\b/g,
      replace: '[REDACTED-CC]',
    },
  ];

  /**
   * SANITIZATION (Gate 6 Enforcement)
   * Strips PII from arbitrary payloads before they hit the log.
   *
   * Hardening:
   * - Handles circular refs (won't throw)
   * - Handles non-JSON values safely
   * - Preserves types as best as possible
   */
  private static sanitize<T>(payload: T): T {
    if (payload === null || payload === undefined) return payload;

    // Strings: redact directly
    if (typeof payload === 'string') {
      return this.applyRedactions(payload) as unknown as T;
    }

    // Primitives: return as-is
    if (typeof payload !== 'object') return payload;

    // Objects/arrays: deep-walk with circular protection
    const seen = new WeakSet<object>();

    const walk = (val: any): any => {
      if (val === null || val === undefined) return val;

      if (typeof val === 'string') return this.applyRedactions(val);
      if (typeof val !== 'object') return val;

      if (seen.has(val)) return '[REDACTED-CIRCULAR]';
      seen.add(val);

      if (Array.isArray(val)) return val.map(walk);

      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(val)) out[k] = walk(v);
      return out;
    };

    return walk(payload);
  }

  private static applyRedactions(input: string): string {
    let clean = input;
    for (const rule of this.PII_PATTERNS) clean = clean.replace(rule.regex, rule.replace);
    return clean;
  }

  /**
   * EMIT (Gate 3 Enforcement)
   * Writes to the ledger. In production, this pushes to an append-only DB (Postgres/QLDB).
   */
  static async emit(draft: Omit<TraceEvent, 'id' | 'timestamp'>): Promise<string> {
    const event: TraceEvent = {
      ...draft,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      data: {
        inputs: this.sanitize(draft.data?.inputs),
        outputs: this.sanitize(draft.data?.outputs),
        metadata: this.sanitize(draft.data?.metadata),
      },
    };

    // TODO: Connect to real append-only store
    // NOTE: Do not log full event payloads to console in prod — keep logs minimal.
    console.log(
      `[TerraTrace] 📝 Logged: ${event.event.suite}:${event.event.module}:${event.event.action} by ${event.actor.userId} (${event.countyId})`
    );

    return event.id;
  }

  /**
   * CORRELATE RESULT
   * Logs the OUTCOME of an action. Does NOT mutate the original event.
   * Creates a new event linked to the parent via metadata.correlationId.
   */
  static async emitResult(parentEventId: string, output: any, error?: string): Promise<string> {
    return this.emit({
      countyId: 'system', // Inherit from parent in real impl
      actor: { userId: 'system', role: 'system' },
      event: {
        suite: 'os',
        module: 'trace',
        action: error ? 'tool_failed' : 'tool_succeeded',
        category: 'system',
      },
      data: {
        outputs: output,
        metadata: { correlationId: parentEventId, error },
      },
      compliance: { classification: 'CONFIDENTIAL', retention: '7_years' },
    });
  }
}

// TerraFusion LocalOps read-only diagnostics (WO-LOCALOPS-005).
//
// A fixed allowlist of READ-ONLY diagnostics built on the seams already landed:
// the AI profile contract (WO-001), the provider abstraction (WO-002), the
// trace adapter (WO-003), and the local KB (WO-004). Every diagnostic only
// observes — it performs no mutation, no shell execution, no service restart,
// no database write, no migration, and no network I/O. Any request outside the
// allowlist (or that names a mutating/operational action) is REFUSED with a
// structured, redaction-safe reason.
//
// Scope guard (doctrine): no UI, no mutation, no shell, no DB writes/migrations,
// no service control. App/service-health, DB-connectivity, and log-summary
// diagnostics are intentionally NOT implemented here — there is no existing
// safe read-only seam to reuse, so they are deferred rather than guessed.

import { resolveAiProfile, redactedAiProfileSummary, type AiProfileConfig } from './aiProfile.js';
import { createLocalOpsProvider } from './localOpsProvider.js';
import { createLocalOpsKb } from './localOpsKb.js';
import type { LocalOpsTrace } from './localOpsTrace.js';
import { redactPayload, redactStringValue, type RedactValue } from './redact.js';

/** The fixed set of read-only diagnostics. Nothing outside this list runs. */
export const READONLY_DIAGNOSTICS = [
  'ai.profile',
  'config.summary',
  'provider.status',
  'kb.status',
] as const;

export type DiagnosticName = (typeof READONLY_DIAGNOSTICS)[number];

export type DiagnosticStatus = 'ok' | 'warn' | 'error';

export interface DiagnosticResult {
  name: string;
  /** Always true — LocalOps v1 diagnostics never mutate. */
  readonly: true;
  status: DiagnosticStatus;
  summary: string;
  /** Redaction-safe structured data. */
  data: Record<string, RedactValue>;
}

export type DiagnosticReasonCode = 'UNKNOWN_DIAGNOSTIC' | 'UNSAFE_DIAGNOSTIC';

export interface DiagnosticRefusal {
  ok: false;
  status: 'refused';
  reasonCode: DiagnosticReasonCode;
  name: string;
  message: string;
  safeAlternatives?: string[];
}

export type DiagnosticOutcome = DiagnosticResult | DiagnosticRefusal;

export function isDiagnosticRefusal(value: unknown): value is DiagnosticRefusal {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { ok?: unknown }).ok === false &&
    (value as { status?: unknown }).status === 'refused'
  );
}

export function isDiagnosticName(value: string): value is DiagnosticName {
  return (READONLY_DIAGNOSTICS as readonly string[]).includes(value);
}

/** Substrings that indicate a mutating/operational (non-read-only) request. */
const UNSAFE_TERMS = [
  'restart',
  'reboot',
  'start',
  'stop',
  'kill',
  'migrate',
  'migration',
  'write',
  'delete',
  'drop',
  'update',
  'mutate',
  'repair',
  'fix',
  'exec',
  'shell',
  'run',
  'apply',
  'deploy',
];

export interface CreateLocalOpsDiagnosticsOptions {
  repoRoot: string;
  config?: AiProfileConfig;
  env?: NodeJS.ProcessEnv;
  /** Optional trace emitter; when present, each run/refusal emits an event. */
  trace?: LocalOpsTrace;
}

export class LocalOpsDiagnostics {
  private readonly repoRoot: string;
  private readonly config: AiProfileConfig;
  private readonly trace?: LocalOpsTrace;

  constructor(options: CreateLocalOpsDiagnosticsOptions) {
    this.repoRoot = options.repoRoot;
    this.config = options.config ?? resolveAiProfile(options.env ?? process.env);
    this.trace = options.trace;
  }

  /** Names of the available read-only diagnostics. */
  list(): DiagnosticName[] {
    return [...READONLY_DIAGNOSTICS];
  }

  /**
   * Gated entry point. Refuses unknown or unsafe (mutating/operational) names
   * with a structured refusal; otherwise runs the read-only diagnostic.
   */
  request(name: string): DiagnosticOutcome {
    const trimmed = name.trim();
    if (isDiagnosticName(trimmed)) {
      return this.run(trimmed);
    }
    const lower = trimmed.toLowerCase();
    const unsafe = UNSAFE_TERMS.some(term => lower.includes(term));
    const refusal: DiagnosticRefusal = unsafe
      ? {
          ok: false,
          status: 'refused',
          reasonCode: 'UNSAFE_DIAGNOSTIC',
          name: redactStringValue(trimmed),
          message: `'${trimmed}' implies a mutating or operational action; LocalOps diagnostics are read-only and refuse it.`,
          safeAlternatives: [`Use a read-only diagnostic: ${READONLY_DIAGNOSTICS.join(', ')}`],
        }
      : {
          ok: false,
          status: 'refused',
          reasonCode: 'UNKNOWN_DIAGNOSTIC',
          name: redactStringValue(trimmed),
          message: `'${trimmed}' is not a known LocalOps diagnostic.`,
          safeAlternatives: [`Available: ${READONLY_DIAGNOSTICS.join(', ')}`],
        };
    // Redact the message defensively (name may echo user input).
    refusal.message = redactStringValue(refusal.message);
    this.trace?.emit('localops.policy.refused', `diagnostic refused: ${refusal.reasonCode}`, {
      reasonCode: refusal.reasonCode,
      name: refusal.name,
    });
    return refusal;
  }

  /** Run every read-only diagnostic. */
  runAll(): DiagnosticResult[] {
    return this.list().map(name => this.run(name));
  }

  private run(name: DiagnosticName): DiagnosticResult {
    this.trace?.diagnosticStarted({ name });
    const result = this.compute(name);
    this.trace?.diagnosticCompleted({ name, ok: result.status !== 'error', status: result.status });
    return result;
  }

  private finalize(
    name: DiagnosticName,
    status: DiagnosticStatus,
    summary: string,
    data: Record<string, RedactValue>
  ): DiagnosticResult {
    return {
      name,
      readonly: true,
      status,
      summary: redactStringValue(summary),
      data: redactPayload(data).value,
    };
  }

  private compute(name: DiagnosticName): DiagnosticResult {
    switch (name) {
      case 'ai.profile':
        return this.finalize('ai.profile', 'ok', `active AI profile: ${this.config.profile}`, {
          profile: this.config.profile,
          provider: this.config.provider,
          externalCalls: this.config.externalCalls,
          allowMutation: this.config.allowMutation,
          requireSources: this.config.requireSources,
          requireTrace: this.config.requireTrace,
        });

      case 'config.summary':
        return this.finalize(
          'config.summary',
          'ok',
          'redacted AI profile configuration',
          redactedAiProfileSummary(this.config)
        );

      case 'provider.status': {
        const status = createLocalOpsProvider({ config: this.config }).status();
        // Read-only health: a non-ready provider is a `warn`, not an `error`
        // (e.g. no local model running is an expected operator condition).
        return this.finalize(
          'provider.status',
          status.ok ? 'ok' : 'warn',
          `provider status: ${status.status}`,
          {
            ok: status.ok,
            kind: status.kind,
            status: status.status,
            ...(status.adapter ? { adapter: status.adapter } : {}),
            config: status.config,
            ...(status.problem
              ? { reasonCode: status.problem.reasonCode, problemStatus: status.problem.status }
              : {}),
          }
        );
      }

      case 'kb.status': {
        const kb = createLocalOpsKb({ repoRoot: this.repoRoot, config: this.config }).status();
        return this.finalize(
          'kb.status',
          kb.fileCount > 0 ? 'ok' : 'warn',
          `local KB: ${kb.fileCount} file(s) across ${kb.roots.length} root(s)`,
          {
            roots: kb.roots,
            rootsExcluded: kb.rootsExcluded,
            fileCount: kb.fileCount,
            requireSources: kb.requireSources,
          }
        );
      }
    }
  }
}

export function createLocalOpsDiagnostics(
  options: CreateLocalOpsDiagnosticsOptions
): LocalOpsDiagnostics {
  return new LocalOpsDiagnostics(options);
}

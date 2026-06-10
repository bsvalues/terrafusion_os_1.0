// TerraFusion LocalOps provider abstraction (WO-LOCALOPS-002).
//
// Builds on the WO-LOCALOPS-001 AI profile contract: given a resolved
// AiProfileConfig, constructs the one provider the profile permits — a LOCAL
// model adapter or a refusing provider. There is no code path here that
// constructs an external adapter when the profile forbids external calls, and
// no fallback of any kind: when the permitted provider cannot be built or a
// permitted call fails, the result is a structured non-success outcome — never
// a silent cloud fallback, and never an unavailable/failed state disguised as
// success.
//
// Outcomes are AX-compatible: every result carries `ok` + a `status` drawn
// from a fixed taxonomy so a future TerraPilot UI can render a Provider Status
// Card, a Refusal Card, an Active Profile Badge, or a System Halt state
// without re-deriving meaning. Refusals/failures are distinct, and `disabled`
// is distinct from `unavailable`.
//
// Scope guard (doctrine): no UI, no RAG, no diagnostics beyond provider
// status, no shell/tool execution, no TerraTrace implementation (events are
// WO-LOCALOPS-003; callers receive structured results they can trace later).

import {
  resolveAiProfile,
  redactedAiProfileSummary,
  type AiProfileConfig,
  type AiProfileName,
} from './aiProfile.js';
import type { ModelAdapter, ModelChatRequest, ModelCompletion } from './modelAdapter.js';
import { OllamaAdapter } from './ollamaAdapter.js';
import { redactStringValue, type RedactValue } from './redact.js';

/** Provider ids that run inside the county boundary (no external network). */
export const LOCAL_PROVIDER_IDS = ['ollama'] as const;

/** Provider ids that are known to require calls outside the boundary. */
export const EXTERNAL_PROVIDER_IDS = ['openai', 'claude', 'anthropic', 'remote'] as const;

/**
 * Fixed outcome taxonomy. The UI switches on `status`; the categories are
 * mutually exclusive and deliberately distinguish:
 *  - `success`       a permitted call produced a completion
 *  - `refused`       policy said no (e.g. external blocked)
 *  - `failed`        a permitted call errored at runtime
 *  - `disabled`      AI is turned off by the active profile
 *  - `unavailable`   the permitted provider could not be built/reached
 *  - `misconfigured` the config is invalid (unknown/absent provider)
 */
export type LocalOpsOutcomeStatus =
  | 'success'
  | 'refused'
  | 'failed'
  | 'disabled'
  | 'unavailable'
  | 'misconfigured';

export type LocalOpsRefusalCode =
  | 'AI_DISABLED'
  | 'EXTERNAL_PROVIDER_REFUSED'
  | 'EXTERNAL_NOT_IMPLEMENTED'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'UNKNOWN_PROVIDER_REFUSED'
  | 'NON_LOCAL_ADAPTER_REFUSED'
  | 'PROVIDER_UNAVAILABLE'
  | 'LOCAL_PROVIDER_FAILED';

/**
 * Structured non-success outcome. Every field is redaction-safe for
 * logs/UI/trace. `message` and `reasonCode` map to the AX "Refusal Card".
 */
export interface LocalOpsProblem {
  ok: false;
  status: Exclude<LocalOpsOutcomeStatus, 'success'>;
  reasonCode: LocalOpsRefusalCode;
  profile: AiProfileName;
  /** Configured provider id (may be ''). */
  provider: string;
  /** Human-readable, redaction-safe explanation. */
  message: string;
  /** Machine-readable policy/config constraint that was violated, when applicable. */
  violatedConstraint?: string;
  /** Obvious, safe next steps the operator may take. */
  safeAlternatives?: string[];
}

export interface LocalOpsSuccess {
  ok: true;
  status: 'success';
  completion: ModelCompletion;
}

/** Discriminated union returned by `complete()`. */
export type LocalOpsResult = LocalOpsSuccess | LocalOpsProblem;

export function isLocalOpsProblem(value: unknown): value is LocalOpsProblem {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { ok?: unknown }).ok === false &&
    typeof (value as { status?: unknown }).status === 'string'
  );
}

export function isLocalOpsSuccess(value: unknown): value is LocalOpsSuccess {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { ok?: unknown }).ok === true &&
    (value as { status?: unknown }).status === 'success'
  );
}

export type LocalOpsProviderKind = 'local' | 'disabled' | 'refusing';

/** Redacted, display-safe provider status. Never performs network I/O. */
export interface LocalOpsProviderStatus {
  /** True only for an active local provider that is ready to serve. */
  ok: boolean;
  kind: LocalOpsProviderKind;
  /** 'success' when ready; otherwise the problem's status. */
  status: LocalOpsOutcomeStatus;
  /** Redacted AI profile summary (profile/provider/model/baseUrl/flags). */
  config: Record<string, RedactValue>;
  /** Adapter name when a real adapter is active (e.g. 'ollama', 'fake'). */
  adapter?: string;
  /** Problem details when not ready. */
  problem?: Omit<LocalOpsProblem, 'ok'>;
}

export interface LocalOpsProvider {
  readonly kind: LocalOpsProviderKind;
  /** Config-derived status/health. Deterministic; no network calls. */
  status(): LocalOpsProviderStatus;
  /** Single-shot completion as a structured result (never silent fallback). */
  complete(request: ModelChatRequest, signal?: AbortSignal): Promise<LocalOpsResult>;
  /** Release adapter resources. Idempotent. */
  close(): Promise<void>;
}

export interface CreateLocalOpsProviderOptions {
  /** Pre-resolved profile config; defaults to resolveAiProfile(env). */
  config?: AiProfileConfig;
  /** Env used when `config` is not supplied. */
  env?: NodeJS.ProcessEnv;
  /**
   * Test/DI seam: supply the adapter instead of constructing one. The adapter
   * is still subject to the capability guard — under a profile that forbids
   * external calls, an adapter that does not declare `capabilities.local`
   * is refused (fail closed). This is what makes silent fallback impossible
   * even through injection.
   */
  adapter?: ModelAdapter;
}

// URL userinfo (user:pass@host) — adapter errors may echo a rejected baseUrl.
const URL_USERINFO_RE = /([a-z][a-z0-9+.-]*:\/\/)[^/\s@]+@/gi;

function safeText(text: string): string {
  return redactStringValue(text.replace(URL_USERINFO_RE, '$1[REDACTED:userinfo]@'));
}

interface ProblemDetails {
  violatedConstraint?: string;
  safeAlternatives?: string[];
}

function problem(
  config: AiProfileConfig,
  status: Exclude<LocalOpsOutcomeStatus, 'success'>,
  reasonCode: LocalOpsRefusalCode,
  message: string,
  details: ProblemDetails = {}
): LocalOpsProblem {
  return {
    ok: false,
    status,
    reasonCode,
    profile: config.profile,
    provider: config.provider,
    message: safeText(message),
    ...(details.violatedConstraint ? { violatedConstraint: details.violatedConstraint } : {}),
    ...(details.safeAlternatives ? { safeAlternatives: details.safeAlternatives } : {}),
  };
}

class RefusingLocalOpsProvider implements LocalOpsProvider {
  readonly kind: 'disabled' | 'refusing';

  constructor(
    private readonly config: AiProfileConfig,
    private readonly problemOutcome: LocalOpsProblem,
    kind: 'disabled' | 'refusing'
  ) {
    this.kind = kind;
  }

  status(): LocalOpsProviderStatus {
    const { ok: _ok, ...problemFields } = this.problemOutcome;
    return {
      ok: false,
      kind: this.kind,
      status: this.problemOutcome.status,
      config: redactedAiProfileSummary(this.config),
      problem: problemFields,
    };
  }

  async complete(): Promise<LocalOpsResult> {
    return this.problemOutcome;
  }

  async close(): Promise<void> {
    // Nothing to release.
  }
}

class LocalAdapterProvider implements LocalOpsProvider {
  readonly kind = 'local' as const;

  constructor(
    private readonly config: AiProfileConfig,
    private readonly adapter: ModelAdapter
  ) {}

  status(): LocalOpsProviderStatus {
    return {
      ok: true,
      kind: this.kind,
      status: 'success',
      config: redactedAiProfileSummary(this.config),
      adapter: this.adapter.name,
    };
  }

  async complete(request: ModelChatRequest, signal?: AbortSignal): Promise<LocalOpsResult> {
    try {
      const completion = await this.adapter.complete(request, signal);
      return { ok: true, status: 'success', completion };
    } catch (error) {
      // A local provider failing at call time is a `failed` outcome — NEVER a
      // fallback to anything else, and never reported as success.
      const message = error instanceof Error ? error.message : String(error);
      return problem(
        this.config,
        'failed',
        'LOCAL_PROVIDER_FAILED',
        `local provider '${this.adapter.name}' failed during completion: ${message}`,
        {
          safeAlternatives: [
            'Check the local model service health',
            'Run LocalOps provider status',
          ],
        }
      );
    }
  }

  close(): Promise<void> {
    return this.adapter.close();
  }
}

function refusing(
  config: AiProfileConfig,
  outcome: LocalOpsProblem,
  kind: 'disabled' | 'refusing' = 'refusing'
): LocalOpsProvider {
  return new RefusingLocalOpsProvider(config, outcome, kind);
}

/**
 * Construct the LocalOps provider for the active AI profile.
 *
 * Never throws for policy/config outcomes — every disallowed or unbuildable
 * configuration yields a refusing provider (fail closed) whose `complete()`
 * returns a structured non-success `LocalOpsResult`.
 */
export function createLocalOpsProvider(
  options: CreateLocalOpsProviderOptions = {}
): LocalOpsProvider {
  const config = options.config ?? resolveAiProfile(options.env ?? process.env);

  if (config.profile === 'disabled') {
    return refusing(
      config,
      problem(
        config,
        'disabled',
        'AI_DISABLED',
        'AI is disabled by the active profile. Set AI_PROFILE to enable a permitted mode.',
        {
          violatedConstraint: 'ai_disabled',
          safeAlternatives: [
            'Set AI_PROFILE=localops with AI_PROVIDER=ollama for county-boundary-safe local AI',
          ],
        }
      ),
      'disabled'
    );
  }

  // Injected adapter (tests / future wiring): still capability-guarded.
  if (options.adapter) {
    if (!config.externalCalls && !options.adapter.capabilities.local) {
      return refusing(
        config,
        problem(
          config,
          'refused',
          'NON_LOCAL_ADAPTER_REFUSED',
          `adapter '${options.adapter.name}' does not declare local capability; the ${config.profile} profile forbids external calls.`,
          {
            violatedConstraint: 'local_only',
            safeAlternatives: [
              'Provide a local adapter (capabilities.local=true)',
              'Use AI_PROFILE=hybrid-approved if external calls are policy-approved',
            ],
          }
        )
      );
    }
    return new LocalAdapterProvider(config, options.adapter);
  }

  const provider = config.provider.toLowerCase();

  if (provider === '') {
    return refusing(
      config,
      problem(
        config,
        'misconfigured',
        'PROVIDER_NOT_CONFIGURED',
        'AI_PROVIDER is not set. LocalOps fails closed instead of guessing a backend.',
        { safeAlternatives: ['Set AI_PROVIDER=ollama and AI_MODEL=<model>'] }
      )
    );
  }

  if ((EXTERNAL_PROVIDER_IDS as readonly string[]).includes(provider)) {
    if (!config.externalCalls) {
      return refusing(
        config,
        problem(
          config,
          'refused',
          'EXTERNAL_PROVIDER_REFUSED',
          `provider '${provider}' requires external calls, which the ${config.profile} profile forbids. There is no fallback.`,
          {
            violatedConstraint: 'no_external_calls',
            safeAlternatives: [
              'Use AI_PROFILE=hybrid-approved with a documented county approval record',
              'Use a local provider (AI_PROVIDER=ollama) on a loopback AI_BASE_URL',
            ],
          }
        )
      );
    }
    return refusing(
      config,
      problem(
        config,
        'unavailable',
        'EXTERNAL_NOT_IMPLEMENTED',
        `provider '${provider}' is external; LocalOps provider v1 constructs local providers only. External adapter wiring is a later, separately-approved work order.`,
        {
          safeAlternatives: ['Use a local provider (AI_PROVIDER=ollama) on a loopback AI_BASE_URL'],
        }
      )
    );
  }

  if (!(LOCAL_PROVIDER_IDS as readonly string[]).includes(provider)) {
    return refusing(
      config,
      problem(
        config,
        'misconfigured',
        'UNKNOWN_PROVIDER_REFUSED',
        `provider '${provider}' is not a known LocalOps provider. LocalOps fails closed.`,
        {
          safeAlternatives: [`Use a known local provider: ${LOCAL_PROVIDER_IDS.join(', ')}`],
        }
      )
    );
  }

  // provider === 'ollama'
  if (config.model === '') {
    return refusing(
      config,
      problem(
        config,
        'unavailable',
        'PROVIDER_UNAVAILABLE',
        'AI_MODEL is not set; the local provider needs a model name.',
        { safeAlternatives: ['Set AI_MODEL=<model>'] }
      )
    );
  }
  try {
    const adapter = new OllamaAdapter({
      model: config.model,
      ...(config.baseUrl !== '' ? { baseUrl: config.baseUrl } : {}),
    });
    return new LocalAdapterProvider(config, adapter);
  } catch (error) {
    // e.g. non-loopback AI_BASE_URL — the adapter's own boundary guard.
    const message = error instanceof Error ? error.message : String(error);
    return refusing(
      config,
      problem(
        config,
        'unavailable',
        'PROVIDER_UNAVAILABLE',
        `local provider rejected: ${message}`,
        {
          violatedConstraint: 'loopback_only',
          safeAlternatives: [
            'Use a loopback AI_BASE_URL (http://127.0.0.1:PORT or http://localhost:PORT)',
          ],
        }
      )
    );
  }
}

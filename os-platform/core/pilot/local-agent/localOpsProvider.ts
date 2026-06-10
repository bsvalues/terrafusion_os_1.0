// TerraFusion LocalOps provider abstraction (WO-LOCALOPS-002).
//
// Builds on the WO-LOCALOPS-001 AI profile contract: given a resolved
// AiProfileConfig, constructs the one provider the profile permits — a LOCAL
// model adapter or the disabled/refusing provider. There is no code path here
// that constructs an external adapter when the profile forbids external
// calls, and no fallback of any kind: when the permitted provider cannot be
// built, the factory fails CLOSED into a refusing provider with a structured,
// redaction-safe reason.
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

export type LocalOpsRefusalCode =
  | 'AI_DISABLED'
  | 'EXTERNAL_PROVIDER_REFUSED'
  | 'EXTERNAL_NOT_IMPLEMENTED'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'UNKNOWN_PROVIDER_REFUSED'
  | 'NON_LOCAL_ADAPTER_REFUSED'
  | 'PROVIDER_UNAVAILABLE';

/** Structured refusal. `reason` is always redaction-safe for logs/UI/trace. */
export interface LocalOpsRefusal {
  refused: true;
  code: LocalOpsRefusalCode;
  reason: string;
  profile: AiProfileName;
}

export function isLocalOpsRefusal(value: unknown): value is LocalOpsRefusal {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { refused?: unknown }).refused === true &&
    typeof (value as { code?: unknown }).code === 'string'
  );
}

export type LocalOpsProviderKind = 'local' | 'disabled' | 'refusing';

/** Redacted, display-safe provider status. Never performs network I/O. */
export interface LocalOpsProviderStatus {
  ok: boolean;
  kind: LocalOpsProviderKind;
  /** Redacted AI profile summary (profile/provider/model/baseUrl/flags). */
  config: Record<string, RedactValue>;
  /** Adapter name when a real adapter is active (e.g. 'ollama', 'fake'). */
  adapter?: string;
  /** Refusal details when kind != 'local'. */
  refusal?: Pick<LocalOpsRefusal, 'code' | 'reason'>;
}

export interface LocalOpsProvider {
  readonly kind: LocalOpsProviderKind;
  /** Config-derived status/health. Deterministic; no network calls. */
  status(): LocalOpsProviderStatus;
  /** Single-shot completion, or a structured refusal (never silent fallback). */
  complete(
    request: ModelChatRequest,
    signal?: AbortSignal
  ): Promise<ModelCompletion | LocalOpsRefusal>;
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

function safeReason(text: string): string {
  return redactStringValue(text.replace(URL_USERINFO_RE, '$1[REDACTED:userinfo]@'));
}

class RefusingLocalOpsProvider implements LocalOpsProvider {
  readonly kind: 'disabled' | 'refusing';

  constructor(
    private readonly config: AiProfileConfig,
    private readonly refusal: LocalOpsRefusal,
    kind: 'disabled' | 'refusing'
  ) {
    this.kind = kind;
  }

  status(): LocalOpsProviderStatus {
    return {
      ok: false,
      kind: this.kind,
      config: redactedAiProfileSummary(this.config),
      refusal: { code: this.refusal.code, reason: this.refusal.reason },
    };
  }

  async complete(): Promise<LocalOpsRefusal> {
    return this.refusal;
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
      config: redactedAiProfileSummary(this.config),
      adapter: this.adapter.name,
    };
  }

  complete(
    request: ModelChatRequest,
    signal?: AbortSignal
  ): Promise<ModelCompletion | LocalOpsRefusal> {
    return this.adapter.complete(request, signal);
  }

  close(): Promise<void> {
    return this.adapter.close();
  }
}

function refusal(
  config: AiProfileConfig,
  code: LocalOpsRefusalCode,
  reason: string
): LocalOpsRefusal {
  return { refused: true, code, reason: safeReason(reason), profile: config.profile };
}

function refusing(
  config: AiProfileConfig,
  code: LocalOpsRefusalCode,
  reason: string,
  kind: 'disabled' | 'refusing' = 'refusing'
): LocalOpsProvider {
  return new RefusingLocalOpsProvider(config, refusal(config, code, reason), kind);
}

/**
 * Construct the LocalOps provider for the active AI profile.
 *
 * Never throws for policy/config outcomes — every disallowed or unbuildable
 * configuration yields a refusing provider (fail closed) whose `complete()`
 * returns a structured `LocalOpsRefusal`.
 */
export function createLocalOpsProvider(
  options: CreateLocalOpsProviderOptions = {}
): LocalOpsProvider {
  const config = options.config ?? resolveAiProfile(options.env ?? process.env);

  if (config.profile === 'disabled') {
    return refusing(
      config,
      'AI_DISABLED',
      'AI is disabled by the active profile. Set AI_PROFILE to enable a permitted mode.',
      'disabled'
    );
  }

  // Injected adapter (tests / future wiring): still capability-guarded.
  if (options.adapter) {
    if (!config.externalCalls && !options.adapter.capabilities.local) {
      return refusing(
        config,
        'NON_LOCAL_ADAPTER_REFUSED',
        `adapter '${options.adapter.name}' does not declare local capability; the ${config.profile} profile forbids external calls.`
      );
    }
    return new LocalAdapterProvider(config, options.adapter);
  }

  const provider = config.provider.toLowerCase();

  if (provider === '') {
    return refusing(
      config,
      'PROVIDER_NOT_CONFIGURED',
      'AI_PROVIDER is not set. LocalOps fails closed instead of guessing a backend.'
    );
  }

  if ((EXTERNAL_PROVIDER_IDS as readonly string[]).includes(provider)) {
    if (!config.externalCalls) {
      return refusing(
        config,
        'EXTERNAL_PROVIDER_REFUSED',
        `provider '${provider}' requires external calls, which the ${config.profile} profile forbids. There is no fallback.`
      );
    }
    return refusing(
      config,
      'EXTERNAL_NOT_IMPLEMENTED',
      `provider '${provider}' is external; LocalOps provider v1 constructs local providers only. External adapter wiring is a later, separately-approved work order.`
    );
  }

  if (!(LOCAL_PROVIDER_IDS as readonly string[]).includes(provider)) {
    return refusing(
      config,
      'UNKNOWN_PROVIDER_REFUSED',
      `provider '${provider}' is not a known LocalOps provider. Known local providers: ${LOCAL_PROVIDER_IDS.join(', ')}. LocalOps fails closed.`
    );
  }

  // provider === 'ollama'
  if (config.model === '') {
    return refusing(
      config,
      'PROVIDER_UNAVAILABLE',
      'AI_MODEL is not set; the local provider needs a model name.'
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
    return refusing(config, 'PROVIDER_UNAVAILABLE', `local provider rejected: ${message}`);
  }
}

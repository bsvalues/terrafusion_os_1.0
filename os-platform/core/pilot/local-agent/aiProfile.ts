// TerraFusion LocalOps AI profile configuration contract (WO-LOCALOPS-001).
//
// Pure config resolution + validation. No provider calls, no I/O, no UI.
// Doctrine (docs/localops/LOCALOPS_DOCTRINE.md): localops/disabled profiles may
// be tightened by env overrides but never loosened — there is no way to express
// "localops with silent cloud fallback" in this contract.

import { redactPayload, type RedactValue } from './redact.js';

export const AI_PROFILE_ENV = 'AI_PROFILE';

export const AI_PROFILES = ['cloud-dev', 'hybrid-approved', 'localops', 'disabled'] as const;
export type AiProfileName = (typeof AI_PROFILES)[number];

/** Default profile when AI_PROFILE is unset: AI is opt-in, never opt-out. */
export const DEFAULT_AI_PROFILE: AiProfileName = 'disabled';

export class AiProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiProfileError';
  }
}

export interface AiProfileConfig {
  profile: AiProfileName;
  /** AI_PROVIDER — provider id (e.g. 'ollama'). Empty string = unset. */
  provider: string;
  /** AI_BASE_URL — provider endpoint. Empty = unset. Never defaulted to a hardcoded port. */
  baseUrl: string;
  /** AI_MODEL — model name. Empty = unset. */
  model: string;
  /** AI_EXTERNAL_CALLS — may the runtime call endpoints outside the county boundary. */
  externalCalls: boolean;
  /** AI_ALLOW_WEB — may the assistant fetch web content. */
  allowWeb: boolean;
  /** AI_ALLOW_SHELL — may the assistant execute shell commands (outside the controlled registry). */
  allowShell: boolean;
  /** AI_ALLOW_MUTATION — may the assistant mutate state (always behind human approval). */
  allowMutation: boolean;
  /** AI_REQUIRE_TRACE — must every action emit a TerraTrace-compatible event. */
  requireTrace: boolean;
  /** AI_REQUIRE_SOURCES — must operational answers cite a grounding source. */
  requireSources: boolean;
  /** AI_LOCAL_KB_PATH — local knowledge base root. */
  localKbPath: string;
  /** AI_RUNBOOK_PATH — operator runbook location. */
  runbookPath: string;
}

interface ProfilePermissionDefaults {
  externalCalls: boolean;
  allowWeb: boolean;
  allowShell: boolean;
  allowMutation: boolean;
  requireTrace: boolean;
  requireSources: boolean;
}

const PROFILE_DEFAULTS: Record<AiProfileName, ProfilePermissionDefaults> = {
  // Developer convenience profile for non-county environments.
  'cloud-dev': {
    externalCalls: true,
    allowWeb: true,
    allowShell: false,
    allowMutation: false,
    requireTrace: true,
    requireSources: false,
  },
  // External calls explicitly approved (e.g. documented county approval record).
  'hybrid-approved': {
    externalCalls: true,
    allowWeb: false,
    allowShell: false,
    allowMutation: false,
    requireTrace: true,
    requireSources: true,
  },
  // County-boundary-safe operator posture. Tighten-only.
  localops: {
    externalCalls: false,
    allowWeb: false,
    allowShell: false,
    allowMutation: false,
    requireTrace: true,
    requireSources: true,
  },
  // All AI action disabled. Tighten-only.
  disabled: {
    externalCalls: false,
    allowWeb: false,
    allowShell: false,
    allowMutation: false,
    requireTrace: true,
    requireSources: true,
  },
};

/** Profiles where env overrides may tighten permissions but never loosen them. */
const TIGHTEN_ONLY_PROFILES: ReadonlySet<AiProfileName> = new Set(['localops', 'disabled']);

const PERMISSION_ENV_KEYS = {
  externalCalls: 'AI_EXTERNAL_CALLS',
  allowWeb: 'AI_ALLOW_WEB',
  allowShell: 'AI_ALLOW_SHELL',
  allowMutation: 'AI_ALLOW_MUTATION',
  requireTrace: 'AI_REQUIRE_TRACE',
  requireSources: 'AI_REQUIRE_SOURCES',
} as const;

/** Flags where `true` grants capability (loosening under tighten-only profiles). */
const GRANT_FLAGS: ReadonlySet<keyof ProfilePermissionDefaults> = new Set([
  'externalCalls',
  'allowWeb',
  'allowShell',
  'allowMutation',
]);

export const DEFAULT_LOCAL_KB_PATH = 'docs/localops';
export const DEFAULT_RUNBOOK_PATH = 'docs/localops/BENTON_SERVER_RUNBOOK.md';

export function isAiProfileName(value: string): value is AiProfileName {
  return (AI_PROFILES as readonly string[]).includes(value);
}

function parseBool(envKey: string, raw: string): boolean {
  const normalized = raw.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true') return true;
  if (normalized === '0' || normalized === 'false') return false;
  throw new AiProfileError(
    `${envKey} must be one of 1/0/true/false, got ${JSON.stringify(raw)}`,
  );
}

function resolveProfileName(env: NodeJS.ProcessEnv): AiProfileName {
  const raw = env[AI_PROFILE_ENV]?.trim() ?? '';
  if (raw === '') return DEFAULT_AI_PROFILE;
  const normalized = raw.toLowerCase();
  if (!isAiProfileName(normalized)) {
    throw new AiProfileError(
      `${AI_PROFILE_ENV} must be one of ${AI_PROFILES.join(', ')}; got ${JSON.stringify(raw)}`,
    );
  }
  return normalized;
}

/**
 * Resolve the AI profile config from the environment.
 *
 * - Unset AI_PROFILE resolves to `disabled` (AI is opt-in).
 * - Unknown AI_PROFILE values are rejected, not silently coerced.
 * - Under `localops`/`disabled`, env overrides may only tighten: any attempt to
 *   grant a capability (AI_EXTERNAL_CALLS=true etc.) or drop a safety
 *   requirement (AI_REQUIRE_TRACE=false etc.) throws AiProfileError.
 */
export function resolveAiProfile(env: NodeJS.ProcessEnv = process.env): AiProfileConfig {
  const profile = resolveProfileName(env);
  const defaults = PROFILE_DEFAULTS[profile];
  const tightenOnly = TIGHTEN_ONLY_PROFILES.has(profile);

  const permissions: ProfilePermissionDefaults = { ...defaults };
  for (const field of Object.keys(PERMISSION_ENV_KEYS) as Array<keyof ProfilePermissionDefaults>) {
    const envKey = PERMISSION_ENV_KEYS[field];
    const raw = env[envKey];
    if (raw === undefined || raw.trim() === '') continue;
    const value = parseBool(envKey, raw);
    if (tightenOnly) {
      const isGrant = GRANT_FLAGS.has(field);
      const loosens = isGrant ? value === true : value === false;
      if (loosens) {
        throw new AiProfileError(
          `${envKey}=${raw.trim()} loosens the ${profile} profile. ` +
            `The ${profile} profile is tighten-only; use hybrid-approved (with a documented approval record) instead.`,
        );
      }
    }
    permissions[field] = value;
  }

  return {
    profile,
    provider: env.AI_PROVIDER?.trim() ?? '',
    baseUrl: env.AI_BASE_URL?.trim() ?? '',
    model: env.AI_MODEL?.trim() ?? '',
    ...permissions,
    localKbPath: env.AI_LOCAL_KB_PATH?.trim() || DEFAULT_LOCAL_KB_PATH,
    runbookPath: env.AI_RUNBOOK_PATH?.trim() || DEFAULT_RUNBOOK_PATH,
  };
}

/** Strip URL userinfo (user:pass@) before display; non-URLs pass through. */
function stripUrlCredentials(raw: string): string {
  if (raw === '') return raw;
  try {
    const url = new URL(raw);
    if (url.username || url.password) {
      url.username = '';
      url.password = '';
      return url.toString();
    }
    return raw;
  } catch {
    return raw;
  }
}

/**
 * Redacted, display-safe summary of the resolved profile. Routes every string
 * through the local-agent redactor (secrets, tokens, emails, user paths) and
 * strips URL credentials, so the summary is safe for logs/UI/trace.
 */
export function redactedAiProfileSummary(
  config: AiProfileConfig,
): Record<string, RedactValue> {
  const { value } = redactPayload({
    profile: config.profile,
    provider: config.provider,
    baseUrl: stripUrlCredentials(config.baseUrl),
    model: config.model,
    externalCalls: config.externalCalls,
    allowWeb: config.allowWeb,
    allowShell: config.allowShell,
    allowMutation: config.allowMutation,
    requireTrace: config.requireTrace,
    requireSources: config.requireSources,
    localKbPath: config.localKbPath,
    runbookPath: config.runbookPath,
  });
  return value;
}

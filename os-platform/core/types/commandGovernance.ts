/**
 * Phase 48A: TerraCanon/TerraPilot Command Governance Types
 *
 * Additive, backwards-compatible governance metadata and preflight policy contract.
 */

export type CommandIntent =
  | 'inspect'
  | 'explain'
  | 'plan'
  | 'simulate'
  | 'mutate'
  | 'execute';

export type MutationClass = 'none' | 'transient' | 'durable';

export type VisibilityClass = 'public' | 'restricted' | 'secret';

export type CommandGovernanceMeta = Readonly<{
  intent: CommandIntent;
  mutation: MutationClass;
  visibility: VisibilityClass;
}>;

export type PolicyDecision =
  | Readonly<{ allow: true }>
  | Readonly<{ allow: false; reason: string; visibility?: VisibilityClass }>;

export type PreflightRequest = Readonly<{
  toolId: string;
  correlationId: string;
  governance?: CommandGovernanceMeta;
  requestedMutation?: MutationClass;
}>;

export type PreflightPolicy = (req: PreflightRequest) => PolicyDecision;

export function isCommandGovernanceMeta(v: unknown): v is CommandGovernanceMeta {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length !== 3) return false;
  if (!('intent' in o) || !('mutation' in o) || !('visibility' in o)) return false;

  const intent = o.intent;
  const mutation = o.mutation;
  const visibility = o.visibility;

  const intentOk =
    intent === 'inspect' ||
    intent === 'explain' ||
    intent === 'plan' ||
    intent === 'simulate' ||
    intent === 'mutate' ||
    intent === 'execute';

  const mutationOk = mutation === 'none' || mutation === 'transient' || mutation === 'durable';
  const visibilityOk =
    visibility === 'public' || visibility === 'restricted' || visibility === 'secret';

  return intentOk && mutationOk && visibilityOk;
}

export function normalizeDecision(d: PolicyDecision): PolicyDecision {
  if (d.allow) return { allow: true };

  const reason = typeof d.reason === 'string' && d.reason.trim().length > 0
    ? d.reason.trim()
    : 'Policy denied';

  return {
    allow: false,
    reason,
    visibility: d.visibility ?? 'restricted',
  };
}

import type { OsActor } from '@/auth/useAuthContext';

export type GptActorError =
  | { kind: 'unauthenticated' }
  | { kind: 'missing_county'; userId: string }
  | { kind: 'api_error'; status: number; message: string }
  | { kind: 'timeout' };

export interface GptActorContext {
  actor: OsActor;
  countyIdNumeric: number;
}

export type GptActorResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: GptActorError };

/**
 * Pure function — no hooks, no side effects.
 * Resolves OsActor into a typed GptActorContext, handling the
 * string→number countyId coercion at one typed boundary.
 */
export function resolveGptActor(actor: OsActor | null): GptActorResult<GptActorContext> {
  if (!actor) return { ok: false, error: { kind: 'unauthenticated' } };
  if (!/^\d+$/.test(actor.countyId)) {
    return { ok: false, error: { kind: 'missing_county', userId: actor.userId } };
  }
  const countyIdNumeric = parseInt(actor.countyId, 10);
  return { ok: true, data: { actor, countyIdNumeric } };
}

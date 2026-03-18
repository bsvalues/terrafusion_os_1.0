/**
 * useAuthContext — extends the base auth context with county/user/roles claims.
 *
 * Wave 1: Provides the canonical AuthContextValue shape for all feature surfaces.
 * The shell chrome (Window.tsx, Taskbar, etc.) does NOT use this — only feature surfaces.
 */

import { useMemo } from 'react';
import { useAuth } from './useAuth';

export type AuthContextValue = {
  isAuthenticated: boolean;
  userId: string | null;
  countyId: string | null;
  roles: readonly string[];
  token: string | null;
};

// ---------------------------------------------------------------------------
// Wave 1: Shared decode + actor identity
// ---------------------------------------------------------------------------

export interface DecodedAuthClaims {
  userId: string | null;
  countyId: string | null;
  roles: readonly string[];
}

/**
 * Pure function — no hooks, no side effects.
 * Single claim-normalization source shared by useAuthContext hook + AuthProvider.
 */
export function decodeAuthClaims(token: string | null): DecodedAuthClaims {
  if (!token) return { userId: null, countyId: null, roles: [] };
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { userId: null, countyId: null, roles: [] };
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    ) as Record<string, unknown>;

    const str = (...keys: string[]): string | null => {
      for (const k of keys) {
        const v = payload[k];
        if (typeof v === 'string' && v.length > 0) return v;
      }
      return null;
    };

    const raw = payload['roles'] ?? payload['role'] ?? [];
    const roles: readonly string[] = Array.isArray(raw)
      ? raw.filter((r): r is string => typeof r === 'string')
      : typeof raw === 'string' ? [raw] : [];

    return {
      userId: str('userId', 'sub', 'user_id', 'nameid'),
      countyId: str('countyId', 'county_id', 'countyCode'),
      roles,
    };
  } catch {
    return { userId: null, countyId: null, roles: [] };
  }
}

export interface OsActor {
  userId: string;         // non-nullable — authenticated + non-empty
  countyId: string;       // non-nullable — county-scoped
  roles: readonly string[];
}

/**
 * Returns OsActor when isAuthenticated AND userId AND countyId are all present.
 * Returns null for any unauthenticated or incomplete-identity state.
 * NEVER returns an object with nullable fields.
 */
export function toOsActor(
  auth: Pick<AuthContextValue, 'isAuthenticated' | 'userId' | 'countyId' | 'roles'>
): OsActor | null {
  if (!auth.isAuthenticated || !auth.userId || !auth.countyId) return null;
  return { userId: auth.userId, countyId: auth.countyId, roles: auth.roles };
}

/**
 * useAuthContext() — canonical hook for feature surfaces needing county/user/roles.
 *
 * Returns a stable AuthContextValue derived from the existing auth token.
 * Safe to call in any component that sits below AuthProvider (Router.tsx).
 */
export function useAuthContext(): AuthContextValue {
  const { isAuthenticated, token } = useAuth();

  return useMemo((): AuthContextValue => {
    const claims = decodeAuthClaims(token ?? null);
    return { isAuthenticated, token: token ?? null, ...claims };
  }, [isAuthenticated, token]);
}

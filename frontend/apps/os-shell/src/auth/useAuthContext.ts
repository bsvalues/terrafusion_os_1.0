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

/**
 * Decode JWT payload without verification (browser-side, verification is backend's job).
 * Returns null if token is absent or malformed.
 */
function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // atob handles base64url by replacing URL-safe chars
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractRoles(payload: Record<string, unknown> | null): readonly string[] {
  if (!payload) return [];
  const raw = payload['roles'] ?? payload['role'] ?? [];
  if (Array.isArray(raw)) return raw.filter((r): r is string => typeof r === 'string');
  if (typeof raw === 'string') return [raw];
  return [];
}

function extractClaim(payload: Record<string, unknown> | null, ...keys: string[]): string | null {
  if (!payload) return null;
  for (const key of keys) {
    const val = payload[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return null;
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
    const payload = decodeJwtPayload(token ?? null);
    return {
      isAuthenticated,
      token: token ?? null,
      userId: extractClaim(payload, 'userId', 'sub', 'user_id', 'nameid'),
      countyId: extractClaim(payload, 'countyId', 'county_id', 'countyCode'),
      roles: extractRoles(payload),
    };
  }, [isAuthenticated, token]);
}

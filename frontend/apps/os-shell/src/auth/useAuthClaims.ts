/**
 * useAuthClaims — decode JWT claims from the current auth token.
 *
 * Extracts countyId, userId, roles, and countyCode from the JWT payload.
 * Gracefully handles: no token (unauthenticated), malformed tokens,
 * missing claims. Always returns valid defaults.
 *
 * Uses `useMemo` so the token is only decoded when it actually changes.
 *
 * @module auth/useAuthClaims
 */
import { useMemo } from 'react';
import { useAuth } from './useAuth';

export interface AuthClaims {
  countyId: string;
  userId: string;
  roles: string[];
  countyCode: string;
}

const DEFAULT_CLAIMS: AuthClaims = {
  countyId: 'benton',
  userId: 'anonymous',
  roles: [],
  countyCode: 'benton',
};

/**
 * Safely decode a JWT payload (second segment) using atob.
 * Returns null on any failure — never throws.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64url → Base64: replace URL-safe chars and pad
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }

    const json = atob(base64);
    const payload = JSON.parse(json);

    if (typeof payload !== 'object' || payload === null) return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Extract AuthClaims from a decoded JWT payload.
 * Handles common claim name variants (snake_case, camelCase, namespaced).
 */
function extractClaims(payload: Record<string, unknown>): AuthClaims {
  const countyId =
    asString(payload.county_id) ??
    asString(payload.countyId) ??
    asString(payload.county) ??
    DEFAULT_CLAIMS.countyId;

  const userId =
    asString(payload.sub) ??
    asString(payload.user_id) ??
    asString(payload.userId) ??
    DEFAULT_CLAIMS.userId;

  const countyCode =
    asString(payload.county_code) ??
    asString(payload.countyCode) ??
    countyId;

  const roles = extractRoles(payload);

  return { countyId, userId, roles, countyCode };
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function extractRoles(payload: Record<string, unknown>): string[] {
  // Try multiple common claim names
  const raw =
    payload.roles ??
    payload.role ??
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

  if (Array.isArray(raw)) {
    return raw.filter((r): r is string => typeof r === 'string');
  }
  if (typeof raw === 'string' && raw.length > 0) {
    return [raw];
  }
  return [];
}

/**
 * React hook that decodes JWT claims from the current auth token.
 *
 * Safe to call even when unauthenticated — returns defaults.
 * Memoized so the token is decoded only when it changes.
 */
export function useAuthClaims(): AuthClaims {
  const { token } = useAuth();

  return useMemo<AuthClaims>(() => {
    if (!token) return DEFAULT_CLAIMS;

    const payload = decodeJwtPayload(token);
    if (!payload) return DEFAULT_CLAIMS;

    return extractClaims(payload);
  }, [token]);
}

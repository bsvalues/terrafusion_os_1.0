/**
 * Wave 1 Auth Context Contract Tests
 * A. OsActor + decodeAuthClaims exported from one source.
 * B. toOsActor() returns OsActor for authenticated, null for unauthenticated.
 * C. decodeAuthClaims() is a pure function (no hooks, no side effects).
 */
import { describe, expect, it } from 'vitest';
import type { AuthContextValue } from '@/auth/useAuthContext';
import { toOsActor, decodeAuthClaims } from '@/auth/useAuthContext';

const authenticated: AuthContextValue = {
  isAuthenticated: true, userId: 'appraiser-001',
  countyId: 'benton', roles: ['appraiser'], token: 'tok.abc.xyz',
};
const unauthenticated: AuthContextValue = {
  isAuthenticated: false, userId: null,
  countyId: null, roles: [], token: null,
};
const partialAuth: AuthContextValue = {          // authenticated but countyId missing
  isAuthenticated: true, userId: 'u1',
  countyId: null, roles: ['viewer'], token: 'tok.a.b',
};

describe('A: Exports exist at single source', () => {
  it('toOsActor is exported from useAuthContext', async () => {
    const mod = await import('@/auth/useAuthContext');
    expect(typeof mod.toOsActor).toBe('function');
  });
  it('decodeAuthClaims is exported from useAuthContext', async () => {
    const mod = await import('@/auth/useAuthContext');
    expect(typeof mod.decodeAuthClaims).toBe('function');
  });
});

describe('B: toOsActor returns OsActor or null (never nullable-fields object)', () => {
  it('returns OsActor with non-null fields for authenticated user', () => {
    const actor = toOsActor(authenticated);
    expect(actor).not.toBeNull();
    expect(actor!.userId).toBe('appraiser-001');
    expect(actor!.countyId).toBe('benton');
    expect(actor!.roles).toEqual(['appraiser']);
  });
  it('returned OsActor has exactly {userId, countyId, roles}', () => {
    const actor = toOsActor(authenticated)!;
    expect(new Set(Object.keys(actor))).toEqual(new Set(['userId', 'countyId', 'roles']));
  });
  it('returns null for unauthenticated context', () => {
    expect(toOsActor(unauthenticated)).toBeNull();
  });
  it('returns null when countyId is missing even if isAuthenticated=true', () => {
    expect(toOsActor(partialAuth)).toBeNull();
  });
  it('OsActor.userId is string (not null)', () => {
    expect(typeof toOsActor(authenticated)!.userId).toBe('string');
  });
});

describe('C: decodeAuthClaims is pure — no hooks, handles null token', () => {
  it('returns nulls for null token', () => {
    const claims = decodeAuthClaims(null);
    expect(claims.userId).toBeNull();
    expect(claims.countyId).toBeNull();
    expect(Array.isArray(claims.roles)).toBe(true);
  });
  it('does not throw for malformed token', () => {
    expect(() => decodeAuthClaims('not.a.real.jwt')).not.toThrow();
  });
});

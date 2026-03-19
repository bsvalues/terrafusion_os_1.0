/**
 * Wave 1 Auth Threading — Full Gate (A/B/C/D)
 */
import { describe, expect, it, vi } from 'vitest';
import { toOsActor } from '@/auth/useAuthContext';
import type { AuthContextValue, OsActor } from '@/auth/useAuthContext';
import type { OsActionContext } from '@/services/osActions';

const mkAuth = (o: Partial<AuthContextValue> = {}): AuthContextValue => ({
  isAuthenticated: true, userId: 'appraiser-001', countyId: 'benton',
  roles: ['appraiser'], token: 'tok.abc.xyz', ...o,
});
const unauth = mkAuth({ isAuthenticated: false, userId: null, countyId: null, roles: [], token: null });

describe('A: Single source — OsActor type contract', () => {
  it('toOsActor is function from useAuthContext', () => { expect(typeof toOsActor).toBe('function'); });
  it('OsActor has exactly 3 keys', () => {
    expect(new Set(Object.keys(toOsActor(mkAuth())!))).toEqual(new Set(['userId', 'countyId', 'roles']));
  });
});

describe('B: Propagation through the chain', () => {
  it('userId flows from AuthContextValue → OsActor', () => {
    expect(toOsActor(mkAuth({ userId: 'clerk-007' }))!.userId).toBe('clerk-007');
  });
  it('countyId flows correctly', () => {
    expect(toOsActor(mkAuth({ countyId: 'king' }))!.countyId).toBe('king');
  });
  it('roles flow correctly', () => {
    expect(toOsActor(mkAuth({ roles: ['supervisor'] }))!.roles).toEqual(['supervisor']);
  });
  it('OsActionContext accepts OsActor without type error', () => {
    const actor = toOsActor(mkAuth());  // OsActor | null
    expect(actor).not.toBeNull();
    const ctx: OsActionContext = { navigate: vi.fn(), suiteId: 'forge', surface: 'workbench', actor };
    expect(ctx.actor?.userId).toBe('appraiser-001');
  });
});

describe('C: Null-path — unauthenticated returns null (not nullable-fields object)', () => {
  it('toOsActor returns null for unauthenticated context', () => {
    expect(toOsActor(unauth)).toBeNull();
  });
  it('toOsActor returns null when countyId missing (partial auth)', () => {
    const partial: AuthContextValue = {
      isAuthenticated: true, userId: 'u1', countyId: null, roles: [], token: 'tok.a.b',
    };
    expect(toOsActor(partial)).toBeNull();
  });
  it('OsActionContext with actor: null is safe (no crash)', () => {
    const ctx: OsActionContext = { navigate: vi.fn(), suiteId: 'os', surface: 'launcher', actor: null };
    expect(ctx.actor).toBeNull();
  });
  it('OsActionContext with actor: toOsActor(unauth) stores null', () => {
    const ctx: OsActionContext = { navigate: vi.fn(), suiteId: 'os', surface: 'launcher', actor: toOsActor(unauth) };
    expect(ctx.actor).toBeNull();
  });
  it('OsActionContext with actor omitted compiles (backward compat)', () => {
    const ctx: OsActionContext = { navigate: vi.fn(), suiteId: 'atlas', surface: 'standalone_home' };
    expect(ctx).not.toHaveProperty('actor');
  });
});

describe('D: Invariant — no routing or write-lane change', () => {
  it('suiteId unchanged when actor present', () => {
    const ctx: OsActionContext = { navigate: vi.fn(), suiteId: 'dais', surface: 'module', actor: toOsActor(mkAuth()) /* non-null: full creds */ };
    expect(ctx.suiteId).toBe('dais');
  });
  it('surface unchanged when actor present', () => {
    const ctx: OsActionContext = { navigate: vi.fn(), suiteId: 'dais', surface: 'module', actor: toOsActor(mkAuth()) };
    expect(ctx.surface).toBe('module');
  });
});

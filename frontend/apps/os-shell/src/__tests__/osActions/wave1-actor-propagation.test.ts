import { describe, expect, it, vi } from 'vitest';
import type { OsActor } from '@/auth/useAuthContext';
import type { OsActionContext } from '@/services/osActions';

describe('B: OsActionContext accepts actor field', () => {
  it('OsActionContext with actor compiles and preserves userId', () => {
    const actor: OsActor = { userId: 'u1', countyId: 'benton', roles: ['appraiser'] };
    const ctx: OsActionContext = { navigate: vi.fn(), suiteId: 'forge', surface: 'launcher', actor };
    expect(ctx.actor?.userId).toBe('u1');
    expect(ctx.actor?.countyId).toBe('benton');
  });
});

describe('C: Null actor is valid and safe', () => {
  it('actor: null is valid in OsActionContext', () => {
    const ctx: OsActionContext = { navigate: vi.fn(), suiteId: 'forge', surface: 'launcher', actor: null };
    expect(ctx.actor).toBeNull();
  });
  it('actor omitted is valid (backward compat)', () => {
    const ctx: OsActionContext = { navigate: vi.fn(), suiteId: 'atlas', surface: 'standalone_home' };
    expect(ctx).not.toHaveProperty('actor');
  });
});

describe('D: actor field does not change routing invariants', () => {
  it('suiteId and surface are unchanged when actor is present', () => {
    const actor: OsActor = { userId: 'u1', countyId: 'benton', roles: ['supervisor'] };
    const ctx: OsActionContext = { navigate: vi.fn(), suiteId: 'dais', surface: 'module', actor };
    expect(ctx.suiteId).toBe('dais');
    expect(ctx.surface).toBe('module');
  });
});

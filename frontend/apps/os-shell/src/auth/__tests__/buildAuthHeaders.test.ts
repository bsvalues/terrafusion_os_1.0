import { describe, it, expect } from 'vitest';
import { buildAuthHeaders } from '../buildAuthHeaders';
import type { AuthContextValue } from '../useAuthContext';

const base: AuthContextValue = {
  isAuthenticated: true,
  token: 'tok',
  userId: 'u1',
  countyId: 'benton',
  roles: ['assessor'],
};

describe('buildAuthHeaders', () => {
  it('adds Authorization, X-County-Id, X-User-Id when authenticated', () => {
    const h = buildAuthHeaders(base);
    expect(h['Authorization']).toBe('Bearer tok');
    expect(h['X-County-Id']).toBe('benton');
    expect(h['X-User-Id']).toBe('u1');
  });

  it('omits all auth headers when unauthenticated', () => {
    const h = buildAuthHeaders({
      isAuthenticated: false,
      token: null,
      userId: null,
      countyId: null,
      roles: [],
    });
    expect(Object.keys(h)).toHaveLength(0);
  });

  it('never emits undefined header values', () => {
    const h = buildAuthHeaders({ ...base, userId: null, countyId: null });
    expect(Object.values(h).every(v => v !== undefined)).toBe(true);
    expect(h['X-County-Id']).toBeUndefined();
    expect(h['X-User-Id']).toBeUndefined();
  });

  it('includes only Authorization when only token present', () => {
    const h = buildAuthHeaders({ ...base, userId: null, countyId: null });
    expect(Object.keys(h)).toEqual(['Authorization']);
  });
});

import { describe, it, expect, vi } from 'vitest';

// Mock useAuth before importing useAuthContext
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

import { renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { useAuthContext } from '../useAuthContext';

const mockUseAuth = vi.mocked(useAuth);

describe('useAuthContext', () => {
  it('returns unauthenticated state when not logged in', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, token: null } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => useAuthContext());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userId).toBeNull();
    expect(result.current.countyId).toBeNull();
    expect(result.current.roles).toEqual([]);
    expect(result.current.token).toBeNull();
  });

  it('extracts userId from JWT sub claim', () => {
    // Build a fake JWT: header.payload.sig (payload is base64url encoded JSON)
    const payload = { sub: 'user-123', countyId: 'benton', roles: ['assessor'] };
    const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const fakeToken = `header.${encoded}.sig`;

    mockUseAuth.mockReturnValue({ isAuthenticated: true, token: fakeToken } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => useAuthContext());

    expect(result.current.userId).toBe('user-123');
    expect(result.current.countyId).toBe('benton');
    expect(result.current.roles).toEqual(['assessor']);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('returns empty roles array for malformed token', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, token: 'not.a.jwt.at.all' } as ReturnType<typeof useAuth>);
    const { result } = renderHook(() => useAuthContext());
    expect(result.current.roles).toEqual([]);
  });

  it('returns stable reference across re-renders when token unchanged', () => {
    const payload = { sub: 'u1', countyId: 'c1' };
    const encoded = btoa(JSON.stringify(payload));
    const fakeToken = `h.${encoded}.s`;
    mockUseAuth.mockReturnValue({ isAuthenticated: true, token: fakeToken } as ReturnType<typeof useAuth>);

    const { result, rerender } = renderHook(() => useAuthContext());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

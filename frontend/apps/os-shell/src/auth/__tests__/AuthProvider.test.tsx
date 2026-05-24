/**
 * Phase 18 — AuthProvider contract tests.
 *
 * Proves the reactive auth boundary works:
 * - Initializes token from storage
 * - login() persists + updates state
 * - logout() clears + updates state
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthProvider';
import * as authStorage from '../authStorage';
import { useAuth } from '../useAuth';

// Spy helper to wrap AuthProvider + expose hook values
function AuthProbe({ onAuth }: { onAuth: (val: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  onAuth(auth);
  return <div data-testid='probe'>ok</div>;
}

function renderWithAuth(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

function validJwt() {
  const encode = (value: unknown) => btoa(JSON.stringify(value));
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes_from_storage_token', () => {
    // Pre-seed storage with a token
    const storedToken = validJwt();
    authStorage.setToken(storedToken);

    let captured: ReturnType<typeof useAuth> | undefined;
    renderWithAuth(
      <AuthProbe
        onAuth={(v) => {
          captured = v;
        }}
      />
    );

    expect(captured).toBeDefined();
    expect(captured!.token).toBe(storedToken);
    expect(captured!.isAuthenticated).toBe(true);
  });

  it('returns_unauthenticated_when_no_token_in_storage', () => {
    let captured: ReturnType<typeof useAuth> | undefined;
    renderWithAuth(
      <AuthProbe
        onAuth={(v) => {
          captured = v;
        }}
      />
    );

    expect(captured).toBeDefined();
    expect(captured!.token).toBeNull();
    expect(captured!.isAuthenticated).toBe(false);
  });

  it('clears_invalid_storage_token_and_marks_unauthenticated', () => {
    authStorage.setToken('invalid.jwt.token');

    let captured: ReturnType<typeof useAuth> | undefined;
    renderWithAuth(
      <AuthProbe
        onAuth={(v) => {
          captured = v;
        }}
      />
    );

    expect(captured).toBeDefined();
    expect(captured!.token).toBeNull();
    expect(captured!.isAuthenticated).toBe(false);
    expect(authStorage.getToken()).toBeNull();
  });

  it('login_sets_token_and_marks_authenticated', () => {
    let captured: ReturnType<typeof useAuth> | undefined;
    renderWithAuth(
      <AuthProbe
        onAuth={(v) => {
          captured = v;
        }}
      />
    );

    expect(captured!.isAuthenticated).toBe(false);

    act(() => {
      captured!.login('NEW_TOKEN');
    });

    expect(captured!.token).toBe('NEW_TOKEN');
    expect(captured!.isAuthenticated).toBe(true);
    // Also persisted to storage
    expect(authStorage.getToken()).toBe('NEW_TOKEN');
  });

  it('logout_clears_token_and_marks_unauthenticated', () => {
    authStorage.setToken(validJwt());

    let captured: ReturnType<typeof useAuth> | undefined;
    renderWithAuth(
      <AuthProbe
        onAuth={(v) => {
          captured = v;
        }}
      />
    );

    expect(captured!.isAuthenticated).toBe(true);

    act(() => {
      captured!.logout('test');
    });

    expect(captured!.token).toBeNull();
    expect(captured!.isAuthenticated).toBe(false);
    expect(authStorage.getToken()).toBeNull();
  });

  it('throws_when_useAuth_used_outside_provider', () => {
    // Suppress React error boundary noise for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function Orphan() {
      useAuth();
      return null;
    }

    expect(() => {
      render(
        <MemoryRouter>
          <Orphan />
        </MemoryRouter>
      );
    }).toThrow('useAuth must be used within an AuthProvider');

    spy.mockRestore();
  });
});

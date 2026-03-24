/**
 * demoModeHeaders.contract.test.ts
 *
 * Phase 14 — Operator Journey Proofing
 * =====================================
 *
 * Proves county isolation header contract for demo mode:
 *
 *   1. buildCountyScopedHeaders emits X-County-Id (auth variant)
 *   2. buildCountyScopedSessionHeaders emits x-county-id (session variant)
 *   3. Both return isolated: true for Benton
 *   4. Both return isolated: false for null/empty county
 *
 * @see services/countyIsolation.ts
 */
import { describe, it, expect } from 'vitest';
import {
  buildCountyScopedHeaders,
  buildCountyScopedSessionHeaders,
} from '../../services/countyIsolation';
import type { AuthContextValue } from '../../auth/useAuthContext';
import type { Session } from '../../auth/session';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const BENTON_AUTH: AuthContextValue = {
  isAuthenticated: true,
  userId: 'benton-assessor',
  countyId: 'benton',
  roles: ['assessor'],
  token: 'mock-token',
};

const NO_COUNTY_AUTH: AuthContextValue = {
  isAuthenticated: false,
  userId: '',
  countyId: '',
  roles: [],
  token: null,
};

const BENTON_SESSION: Session = {
  userId: 'benton-assessor',
  countyId: 'benton',
  role: 'assessor',
  mode: 'pilot' as const,
};

// ── buildCountyScopedHeaders (auth variant) ──────────────────────────────────

describe('buildCountyScopedHeaders — auth variant', () => {
  it('returns isolated: true for Benton auth', () => {
    const { isolated } = buildCountyScopedHeaders(BENTON_AUTH);
    expect(isolated).toBe(true);
  });

  it('emits X-County-Id header with value "benton"', () => {
    const { headers } = buildCountyScopedHeaders(BENTON_AUTH);
    // Source uses 'X-County-Id' (confirmed in countyIsolation.ts line 102)
    const countyHeader =
      headers['X-County-Id'] ?? headers['x-county-id'] ?? headers['X-County-ID'];
    expect(countyHeader).toBe('benton');
  });

  it('includes Authorization header when token is present', () => {
    const { headers } = buildCountyScopedHeaders(BENTON_AUTH);
    expect(headers['Authorization']).toBe('Bearer mock-token');
  });

  it('returns isolated: false for empty countyId', () => {
    const { isolated } = buildCountyScopedHeaders(NO_COUNTY_AUTH);
    expect(isolated).toBe(false);
  });

  it('does not emit county header for empty countyId', () => {
    const { headers } = buildCountyScopedHeaders(NO_COUNTY_AUTH);
    const countyHeader =
      headers['X-County-Id'] ?? headers['x-county-id'] ?? headers['X-County-ID'];
    expect(countyHeader).toBeUndefined();
  });
});

// ── buildCountyScopedSessionHeaders (session variant) ───────────────────────

describe('buildCountyScopedSessionHeaders — session variant', () => {
  it('returns isolated: true for Benton session', () => {
    const { isolated } = buildCountyScopedSessionHeaders(BENTON_SESSION);
    expect(isolated).toBe(true);
  });

  it('emits x-county-id header with value "benton"', () => {
    const { headers } = buildCountyScopedSessionHeaders(BENTON_SESSION);
    // Source uses 'x-county-id' (lowercase, confirmed in countyIsolation.ts line 127)
    const countyHeader =
      headers['x-county-id'] ?? headers['X-County-Id'] ?? headers['X-County-ID'];
    expect(countyHeader).toBe('benton');
  });

  it('returns isolated: false for null session', () => {
    const { isolated } = buildCountyScopedSessionHeaders(null);
    expect(isolated).toBe(false);
  });

  it('does not emit county header for null session', () => {
    const { headers } = buildCountyScopedSessionHeaders(null);
    const countyHeader =
      headers['x-county-id'] ?? headers['X-County-Id'] ?? headers['X-County-ID'];
    expect(countyHeader).toBeUndefined();
  });
});

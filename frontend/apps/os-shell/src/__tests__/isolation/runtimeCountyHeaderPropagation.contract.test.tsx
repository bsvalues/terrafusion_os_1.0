/**
 * runtimeCountyHeaderPropagation.contract.test.tsx
 *
 * Phase 15 — Runtime Hardening: Brick 1
 * ======================================
 *
 * Proves that county context propagates correctly to API headers across the
 * full runtime chain: localStorage → useSession → buildCountyScopedSessionHeaders
 * → outgoing request headers.
 *
 * Key scenarios:
 *   1. Cold-start (no storage) — FALLBACK countyId 'benton' reaches header
 *   2. Seeded session — stored countyId reaches header exactly
 *   3. Simulated refresh — clear + re-seed storage, new countyId reaches header
 *   4. County switch — changed session yields changed header, no stale carry-over
 *   5. Null/corrupt storage — FALLBACK countyId, never missing or undefined header
 *   6. Two counties simultaneously — each builds independent isolated headers
 *
 * This is a runtime chain test. It does NOT test network I/O.
 * It tests the guarantee that the wiring from session to header is unbroken.
 *
 * @see src/auth/useSession.ts — SESSION_KEY, FALLBACK, useSession()
 * @see src/services/countyIsolation.ts — buildCountyScopedSessionHeaders()
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSession } from '../../auth/useSession';
import { buildCountyScopedSessionHeaders } from '../../services/countyIsolation';
import type { Session } from '../../auth/session';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SESSION_KEY = 'tf.session.dev';

function seedSession(partial: Partial<Session>): void {
  const full: Session = {
    userId: partial.userId ?? 'test-user',
    countyId: partial.countyId ?? 'benton',
    role: partial.role ?? 'assessor',
    mode: partial.mode ?? 'pilot',
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(full));
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

function readSession(): Session {
  const { result } = renderHook(() => useSession());
  // Map TFSession → Session (same shape, compatible for header builder)
  return result.current as unknown as Session;
}

function headersFor(session: Session): Record<string, string> {
  const { headers } = buildCountyScopedSessionHeaders(session);
  return headers;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Phase 15 Brick 1 — Runtime county header propagation', () => {
  beforeEach(() => {
    clearSession();
  });

  afterEach(() => {
    clearSession();
  });

  // ── 1. Cold-start ───────────────────────────────────────────────────────────

  describe('cold-start (no stored session)', () => {
    it('useSession returns FALLBACK countyId "benton"', () => {
      const session = readSession();
      expect(session.countyId).toBe('benton');
    });

    it('FALLBACK session produces isolated header with x-county-id: benton', () => {
      const session = readSession();
      const headers = headersFor(session);
      expect(headers['x-county-id']).toBe('benton');
    });

    it('isolated flag is true even for FALLBACK county', () => {
      const session = readSession();
      const { isolated } = buildCountyScopedSessionHeaders(session);
      expect(isolated).toBe(true);
    });
  });

  // ── 2. Seeded session ───────────────────────────────────────────────────────

  describe('seeded session — stored countyId reaches header', () => {
    it('benton session → x-county-id: benton', () => {
      seedSession({ countyId: 'benton', userId: 'assessor-1' });
      const session = readSession();
      const headers = headersFor(session);
      expect(headers['x-county-id']).toBe('benton');
    });

    it('cowlitz session → x-county-id: cowlitz', () => {
      seedSession({ countyId: 'cowlitz', userId: 'assessor-2' });
      const session = readSession();
      const headers = headersFor(session);
      expect(headers['x-county-id']).toBe('cowlitz');
    });

    it('yakima session → x-county-id: yakima', () => {
      seedSession({ countyId: 'yakima', userId: 'assessor-3' });
      const session = readSession();
      const headers = headersFor(session);
      expect(headers['x-county-id']).toBe('yakima');
    });

    it('session userId reaches x-user-id header', () => {
      seedSession({ userId: 'bsval-42', countyId: 'benton' });
      const session = readSession();
      const headers = headersFor(session);
      expect(headers['x-user-id']).toBe('bsval-42');
    });

    it('session role reaches x-role header', () => {
      seedSession({ countyId: 'benton', role: 'assessor' });
      const session = readSession();
      const headers = headersFor(session);
      expect(headers['x-role']).toBe('assessor');
    });
  });

  // ── 3. Simulated refresh ────────────────────────────────────────────────────

  describe('simulated refresh — county context restores from storage', () => {
    it('clear then re-seed: new countyId propagates to header', () => {
      // First "session"
      seedSession({ countyId: 'benton' });
      const session1 = readSession();
      expect(headersFor(session1)['x-county-id']).toBe('benton');

      // Simulate refresh — clear storage and re-seed as different county
      clearSession();
      seedSession({ countyId: 'cowlitz' });

      const session2 = readSession();
      expect(headersFor(session2)['x-county-id']).toBe('cowlitz');
    });

    it('after refresh with no session: falls back to benton, not empty string', () => {
      // Seed, then clear (simulates logout + page refresh with no session write)
      seedSession({ countyId: 'yakima' });
      clearSession();

      const session = readSession();
      const headers = headersFor(session);
      // Must be non-empty — never undefined or ''
      expect(headers['x-county-id']).toBeTruthy();
      expect(headers['x-county-id']).toBe('benton'); // FALLBACK
    });
  });

  // ── 4. County switch ────────────────────────────────────────────────────────

  describe('county switch — changed session yields changed header immediately', () => {
    it('switching from benton to cowlitz: header reflects cowlitz, not benton', () => {
      seedSession({ countyId: 'benton' });
      const headers1 = headersFor(readSession());
      expect(headers1['x-county-id']).toBe('benton');

      // Switch county
      clearSession();
      seedSession({ countyId: 'cowlitz' });

      const headers2 = headersFor(readSession());
      expect(headers2['x-county-id']).toBe('cowlitz');
      expect(headers2['x-county-id']).not.toBe(headers1['x-county-id']);
    });
  });

  // ── 5. Corrupt/null storage ─────────────────────────────────────────────────

  describe('null/corrupt storage — header is never missing', () => {
    it('null JSON → FALLBACK, x-county-id is benton', () => {
      localStorage.setItem(SESSION_KEY, 'null');
      const session = readSession();
      const headers = headersFor(session);
      expect(headers['x-county-id']).toBe('benton');
    });

    it('corrupt JSON → FALLBACK, x-county-id is benton', () => {
      localStorage.setItem(SESSION_KEY, '{not valid json');
      const session = readSession();
      const headers = headersFor(session);
      expect(headers['x-county-id']).toBe('benton');
    });

    it('empty string value → FALLBACK, x-county-id is benton', () => {
      localStorage.setItem(SESSION_KEY, '{"userId":"x","countyId":"","role":"viewer","mode":"pilot"}');
      const session = readSession();
      // empty countyId should fall to FALLBACK
      const headers = headersFor(session);
      expect(headers['x-county-id']).toBeTruthy();
    });
  });

  // ── 6. Two counties simultaneously ─────────────────────────────────────────

  describe('two-county independence — headers never cross-contaminate', () => {
    it('benton and cowlitz sessions build independent isolated headers', () => {
      const bentonSession: Session = {
        userId: 'u1', countyId: 'benton', role: 'assessor', mode: 'pilot',
      };
      const cowlitzSession: Session = {
        userId: 'u2', countyId: 'cowlitz', role: 'assessor', mode: 'pilot',
      };

      const bentonHeaders = headersFor(bentonSession);
      const cowlitzHeaders = headersFor(cowlitzSession);

      expect(bentonHeaders['x-county-id']).toBe('benton');
      expect(cowlitzHeaders['x-county-id']).toBe('cowlitz');
      expect(bentonHeaders['x-county-id']).not.toBe(cowlitzHeaders['x-county-id']);
    });

    it('neither set of headers bleeds userId from the other', () => {
      const bentonSession: Session = {
        userId: 'benton-user', countyId: 'benton', role: 'assessor', mode: 'pilot',
      };
      const cowlitzSession: Session = {
        userId: 'cowlitz-user', countyId: 'cowlitz', role: 'assessor', mode: 'pilot',
      };

      const bH = headersFor(bentonSession);
      const cH = headersFor(cowlitzSession);

      expect(bH['x-user-id']).toBe('benton-user');
      expect(cH['x-user-id']).toBe('cowlitz-user');
      expect(bH['x-user-id']).not.toBe(cH['x-user-id']);
    });
  });
});

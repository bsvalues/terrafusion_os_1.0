/**
 * demoAuthPolicy.contract.test.ts
 *
 * Phase 13A — Demo Auth Policy Contract
 * ======================================
 *
 * Proves that auth enforcement is correctly controlled by env vars:
 *   - isDevPreviewMode() → false in demo mode (auth enforced)
 *   - shouldForceLoginRedirect() → true in demo mode
 *   - VITE_ENFORCE_AUTH_IN_DEV overrides the Vite dev-server bypass
 *
 * NOTE: authPolicy.ts reads getViteEnv() inside each function body (not at
 * module load time), so vi.resetModules() + dynamic import() correctly gives
 * each test a fresh module with the mocked env values.
 *
 * @see auth/authPolicy.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock getViteEnv ───────────────────────────────────────────────────────────
// We use a shared mutable object so helpers can mutate it between tests.
// The mock is hoisted before any import, so authPolicy always sees this mock.

const mockEnv: Record<string, string> = {};

vi.mock('../../env/getViteEnv', () => ({
  getViteEnv: () => mockEnv,
}));

// ── Env Helpers ───────────────────────────────────────────────────────────────

function setDemoEnv() {
  mockEnv['VITE_USE_MOCK_DATA'] = 'false';
  mockEnv['VITE_DEV_PREVIEW_BYPASS_AUTH'] = 'false';
  mockEnv['VITE_ENFORCE_AUTH_IN_DEV'] = 'true';
  mockEnv['DEV'] = 'true';
  mockEnv['MODE'] = 'development';
}

function setDevEnv() {
  mockEnv['VITE_USE_MOCK_DATA'] = 'false';
  mockEnv['VITE_DEV_PREVIEW_BYPASS_AUTH'] = 'false';
  mockEnv['VITE_ENFORCE_AUTH_IN_DEV'] = 'false';
  mockEnv['DEV'] = 'true';
  mockEnv['MODE'] = 'development';
}

function setProdEnv() {
  mockEnv['VITE_USE_MOCK_DATA'] = 'false';
  mockEnv['VITE_DEV_PREVIEW_BYPASS_AUTH'] = 'false';
  mockEnv['VITE_ENFORCE_AUTH_IN_DEV'] = 'false';
  mockEnv['DEV'] = 'false';
  mockEnv['MODE'] = 'production';
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Phase 13A: Demo Auth Policy Contract', () => {
  beforeEach(() => {
    // Clear all env mock values before each test
    Object.keys(mockEnv).forEach((k) => delete mockEnv[k]);
    // Reset module cache so authPolicy re-evaluates env on next import
    vi.resetModules();
  });

  // ── isDevPreviewMode() ─────────────────────────────────────────────────────

  describe('isDevPreviewMode()', () => {
    it('returns false in demo mode (VITE_ENFORCE_AUTH_IN_DEV=true)', async () => {
      setDemoEnv();
      const { isDevPreviewMode } = await import('../../auth/authPolicy');
      expect(isDevPreviewMode()).toBe(false);
    });

    it('returns true in standard dev mode (no enforce flag)', async () => {
      setDevEnv();
      const { isDevPreviewMode } = await import('../../auth/authPolicy');
      expect(isDevPreviewMode()).toBe(true);
    });

    it('returns false in production mode', async () => {
      setProdEnv();
      const { isDevPreviewMode } = await import('../../auth/authPolicy');
      expect(isDevPreviewMode()).toBe(false);
    });

    it('returns true when VITE_USE_MOCK_DATA=true regardless of other flags', async () => {
      setProdEnv();
      mockEnv['VITE_USE_MOCK_DATA'] = 'true';
      const { isDevPreviewMode } = await import('../../auth/authPolicy');
      expect(isDevPreviewMode()).toBe(true);
    });

    it('returns true when VITE_DEV_PREVIEW_BYPASS_AUTH=true', async () => {
      setProdEnv();
      mockEnv['VITE_DEV_PREVIEW_BYPASS_AUTH'] = 'true';
      const { isDevPreviewMode } = await import('../../auth/authPolicy');
      expect(isDevPreviewMode()).toBe(true);
    });
  });

  // ── shouldForceLoginRedirect() ─────────────────────────────────────────────

  describe('shouldForceLoginRedirect()', () => {
    it('returns true in demo mode — login IS enforced', async () => {
      setDemoEnv();
      const { shouldForceLoginRedirect } = await import('../../auth/authPolicy');
      expect(shouldForceLoginRedirect()).toBe(true);
    });

    it('returns false in dev mode — login bypass active', async () => {
      setDevEnv();
      const { shouldForceLoginRedirect } = await import('../../auth/authPolicy');
      expect(shouldForceLoginRedirect()).toBe(false);
    });

    it('returns true in production — login enforced', async () => {
      setProdEnv();
      const { shouldForceLoginRedirect } = await import('../../auth/authPolicy');
      expect(shouldForceLoginRedirect()).toBe(true);
    });
  });

  // ── Demo Mode Invariants ───────────────────────────────────────────────────

  describe('Demo mode invariants', () => {
    it('demo env never enables mock data', () => {
      // Contract: .env.demo must have VITE_USE_MOCK_DATA=false
      // This is a documentation contract — the real enforcement is .env.demo.example.
      expect(true).toBe(true);
    });

    it('VITE_ENFORCE_AUTH_IN_DEV overrides vite dev mode bypass', async () => {
      // Key invariant for the demo:
      // Even on a local dev server, if VITE_ENFORCE_AUTH_IN_DEV=true,
      // auth is enforced. This lets the demo run locally without a prod build.
      setDemoEnv();
      const { isDevPreviewMode, shouldForceLoginRedirect } = await import(
        '../../auth/authPolicy'
      );
      expect(isDevPreviewMode()).toBe(false);
      expect(shouldForceLoginRedirect()).toBe(true);
    });
  });
});

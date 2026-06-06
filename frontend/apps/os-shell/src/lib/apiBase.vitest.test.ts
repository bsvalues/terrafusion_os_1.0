/**
 * TerraFusion OS - API Base Invariant Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * GOVERNANCE: Ensures Invariant B is enforced at build/test time.
 * These tests prevent accidental /api prefix at callsites.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, buildApiUrl, getApiBase } from './apiBase';

describe('apiBase governance', () => {
  describe('getApiBase', () => {
    it('returns /api in browser context', () => {
      // window is defined in Vitest browser-like environment
      expect(getApiBase()).toBe('/api');
    });
  });

  describe('buildApiUrl - Invariant B enforcement', () => {
    it('correctly builds URL from path without /api prefix', () => {
      expect(buildApiUrl('/agents/events')).toBe('/api/agents/events');
      expect(buildApiUrl('/agents/status')).toBe('/api/agents/status');
      expect(buildApiUrl('/health')).toBe('/api/health');
    });

    it('THROWS when path starts with /api/ (Invariant B violation)', () => {
      expect(() => buildApiUrl('/api/agents/events')).toThrow(/Do not prefix \/api at call sites/);
      expect(() => buildApiUrl('/api/agents/status')).toThrow(/Do not prefix \/api at call sites/);
      expect(() => buildApiUrl('/api')).toThrow(/Do not prefix \/api at call sites/);
    });

    it('THROWS when path does not start with /', () => {
      expect(() => buildApiUrl('agents/events')).toThrow(/Path must start with "\/"/);
      expect(() => buildApiUrl('health')).toThrow(/Path must start with "\/"/);
    });

    it('provides helpful error message with corrected path', () => {
      try {
        buildApiUrl('/api/agents/events');
        expect.fail('Should have thrown');
      } catch (e) {
        expect((e as Error).message).toContain('expected "/agents/events"');
      }
    });
  });

  describe('apiFetch', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
      localStorage.clear();
      vi.unstubAllEnvs();
      originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue(new Response('{}'));
    });

    afterEach(() => {
      localStorage.clear();
      vi.unstubAllEnvs();
      globalThis.fetch = originalFetch;
    });

    it('calls fetch with correctly built URL', async () => {
      await apiFetch('/agents/status');
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/agents/status', undefined);
    });

    it('passes init options through', async () => {
      const init = { method: 'POST', body: '{}' };
      await apiFetch('/agents/events', init);
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/agents/events', init);
    });

    it('adds bearer auth from authStorage without dropping caller headers', async () => {
      localStorage.setItem('authToken', 'owner-token');

      await apiFetch('/county-study/studies?countyId=benton', {
        headers: { 'x-county-id': 'benton' },
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/county-study/studies?countyId=benton',
        {
          headers: {
            'x-county-id': 'benton',
            authorization: 'Bearer owner-token',
          },
        },
      );
    });

    it('obtains the existing dev preview token before the first protected API fetch', async () => {
      vi.stubEnv('VITE_DEV_PREVIEW_BYPASS_AUTH', 'true');
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'dev-jwt' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
        .mockResolvedValueOnce(new Response('{}'));

      await apiFetch('/geoforge/v2/parcels/tiles?taxYear=2026&limit=1');

      expect(globalThis.fetch).toHaveBeenNthCalledWith(1, '/api/auth/dev-token');
      expect(globalThis.fetch).toHaveBeenNthCalledWith(
        2,
        '/api/geoforge/v2/parcels/tiles?taxYear=2026&limit=1',
        {
          headers: {
            authorization: 'Bearer dev-jwt',
          },
        },
      );
      expect(localStorage.getItem('authToken')).toBe('dev-jwt');
    });
  });
});

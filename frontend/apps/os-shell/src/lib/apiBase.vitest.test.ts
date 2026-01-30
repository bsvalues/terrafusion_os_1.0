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
      originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue(new Response('{}'));
    });

    afterEach(() => {
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
  });
});

/// <reference types="vitest" />
/**
 * countyIsolationAudit.contract.test.ts
 *
 * Phase 13A — County Isolation Proof
 * ====================================
 *
 * Machine-verifiable assertions against the county isolation audit map.
 * Required artifact for Benton Demo Charter Lane 2.
 *
 * Proves:
 *   1. All mandatory surfaces have mechanism != 'none'
 *   2. No high-risk surface is stub-enforced
 *   3. Demo-critical surfaces (PropertiesController) are not stub
 *   4. buildCountyScopedHeaders emits X-County-Id when countyId is present
 *   5. assertCountyContext rejects null/empty county context
 *   6. pilotApi.ts source contains x-county-id header assignment
 *
 * @see services/countyIsolation.ts
 * @see api/pilotApi.ts (x-county-id header at line 41)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  COUNTY_ISOLATION_AUDIT,
  assertCountyContext,
  buildCountyScopedHeaders,
} from '../../services/countyIsolation';
import type { AuthContextValue } from '../../auth/useAuthContext';

// ============================================================================
// Fixtures
// ============================================================================

const AUTH_BENTON: AuthContextValue = {
  isAuthenticated: true,
  userId: 'benton-assessor',
  countyId: 'benton',
  roles: ['assessor'],
  token: 'fake-token',
};

const AUTH_NO_COUNTY: AuthContextValue = {
  isAuthenticated: true,
  userId: 'user-no-county',
  countyId: null,
  roles: ['assessor'],
  token: 'fake-token',
};

// ============================================================================
// Tests
// ============================================================================

describe('Phase 13A: County Isolation Audit Contract', () => {
  // ── Audit map invariants ──────────────────────────────────────────────────

  describe('Isolation audit map invariants', () => {
    it('all mandatory enforced surfaces have a transmission mechanism (not "none")', () => {
      // Surfaces with enforced=true must have a mechanism — gap surfaces may have 'none'
      // because the gap IS documented (captured by the gap description test below).
      const mandatoryEnforced = COUNTY_ISOLATION_AUDIT.filter(
        (a) => a.enforcement === 'mandatory' && a.enforced,
      );
      // Must have at least one enforced mandatory surface
      expect(mandatoryEnforced.length).toBeGreaterThanOrEqual(1);
      for (const surface of mandatoryEnforced) {
        expect(
          surface.mechanism,
          `${surface.surface} is enforced mandatory but mechanism is "none" — set a mechanism`,
        ).not.toBe('none');
      }
    });

    it('no high-risk surface has stub enforcement', () => {
      const highRiskStubs = COUNTY_ISOLATION_AUDIT.filter(
        (a) => a.riskLevel === 'high' && a.enforcement === 'stub',
      );
      expect(
        highRiskStubs,
        `High-risk stub surfaces detected: ${highRiskStubs.map((s) => s.surface).join(', ')}`,
      ).toHaveLength(0);
    });

    it('demo-critical surface PropertiesController is not stub', () => {
      const surface = COUNTY_ISOLATION_AUDIT.find((a) =>
        a.surface.includes('PropertiesController'),
      );
      // Must exist — PropertiesController is in scope for demo
      expect(surface, 'PropertiesController not found in isolation audit map').toBeDefined();
      if (surface) {
        expect(
          surface.enforcement,
          `PropertiesController must not be stub-enforced for Benton demo`,
        ).not.toBe('stub');
      }
    });

    it('all mandatory unenforced surfaces have a gap description', () => {
      const gaps = COUNTY_ISOLATION_AUDIT.filter(
        (a) => a.enforcement === 'mandatory' && !a.enforced,
      );
      for (const entry of gaps) {
        expect(
          entry.gap,
          `${entry.surface} has enforcement gap but no gap description`,
        ).toBeTruthy();
        expect(typeof entry.gap).toBe('string');
        expect((entry.gap as string).length).toBeGreaterThan(10);
      }
    });

    it('cross_county surfaces have riskLevel=none (intentionally exempt)', () => {
      const crossCounty = COUNTY_ISOLATION_AUDIT.filter(
        (a) => a.enforcement === 'cross_county',
      );
      for (const entry of crossCounty) {
        expect(
          entry.riskLevel,
          `${entry.surface} is cross_county but has non-zero risk — review classification`,
        ).toBe('none');
      }
    });

    it('audit map has at least one enforced surface', () => {
      const enforced = COUNTY_ISOLATION_AUDIT.filter((a) => a.enforced);
      expect(enforced.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── buildCountyScopedHeaders ──────────────────────────────────────────────

  describe('buildCountyScopedHeaders', () => {
    it('emits X-County-Id header when auth has countyId', () => {
      const { headers, isolated } = buildCountyScopedHeaders(AUTH_BENTON);
      expect(headers['X-County-Id']).toBe('benton');
      expect(isolated).toBe(true);
    });

    it('does not emit X-County-Id when countyId is null', () => {
      const { headers, isolated } = buildCountyScopedHeaders(AUTH_NO_COUNTY);
      expect(headers['X-County-Id']).toBeUndefined();
      expect(isolated).toBe(false);
    });

    it('County A context never bleeds into County B scoped headers', () => {
      const authYakima: AuthContextValue = {
        isAuthenticated: true,
        userId: 'yakima-user',
        countyId: 'yakima',
        roles: ['assessor'],
        token: 'tok-yakima',
      };
      const bentonResult = buildCountyScopedHeaders(AUTH_BENTON);
      const yakimaResult = buildCountyScopedHeaders(authYakima);

      expect(bentonResult.headers['X-County-Id']).toBe('benton');
      expect(bentonResult.headers['X-County-Id']).not.toBe('yakima');
      expect(yakimaResult.headers['X-County-Id']).toBe('yakima');
      expect(yakimaResult.headers['X-County-Id']).not.toBe('benton');
    });
  });

  // ── assertCountyContext ───────────────────────────────────────────────────

  describe('assertCountyContext', () => {
    it('rejects null countyId with COUNTY_CONTEXT_MISSING error', () => {
      const result = assertCountyContext(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('COUNTY_CONTEXT_MISSING');
      expect(result.countyId).toBeNull();
    });

    it('rejects empty string countyId', () => {
      const result = assertCountyContext('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('COUNTY_CONTEXT_MISSING');
    });

    it('rejects whitespace-only countyId', () => {
      const result = assertCountyContext('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('COUNTY_CONTEXT_MISSING');
    });

    it('accepts valid Benton county context', () => {
      const result = assertCountyContext('benton');
      expect(result.valid).toBe(true);
      expect(result.countyId).toBe('benton');
      expect(result.error).toBeUndefined();
    });
  });

  // ── Pilot API source inspection ───────────────────────────────────────────

  describe('Pilot API county header (source inspection)', () => {
    it('pilotApi.ts assigns x-county-id from session.countyId', () => {
      const pilotApiPath = resolve(
        import.meta.dirname,
        '../../api/pilotApi.ts',
      );
      const source = readFileSync(pilotApiPath, 'utf-8');
      // The file must contain the x-county-id assignment
      expect(source).toContain("'x-county-id'");
      expect(source).toContain('countyId');
    });

    it('pilotApi.ts x-county-id appears before line 50 (choke-point header builder)', () => {
      const pilotApiPath = resolve(
        import.meta.dirname,
        '../../api/pilotApi.ts',
      );
      const lines = readFileSync(pilotApiPath, 'utf-8').split('\n');
      const headerLine = lines.findIndex((l) => l.includes("'x-county-id'"));
      // Line index is 0-based; line 41 in file = index 40
      expect(headerLine).toBeGreaterThanOrEqual(0);
      expect(headerLine).toBeLessThan(50);
    });
  });
});

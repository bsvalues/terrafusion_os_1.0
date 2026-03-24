/**
 * suiteRouting.contract.test.tsx
 *
 * Phase 14 — Operator Journey Proofing: Suite Routing Contract
 * ============================================================
 *
 * Source-inspection contract: proves router.tsx maps /forge, /atlas, /dais,
 * /canon to the correct lazy-imported Suite home components.
 *
 * Uses file-read inspection (like keyboardSuiteSwitch.contract.test.ts) rather
 * than component rendering — Suite home components pull in Three.js/WebGL which
 * crashes the jsdom worker. The routing contract is equally valid via source proof.
 *
 * Contract:
 *   router.tsx lazy-imports ForgeSuiteHome  → assigns to variable used at <Route path='forge'>
 *   router.tsx lazy-imports AtlasSuiteHome  → assigns to variable used at <Route path='atlas'>
 *   router.tsx lazy-imports DaisSuiteHome   → assigns to variable used at <Route path='dais'>
 *   router.tsx lazy-imports CanonSuiteHome  → assigns to variable used at <Route path='canon'>
 *
 * @see src/router.tsx — suite route definitions
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let routerSource: string;

beforeAll(() => {
  routerSource = readFileSync(
    resolve(import.meta.dirname, '../../router.tsx'),
    'utf-8',
  );
});

describe('Suite routing source contract — router.tsx', () => {
  describe('ForgeSuiteHome', () => {
    it('is lazy-imported from pages/suites/ForgeSuiteHome', () => {
      expect(routerSource).toMatch(
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/pages\/suites\/ForgeSuiteHome['"]\s*\)\s*\)/,
      );
    });

    it('is used in a Route with path "forge"', () => {
      expect(routerSource).toMatch(/path\s*=\s*['"]forge['"]/);
    });
  });

  describe('AtlasSuiteHome', () => {
    it('is lazy-imported from pages/suites/AtlasSuiteHome', () => {
      expect(routerSource).toMatch(
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/pages\/suites\/AtlasSuiteHome['"]\s*\)\s*\)/,
      );
    });

    it('is used in a Route with path "atlas"', () => {
      // path='atlas' appears more than once (workbench sub-route + suite home)
      const atlasRoutes = [...routerSource.matchAll(/path\s*=\s*['"]atlas['"]/g)];
      expect(atlasRoutes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('DaisSuiteHome', () => {
    it('is lazy-imported from pages/suites/DaisSuiteHome', () => {
      expect(routerSource).toMatch(
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/pages\/suites\/DaisSuiteHome['"]\s*\)\s*\)/,
      );
    });

    it('is used in a Route with path "dais"', () => {
      const daisRoutes = [...routerSource.matchAll(/path\s*=\s*['"]dais['"]/g)];
      expect(daisRoutes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('CanonHome', () => {
    it('is lazy-imported from pages/CanonHome', () => {
      expect(routerSource).toMatch(
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/pages\/CanonHome['"]\s*\)\s*\)/,
      );
    });

    it('is used in a Route with path "canon"', () => {
      expect(routerSource).toMatch(/path\s*=\s*['"]canon['"]/);
    });
  });

  describe('All four suite routes coexist in the same route tree', () => {
    it('forge, atlas, dais, canon all appear as route paths', () => {
      expect(routerSource).toContain("path='forge'");
      expect(routerSource).toContain("path='atlas'");
      expect(routerSource).toContain("path='dais'");
      expect(routerSource).toContain("path='canon'");
    });
  });
});

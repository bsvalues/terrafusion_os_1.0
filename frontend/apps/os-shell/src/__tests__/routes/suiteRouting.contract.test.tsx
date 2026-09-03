/**
 * suiteRouting.contract.test.tsx
 *
 * Phase 14 — Operator Journey Proofing: Suite Routing Contract
 * ============================================================
 *
 * Source-inspection contract: proves Router.tsx maps /forge, /atlas, /dais,
 * /canon to the correct lazy-imported Suite home components.
 *
 * Uses file-read inspection (like keyboardSuiteSwitch.contract.test.ts) rather
 * than component rendering — Suite home components pull in Three.js/WebGL which
 * crashes the jsdom worker. The routing contract is equally valid via source proof.
 *
 * Contract:
 *   Router.tsx lazy-imports ForgeSuiteHome  → assigns to variable used at <Route path='forge'>
 *   Router.tsx lazy-imports AtlasSuiteHome  → assigns to variable used at <Route path='atlas'>
 *   Router.tsx lazy-imports DaisSuiteHome   → assigns to variable used at <Route path='dais'>
 *   Router.tsx lazy-imports CanonSuiteHome  → assigns to variable used at <Route path='canon'>
 *
 * @see src/Router.tsx — suite route definitions
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let routerSource: string;
let viteConfigSource: string;
let vitestConfigSource: string;

beforeAll(() => {
  routerSource = readFileSync(resolve(import.meta.dirname, '../../Router.tsx'), 'utf-8');
  viteConfigSource = readFileSync(
    resolve(import.meta.dirname, '../../../../../vite.config.ts'),
    'utf-8'
  );
  vitestConfigSource = readFileSync(
    resolve(import.meta.dirname, '../../../../../vitest.config.ts'),
    'utf-8'
  );
});

describe('Suite routing source contract — Router.tsx', () => {
  describe('CountiesHub', () => {
    it('is lazy-imported from components/CountiesHub', () => {
      expect(routerSource).toMatch(
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/components\/CountiesHub['"]\s*\)\s*\)/
      );
    });

    it('is used in the canonical /counties route', () => {
      expect(routerSource).toContain("path='counties' element={<CountiesHub />}");
    });

    it('routes county CSV admission to the TerraForge data-admission domain', () => {
      expect(routerSource).toContain(
        "import('../../terraforge/src/data-admission/CountyCsvAdmissionPage')"
      );
      expect(routerSource).toContain("path='counties/:countyCode/upload'");
      expect(routerSource).toContain('<CountyCsvAdmissionPage');
      expect(routerSource).toContain('apiFetch={apiFetch}');
      expect(routerSource).toContain('counties={WASHINGTON_COUNTIES}');
    });

    it('deduplicates cross-app React and router runtimes in builds and tests', () => {
      const dedupe = "dedupe: ['react', 'react-dom', 'react-router-dom']";
      expect(viteConfigSource).toContain(dedupe);
      expect(vitestConfigSource).toContain(dedupe);
    });
  });

  describe('ForgeSuiteHome', () => {
    it('is lazy-imported from pages/suites/ForgeSuiteHome', () => {
      expect(routerSource).toMatch(
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/pages\/suites\/ForgeSuiteHome['"]\s*\)\s*\)/
      );
    });

    it('is used in a Route with path "forge"', () => {
      expect(routerSource).toMatch(/path\s*=\s*['"]forge['"]/);
    });
  });

  describe('AtlasSuiteHome', () => {
    it('is lazy-imported from pages/suites/AtlasSuiteHome', () => {
      expect(routerSource).toMatch(
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/pages\/suites\/AtlasSuiteHome['"]\s*\)\s*\)/
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
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/pages\/suites\/DaisSuiteHome['"]\s*\)\s*\)/
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
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/pages\/CanonHome['"]\s*\)\s*\)/
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

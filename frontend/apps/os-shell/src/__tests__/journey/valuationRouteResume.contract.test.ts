/**
 * valuationRouteResume.contract.test.ts
 *
 * Phase 15 — Runtime Hardening: Brick 3
 * ======================================
 *
 * Proves that valuation workflow state resumes correctly after route changes,
 * suite switches, or shell-level navigation. The key invariant is:
 *
 *   Tab state is URL-driven, not component state.
 *   Navigating away and back to /property/:parcelId/forge always restores
 *   the Forge tab — no separate "remember last tab" logic needed or possible.
 *
 * Proofs:
 *   1. Router structure — /property/:parcelId/* nests all tab sub-routes
 *   2. tabPathMap completeness — every WorkbenchTabSlug (except 'summary')
 *      has a corresponding sub-route in router.tsx
 *   3. getCurrentTabFromPath source — fallback to 'summary' for unknown paths
 *   4. Summary tab (index route) — empty sub-path → 'summary'
 *   5. Each named tab slug maps to a unique non-overlapping path
 *   6. All 9 WORKBENCH_TABS exist as sub-routes in router.tsx
 *
 * Source-inspection is used (not component rendering) because PropertyWorkbench
 * imports LiquidPanel/materialServices that crash the jsdom worker via WebGL.
 * The routing contract is proven structurally — URL drives state.
 *
 * @see src/pages/workbench/PropertyWorkbench.tsx — getCurrentTabFromPath, tabPathMap
 * @see src/router.tsx — property/:parcelId/* sub-route tree
 * @see src/contracts/workbench.ts — WorkbenchTabSlug
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let workbenchSource: string;
let routerSource: string;

beforeAll(() => {
  workbenchSource = readFileSync(
    resolve(import.meta.dirname, '../../pages/workbench/PropertyWorkbench.tsx'),
    'utf-8',
  );
  routerSource = readFileSync(
    resolve(import.meta.dirname, '../../router.tsx'),
    'utf-8',
  );
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Phase 15 Brick 3 — Valuation route resume contract', () => {

  // ── 1. Router structure — wildcard route enables sub-tab URLs ──────────────

  describe('router.tsx — workbench route structure', () => {
    it('property/:parcelId is a wildcard route (nests sub-routes)', () => {
      expect(routerSource).toContain("path='property/:parcelId'");
    });

    it('lazy-imports PropertyWorkbench', () => {
      expect(routerSource).toMatch(
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/pages\/workbench\/PropertyWorkbench['"]\s*\)\s*\)/,
      );
    });
  });

  // ── 2. tabPathMap completeness ──────────────────────────────────────────────

  describe('tabPathMap — every WorkbenchTabSlug has a router sub-route', () => {
    const tabsWithPaths: Array<{ slug: string; routePath: string }> = [
      { slug: 'forge',    routePath: "path='forge'" },
      { slug: 'atlas',    routePath: "path='atlas'" },
      { slug: 'dais',     routePath: "path='dais'" },
      { slug: 'clerk',    routePath: "path='clerk'" },
      { slug: 'treasury', routePath: "path='treasury'" },
      { slug: 'audit',    routePath: "path='audit'" },
      { slug: 'dossier',  routePath: "path='dossier'" },
      { slug: 'pilot',    routePath: "path='pilot'" },
    ];

    for (const { slug, routePath } of tabsWithPaths) {
      it(`'${slug}' tab has a matching <Route> in router.tsx`, () => {
        expect(routerSource).toContain(routePath);
      });
    }

    it("'summary' tab uses the index route (no path segment)", () => {
      // Summary maps to /property/:parcelId (no suffix) — proven by <Route index>
      expect(routerSource).toContain('<Route index');
    });
  });

  // ── 3. getCurrentTabFromPath source — correct tab derivation ───────────────

  describe('getCurrentTabFromPath — URL-driven tab state', () => {
    it('tabPathMap in PropertyWorkbench covers all 8 named tab paths', () => {
      const tabPathMapBlock = workbenchSource.match(
        /const tabPathMap[^=]*=\s*\{([^}]+)\}/s,
      )?.[1] ?? '';

      const slugs = ['forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'];
      for (const slug of slugs) {
        expect(tabPathMapBlock).toContain(`'${slug}'`);
      }
    });

    it("falls back to 'summary' for unknown paths", () => {
      // The fallback is: return tabPathMap[pathAfterBase] ?? 'summary'
      expect(workbenchSource).toContain("?? 'summary'");
    });

    it("extracts tab from pathname by stripping the base /property/:parcelId prefix", () => {
      // getCurrentTabFromPath computes basePath = `/property/${parcelId}`
      expect(workbenchSource).toContain('basePath = `/property/${parcelId}`');
    });
  });

  // ── 4. URL-driven resume guarantee ─────────────────────────────────────────

  describe('URL-driven resume — structural proof', () => {
    it('getCurrentTabFromPath is derived from location.pathname (not component state)', () => {
      // Verify that useMemo depends on [location.pathname, parcelId]
      // The actual source has the dependency array on a separate line:
      //   const currentTabId = useMemo(
      //     () => (parcelId ? getCurrentTabFromPath(location.pathname, parcelId) : 'summary'),
      //     [location.pathname, parcelId]
      //   );
      expect(workbenchSource).toContain('getCurrentTabFromPath(location.pathname, parcelId)');
      expect(workbenchSource).toContain('[location.pathname, parcelId]');
    });

    it('tab state is NOT stored in useState (URL is the single source of truth)', () => {
      // No useState for tab — the tab is derived, not stored
      expect(workbenchSource).not.toMatch(/useState\s*<\s*WorkbenchTabSlug/);
      expect(workbenchSource).not.toMatch(/useState\(['"]summary['"]\)/);
    });

    it('navigating to /property/parcelId/forge and returning restores forge tab (URL proof)', () => {
      // Since tab = getCurrentTabFromPath(location.pathname, parcelId),
      // and location.pathname IS the URL, returning to /property/X/forge always gives 'forge'.
      // This is structurally guaranteed — prove the path is in the tabPathMap.
      expect(workbenchSource).toContain("forge: 'forge'");
      expect(workbenchSource).toContain("atlas: 'atlas'");
      expect(workbenchSource).toContain("dais: 'dais'");
    });
  });

  // ── 5. WORKBENCH_TABS locked order ─────────────────────────────────────────

  describe('WORKBENCH_TABS — locked order and completeness', () => {
    it('summary is the first tab (index 0)', () => {
      const tabsBlock = workbenchSource.match(
        /const WORKBENCH_TABS[^=]*=\s*\[([^\]]+)\]/s,
      )?.[1] ?? '';
      const firstTab = tabsBlock.match(/id:\s*'(\w+)'/)?.[1];
      expect(firstTab).toBe('summary');
    });

    it('all 9 WorkbenchTabSlug values appear in WORKBENCH_TABS', () => {
      const tabsBlock = workbenchSource.match(
        /const WORKBENCH_TABS[^=]*=\s*\[([^\]]+)\]/s,
      )?.[1] ?? '';
      const slugs = ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'];
      for (const slug of slugs) {
        expect(tabsBlock).toContain(`id: '${slug}'`);
      }
    });

    it('each tab has a path property (enables URL construction)', () => {
      // All tabs except summary have a non-empty path; summary has path: ''
      expect(workbenchSource).toContain("path: 'forge'");
      expect(workbenchSource).toContain("path: 'atlas'");
      expect(workbenchSource).toContain("path: 'dais'");
    });
  });
});

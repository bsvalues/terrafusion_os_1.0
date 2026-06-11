/**
 * valuationRouteResume.contract.test.ts
 *
 * Workbench deep-link resume contract
 * ===================================
 *
 * /property/:parcelId[/tab] remains a stable URL, but it resumes work by
 * activating the maximized OS-owned Property Workbench window. The route must
 * not keep a second tab lifecycle alive.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let routeBridgeSource: string;
let windowHostSource: string;
let surfaceSource: string;
let routerSource: string;

beforeAll(() => {
  routeBridgeSource = readFileSync(
    resolve(import.meta.dirname, '../../pages/workbench/PropertyWorkbench.tsx'),
    'utf-8',
  );
  windowHostSource = readFileSync(
    resolve(import.meta.dirname, '../../pages/workbench/PropertyWorkbenchWindow.tsx'),
    'utf-8',
  );
  surfaceSource = readFileSync(
    resolve(import.meta.dirname, '../../pages/workbench/PropertyWorkbenchSurface.tsx'),
    'utf-8',
  );
  routerSource = readFileSync(
    resolve(import.meta.dirname, '../../Router.tsx'),
    'utf-8',
  );
});

describe('Workbench deep-link resume contract', () => {
  describe('Router structure', () => {
    it('keeps /property/:parcelId as the deep-link route root', () => {
      expect(routerSource).toContain("path='property/:parcelId'");
    });

    it('lazy-imports the PropertyWorkbench route bridge', () => {
      expect(routerSource).toMatch(
        /lazy\s*\(\s*\(\)\s*=>\s*import\s*\(\s*['"]\.\/pages\/workbench\/PropertyWorkbench['"]\s*\)\s*\)/,
      );
    });

    it('registers every named Workbench tab path', () => {
      for (const path of ['forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot']) {
        expect(routerSource).toContain(`path='${path}'`);
      }
      expect(routerSource).toContain('<Route index');
    });
  });

  describe('Route bridge tab resolution', () => {
    it('allows every canonical tab slug in route parsing', () => {
      const validTabBlock = routeBridgeSource.match(/const VALID_ROUTE_TABS[^=]*=\s*new Set[^[]*\[([^\]]+)\]/s)?.[1] ?? '';
      for (const slug of ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot']) {
        expect(validTabBlock).toContain(`'${slug}'`);
      }
    });

    it('derives the tab from location.pathname and parcelId', () => {
      expect(routeBridgeSource).toContain('function getRoutedTab');
      expect(routeBridgeSource).toContain('pathname.split');
      expect(routeBridgeSource).toContain("parts.indexOf('property')");
      expect(routeBridgeSource).toContain('decodeURIComponent');
    });

    it("falls back to 'summary' for missing or unknown tab paths", () => {
      expect(routeBridgeSource).toContain("return 'summary'");
      expect(routeBridgeSource).toContain('VALID_ROUTE_TABS.has(candidate)');
    });
  });

  describe('Window activation resume', () => {
    it('passes parcelId and resolved tab into the canonical Workbench through Cortex activation', () => {
      expect(routeBridgeSource).toContain("activateModule('property-workbench'");
      expect(routeBridgeSource).toContain("source: 'route'");
      expect(routeBridgeSource).toContain('metadata: { parcelId, tabId: routedTabId');
    });

    it('does not call the legacy direct Workbench window helper', () => {
      expect(routeBridgeSource).not.toContain('openWorkbenchWindow');
    });

    it('derives routedTabId from URL state instead of component tab state', () => {
      expect(routeBridgeSource).toContain('getRoutedTab(location.pathname, parcelId)');
      expect(routeBridgeSource).toContain('[location.pathname, parcelId]');
      expect(routeBridgeSource).not.toMatch(/useState\s*<\s*WorkbenchTabSlug/);
    });

    it('normalizes the browser route after activating the Workbench window', () => {
      expect(routeBridgeSource).toContain("navigate('/', { replace: true })");
    });
  });

  describe('Canonical window host resume', () => {
    it('consumes routed metadata before defaulting to summary', () => {
      expect(windowHostSource).toContain("readMetadataString(metadata, '_routedTab')");
      expect(windowHostSource).toContain("metadata?.tabId as WorkbenchTabSlug");
      expect(windowHostSource).toContain("?? tab ?? 'summary'");
    });

    it('hosts the side rail in the OS window, not the route', () => {
      expect(windowHostSource).toContain('<WorkbenchRail');
      expect(routeBridgeSource).not.toContain('<WorkbenchRail');
    });
  });

  describe('WORKBENCH_TABS locked order and completeness', () => {
    it('summary is the first tab', () => {
      const tabsBlock = surfaceSource.match(/export const WORKBENCH_TABS[^=]*=\s*\[([^\]]+)\]/s)?.[1] ?? '';
      const firstTab = tabsBlock.match(/id:\s*'(\w+)'/)?.[1];
      expect(firstTab).toBe('summary');
    });

    it('all 9 WorkbenchTabSlug values appear in WORKBENCH_TABS', () => {
      const tabsBlock = surfaceSource.match(/export const WORKBENCH_TABS[^=]*=\s*\[([^\]]+)\]/s)?.[1] ?? '';
      for (const slug of ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot']) {
        expect(tabsBlock).toContain(`id: '${slug}'`);
      }
    });

    it('each named tab keeps a URL path for deep-link construction', () => {
      expect(surfaceSource).toContain("path: 'forge'");
      expect(surfaceSource).toContain("path: 'atlas'");
      expect(surfaceSource).toContain("path: 'dais'");
    });
  });
});

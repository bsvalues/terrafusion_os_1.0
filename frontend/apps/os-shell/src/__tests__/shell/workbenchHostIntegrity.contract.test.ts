/**
 * workbenchHostIntegrity.contract.test.ts
 *
 * Property Workbench host integrity
 * =================================
 *
 * The route is a deep-link bridge. The OS window is the only canonical
 * Workbench host, and it must keep the intended left rail navigation while
 * rendering real tab components through PropertyWorkbenchSurface.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SRC = resolve(import.meta.dirname, '../..');

function read(rel: string): string {
  return readFileSync(resolve(SRC, rel), 'utf-8');
}

let routeBridgeSrc: string;
let windowHostSrc: string;
let surfaceSrc: string;
let routerSrc: string;

beforeAll(() => {
  routeBridgeSrc = read('pages/workbench/PropertyWorkbench.tsx');
  windowHostSrc = read('pages/workbench/PropertyWorkbenchWindow.tsx');
  surfaceSrc = read('pages/workbench/PropertyWorkbenchSurface.tsx');
  routerSrc = read('Router.tsx');
});

describe('PropertyWorkbench route bridge', () => {
  it('activates the canonical Workbench through Cortex orchestration instead of hosting tabs', () => {
    expect(routeBridgeSrc).toContain("activateModule('property-workbench'");
    expect(routeBridgeSrc).toContain("source: 'route'");
    expect(routeBridgeSrc).toContain('metadata: { parcelId, tabId: routedTabId');
    expect(routeBridgeSrc).toContain("navigate('/', { replace: true })");
  });

  it('does not bypass Cortex by importing or calling openWorkbenchWindow', () => {
    expect(routeBridgeSrc).not.toContain('openWorkbenchWindow');
  });

  it('does not render duplicate Workbench host semantics', () => {
    expect(routeBridgeSrc).not.toContain('<Outlet');
    expect(routeBridgeSrc).not.toContain('<WorkbenchRail');
    expect(routeBridgeSrc).not.toContain('<ContextRibbon');
    expect(routeBridgeSrc).not.toContain('<ActivityFeed');
  });

  it('derives the routed tab from the deep-link URL', () => {
    expect(routeBridgeSrc).toContain('function getRoutedTab');
    expect(routeBridgeSrc).toContain('VALID_ROUTE_TABS.has(candidate)');
    expect(routeBridgeSrc).toContain("return 'summary'");
  });
});

describe('PropertyWorkbenchWindow canonical host', () => {
  const REQUIRED_TAB_COMPONENTS = [
    'PropertySummary',
    'PropertyForge',
    'PropertyAtlas',
    'PropertyDais',
    'PropertyClerk',
    'PropertyTreasury',
    'PropertyAudit',
    'PropertyDossier',
    'PropertyPilot',
  ] as const;

  it('uses PropertyWorkbenchSurface with the left WorkbenchRail', () => {
    expect(windowHostSrc).toContain('PropertyWorkbenchSurface');
    expect(windowHostSrc).toContain('<WorkbenchRail');
    expect(windowHostSrc).toContain('renderNavigation');
  });

  it.each(REQUIRED_TAB_COMPONENTS)('hosts real %s tab component', (tabName) => {
    expect(windowHostSrc).toContain(tabName);
  });

  it('renders tab content through the shared surface context', () => {
    expect(windowHostSrc).toContain('WorkbenchTabCtx.Provider');
    expect(windowHostSrc).toContain('<ActiveTabComponent');
  });
});

describe('Router deep-link preservation', () => {
  const REQUIRED_TAB_PATHS = [
    "path='forge'",
    "path='atlas'",
    "path='dais'",
    "path='clerk'",
    "path='treasury'",
    "path='audit'",
    "path='dossier'",
    "path='pilot'",
  ] as const;

  it('Router.tsx still registers the property deep-link route tree', () => {
    expect(routerSrc).toContain("path='property/:parcelId'");
    expect(routerSrc).toContain('<Route index');
  });

  it.each(REQUIRED_TAB_PATHS)('tab route %s is registered', (path) => {
    expect(routerSrc).toContain(path);
  });
});

describe('PropertyWorkbenchSurface shared runtime guardrails', () => {
  it('owns shell chrome, loading, and error boundaries for tab content', () => {
    expect(surfaceSrc).toContain('ContextRibbon');
    expect(surfaceSrc).toContain('ActivityFeed');
    expect(surfaceSrc).toContain('ErrorBoundary');
    expect(surfaceSrc).toContain('Suspense');
  });

  it('owns the canonical tab list', () => {
    expect(surfaceSrc).toContain('export const WORKBENCH_TABS');
    for (const tab of ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot']) {
      expect(surfaceSrc).toContain(`id: '${tab}'`);
    }
  });
});

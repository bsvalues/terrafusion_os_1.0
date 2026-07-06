/**
 * PropertyWorkbenchWindow.tabMapping.test.tsx
 *
 * WO-WB-G2-FIX-004 — proves the G2 Option D fix: the desktop window adapter mounts
 * the REAL Clerk/Treasury/Audit components (matching the route-based Workbench),
 * fixing BOTH alias mechanisms:
 *   - TAB_COMPONENTS map (tab-switch path): selecting Clerk/Treasury/Audit renders
 *     the real component, not Dossier/Dais.
 *   - resolvedInitialTab launch remap (launch path): launching with tabId =
 *     clerk/treasury/audit opens that real tab, not dossier/dais.
 * Plus a regression check that the six always-real tabs still render.
 *
 * The nine tab modules are stubbed to lightweight testid markers so this test
 * exercises the window's tab→component mapping, not each tab's internals.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ALL_TABS = ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'];

const { activateModuleMock, selectParcelMock, openWorkbenchWindowMock, visibleTabsHolder } = vi.hoisted(() => ({
  activateModuleMock: vi.fn(),
  selectParcelMock: vi.fn(),
  openWorkbenchWindowMock: vi.fn(),
  // Mutable so a test can simulate a role whose defaults hide clerk/treasury/audit.
  visibleTabsHolder: { value: ['summary', 'forge', 'atlas', 'dais', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'] },
}));

// ── Tab module stubs (named exports mirror the window's lazy imports) ──────────
const stub = (name: string) => () => <div data-testid={`stub-${name}`}>{name}</div>;
vi.mock('../../pages/workbench/tabs/PropertySummary', () => ({ PropertySummary: stub('summary') }));
vi.mock('../../pages/workbench/tabs/PropertyForge', () => ({ PropertyForge: stub('forge') }));
vi.mock('../../pages/workbench/tabs/PropertyAtlas', () => ({ PropertyAtlas: stub('atlas') }));
vi.mock('../../pages/workbench/tabs/PropertyDais', () => ({ PropertyDais: stub('dais') }));
vi.mock('../../pages/workbench/tabs/PropertyDossier', () => ({ PropertyDossier: stub('dossier') }));
vi.mock('../../pages/workbench/tabs/PropertyPilot', () => ({ PropertyPilot: stub('pilot') }));
vi.mock('../../pages/workbench/tabs/PropertyClerk', () => ({ PropertyClerk: stub('clerk') }));
vi.mock('../../pages/workbench/tabs/PropertyTreasury', () => ({ PropertyTreasury: stub('treasury') }));
vi.mock('../../pages/workbench/tabs/PropertyAudit', () => ({ PropertyAudit: stub('audit') }));

// ── Heavy-dependency mocks (reused from the segment-context test) ──────────────
vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: any) => {
    const state = {
      activeParcel: {
        parcelId: 'BC-1',
        address: '1 Test Ave',
        ownerName: 'Test Owner',
        totalAssessedValue: 250000,
        marketValue: 260000,
        landValue: 80000,
        improvementValue: 170000,
        propertyType: 'Residential',
        legalDescription: 'Lot 1',
        dataSource: 'test',
      },
      activeParcelLoading: false,
      selectParcel: selectParcelMock,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../context/parcelContext', () => ({
  useRecentParcels: () => [],
  useRecentParcelMeta: () => ({}),
  recordRecentParcelMeta: vi.fn(),
  openWorkbenchWindow: openWorkbenchWindowMock,
}));

vi.mock('../../stores/commandPaletteStore', () => ({
  useCommandPaletteStore: (selector: any) => selector({ open: vi.fn() }),
}));

vi.mock('../../shell/command-palette/useParcelSearch', () => ({
  useParcelSearch: () => ({ results: [], totalCount: 0, isLoading: false }),
}));

vi.mock('../../auth/useSession', () => ({
  useSession: () => ({ countyId: 'benton', userId: 'u-test', role: 'assessor' }),
}));

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: () => ({ countyId: 'benton', userId: 'u-test', roles: ['assessor'] }),
}));

// Visible-tab set is mutable per test (defaults to all nine).
vi.mock('../../hooks/useWorkbenchRoles', () => ({
  useWorkbenchRoles: () => ({
    visibleTabs: visibleTabsHolder.value,
    hiddenCount: 0,
    showAll: true,
    toggleShowAll: vi.fn(),
  }),
}));

vi.mock('../../services/badges', () => ({ BADGE_PROVIDERS: [] }));
vi.mock('../../services/quickActions', () => ({ QUICK_ACTION_PROVIDERS: [] }));
vi.mock('../../services/activityFeed', () => ({
  useParcelActivity: () => ({ entries: [], loading: false }),
}));
// Stub the chrome so the test targets tab mapping, not ribbon/feed internals.
vi.mock('../../components/workbench/ContextRibbon', () => ({ ContextRibbon: () => <div data-testid='ctx-ribbon' /> }));
vi.mock('../../components/workbench/ActivityFeed', () => ({ ActivityFeed: () => <div data-testid='activity-feed' /> }));

import PropertyWorkbenchWindow from '../../pages/workbench/PropertyWorkbenchWindow';

const renderWindow = (tabId: string) =>
  render(<PropertyWorkbenchWindow metadata={{ parcelId: 'BC-1', tabId }} />);

describe('PropertyWorkbenchWindow tab→component mapping (G2 Option D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    visibleTabsHolder.value = [...ALL_TABS];
  });

  // ── Launch path (proves the resolvedInitialTab remap is removed) ────────────

  it('launching with tabId=clerk opens the real Clerk tab (not Dossier)', async () => {
    renderWindow('clerk');
    expect(await screen.findByTestId('stub-clerk')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-dossier')).not.toBeInTheDocument();
  });

  it('launching with tabId=treasury opens the real Treasury tab (not Dais)', async () => {
    renderWindow('treasury');
    expect(await screen.findByTestId('stub-treasury')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-dais')).not.toBeInTheDocument();
  });

  it('launching with tabId=audit opens the real Audit tab (not Dossier)', async () => {
    renderWindow('audit');
    expect(await screen.findByTestId('stub-audit')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-dossier')).not.toBeInTheDocument();
  });

  // ── Tab-switch path (proves the TAB_COMPONENTS map points at the real components) ──

  it('selecting the Clerk tab renders the real Clerk component', async () => {
    renderWindow('summary');
    expect(await screen.findByTestId('stub-summary')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /clerk/i }));
    expect(await screen.findByTestId('stub-clerk')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-dossier')).not.toBeInTheDocument();
  });

  it('selecting the Treasury tab renders the real Treasury component', async () => {
    renderWindow('summary');
    await screen.findByTestId('stub-summary');
    fireEvent.click(screen.getByRole('tab', { name: /treasury/i }));
    expect(await screen.findByTestId('stub-treasury')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-dais')).not.toBeInTheDocument();
  });

  it('selecting the Audit tab renders the real Audit component', async () => {
    renderWindow('summary');
    await screen.findByTestId('stub-summary');
    fireEvent.click(screen.getByRole('tab', { name: /audit/i }));
    expect(await screen.findByTestId('stub-audit')).toBeInTheDocument();
  });

  // ── Deep-launch into a role-hidden tab still renders (no blank workbench) ────

  it('deep-launching into a role-hidden tab (clerk) still mounts the real tab, not a blank panel', async () => {
    // Simulate a role whose defaults hide clerk/treasury/audit. Removing the old
    // remap must not leave activeTab absent from the render loop; the active tab is
    // forced into the visible set so its panel still mounts.
    visibleTabsHolder.value = ['summary', 'forge', 'atlas', 'dossier'];
    renderWindow('clerk');
    expect(await screen.findByTestId('stub-clerk')).toBeInTheDocument();
    expect(screen.queryByTestId('stub-dossier')).not.toBeInTheDocument();
  });

  // ── Regression: the six always-real tabs still render their own components ───

  it.each([
    ['summary', 'stub-summary'],
    ['forge', 'stub-forge'],
    ['atlas', 'stub-atlas'],
    ['dais', 'stub-dais'],
    ['dossier', 'stub-dossier'],
    ['pilot', 'stub-pilot'],
  ])('launching with tabId=%s still renders its real component', async (tabId, testid) => {
    renderWindow(tabId);
    expect(await screen.findByTestId(testid)).toBeInTheDocument();
  });
});

/**
 * Window navigation/hosting boundary after reserved-office forward staging.
 * The window and role-visibility hook are real. Existing lazy-tab sentinels
 * isolate component selection; domain execution is covered by workflowScreens.
 * A reserved component must never mount, even when deep-launched or shown-all.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const ACTIVE_LABELS = ['Summary', 'Forge', 'Atlas', 'Dais', 'Dossier', 'Pilot'];
const RESERVED = ['clerk', 'treasury', 'audit'];

const { activateModuleMock, selectParcelMock, openWorkbenchWindowMock, authIdentity } = vi.hoisted(() => ({
  // Stable roles mirror the production hook: recreating them on every render loops effects.
  authIdentity: { roles: ['assessor'] },
  activateModuleMock: vi.fn(),
  selectParcelMock: vi.fn(),
  openWorkbenchWindowMock: vi.fn(),
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
  useAuthContext: () => ({ countyId: 'benton', userId: 'u-test', roles: authIdentity.roles }),
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

describe('PropertyWorkbenchWindow active/staged navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authIdentity.roles = ['assessor'];
  });

  const expectReservedUnmounted = () => {
    for (const office of RESERVED) {
      expect(screen.queryByRole('tab', { name: new RegExp(office, 'i') })).not.toBeInTheDocument();
      expect(screen.queryByTestId(`stub-${office}`)).not.toBeInTheDocument();
    }
  };

  it.each(RESERVED)('deep-launching %s shows unavailable, never an alias or reserved implementation', async office => {
    renderWindow(office);
    expect(await screen.findByText('Reserved office unavailable')).toBeInTheDocument();
    expectReservedUnmounted();
    for (const tab of ['summary', 'forge', 'atlas', 'dais', 'dossier', 'pilot']) {
      expect(screen.queryByTestId(`stub-${tab}`)).not.toBeInTheDocument();
    }
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(ACTIVE_LABELS);
  });

  it('keeps canonical six-tab order across selection and never offers staged offices', async () => {
    renderWindow('summary');
    await screen.findByTestId('stub-summary');
    for (const label of ACTIVE_LABELS) {
      fireEvent.click(screen.getByRole('tab', { name: label, exact: true }));
      expect(await screen.findByTestId(`stub-${label.toLowerCase()}`)).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: label, exact: true })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(ACTIVE_LABELS);
      expectReservedUnmounted();
    }
  });

  it.each(RESERVED)('show-all cannot resurrect a role-hidden %s deep launch', async office => {
    authIdentity.roles = ['residential_appraiser'];
    renderWindow(office);
    await screen.findByText('Reserved office unavailable');
    expect(screen.queryByRole('tab', { name: 'Dais', exact: true })).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle(/Show all tabs/));
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(ACTIVE_LABELS);
    expect(screen.getByText('Reserved office unavailable')).toBeInTheDocument();
    expectReservedUnmounted();
    fireEvent.click(screen.getByRole('tab', { name: 'Dossier', exact: true }));
    expect(await screen.findByTestId('stub-dossier')).toBeInTheDocument();
    expect(screen.queryByText('Reserved office unavailable')).not.toBeInTheDocument();
    expectReservedUnmounted();
  });

  it('persisted show-all still exposes only the canonical six active tabs', async () => {
    localStorage.setItem('tf_workbench_show_all_tabs', 'true');
    authIdentity.roles = ['residential_appraiser'];
    renderWindow('summary');
    await screen.findByTestId('stub-summary');
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(ACTIVE_LABELS);
    expectReservedUnmounted();
  });

  // Preserve all six pre-existing lazy-component mapping regressions.
  it('places a GIS role deep-launched Forge in canonical order, not after Pilot', async () => {
    authIdentity.roles = ['gis_technician'];
    renderWindow('forge');
    await screen.findByTestId('stub-forge');
    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Summary', 'Forge', 'Atlas', 'Dossier', 'Pilot']);
  });
  it.each([
    ['summary', 'stub-summary'],
    ['forge', 'stub-forge'],
    ['atlas', 'stub-atlas'],
    ['dais', 'stub-dais'],
    ['dossier', 'stub-dossier'],
    ['pilot', 'stub-pilot'],
  ])('launching with tabId=%s still selects its own component', async (tabId, testid) => {
    renderWindow(tabId);
    expect(await screen.findByTestId(testid)).toBeInTheDocument();
  });
});

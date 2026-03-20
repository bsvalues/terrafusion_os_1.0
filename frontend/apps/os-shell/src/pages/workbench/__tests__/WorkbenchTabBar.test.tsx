/**
 * WorkbenchTabBar.test.tsx
 *
 * Phase D: Workbench UX Contracts
 *
 * Tests the TabNavigation component within PropertyWorkbench:
 * - Tab order is constitutional and locked
 * - Click tab → URL updates → correct content renders
 * - Active tab has visual indicator
 * - Parcel context available to all tabs
 *
 * Government. Transcended.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { Suspense } from 'react';
import { MemoryRouter, Route, Routes, useOutletContext } from 'react-router-dom';

// ============================================================================
// Test Configuration - Constitutional Values
// ============================================================================

/**
 * LOCKED TAB ORDER - This is constitutional.
 * Any change requires governance review.
 */
const CONSTITUTIONAL_TAB_ORDER = [
  { id: 'summary', label: 'Summary', icon: '📊', path: '' },
  { id: 'forge', label: 'Forge', icon: '🔥', path: 'forge' },
  { id: 'atlas', label: 'Atlas', icon: '🗺️', path: 'atlas' },
  { id: 'dais', label: 'Dais', icon: '📋', path: 'dais' },
  { id: 'clerk', label: 'Clerk', icon: '📜', path: 'clerk' },
  { id: 'treasury', label: 'Treasury', icon: '💰', path: 'treasury' },
  { id: 'audit', label: 'Audit', icon: '🔍', path: 'audit' },
  { id: 'dossier', label: 'Dossier', icon: '📁', path: 'dossier' },
  { id: 'pilot', label: 'Pilot', icon: '🎮', path: 'pilot' },
];

// ============================================================================
// Mocks
// ============================================================================

// Mock tab components that reveal their parcel context
const MockTabWithContext: React.FC<{ tabName: string }> = ({ tabName }) => {
  const context = useOutletContext<{ parcelId: string }>();
  return (
    <div data-testid={`tab-content-${tabName}`}>
      <span data-testid='tab-name'>{tabName}</span>
      <span data-testid='parcel-context'>{context?.parcelId ?? 'NO_CONTEXT'}</span>
    </div>
  );
};

// Lazy-load mocks
vi.mock('../tabs/PropertySummary', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='summary' />,
}));

vi.mock('../tabs/PropertyForge', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='forge' />,
}));

vi.mock('../tabs/PropertyAtlas', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='atlas' />,
}));

vi.mock('../tabs/PropertyDais', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='dais' />,
}));

vi.mock('../tabs/PropertyDossier', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='dossier' />,
}));

vi.mock('../tabs/PropertyPilot', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='pilot' />,
}));

vi.mock('../tabs/PropertyClerk', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='clerk' />,
}));

vi.mock('../tabs/PropertyTreasury', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='treasury' />,
}));

vi.mock('../tabs/PropertyAudit', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='audit' />,
}));

// Mock ErrorBoundary
vi.mock('../../../components/errors/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock workbench chrome components (tested separately)
vi.mock('../../../components/workbench/ContextRibbon', () => ({
  ContextRibbon: ({ parcelId }: { parcelId: string }) => (
    <div data-testid="context-ribbon">{parcelId}</div>
  ),
}));

vi.mock('../../../components/workbench/SuiteCompass', () => ({
  SuiteCompass: () => <nav data-testid="suite-compass" />,
}));

vi.mock('../../../components/workbench/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

vi.mock('../../../services/badges', () => ({
  BADGE_PROVIDERS: [],
}));

vi.mock('../../../services/quickActions', () => ({
  QUICK_ACTION_PROVIDERS: [],
}));

vi.mock('../../../services/activityFeed', () => ({
  useParcelActivity: () => ({ entries: [], loading: false, error: null }),
}));

vi.mock('../../../hooks/usePropertyLookup', () => ({
  usePropertyLookup: () => ({ data: null, loading: false, error: null }),
}));

vi.mock('../../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn((selector: (s: any) => any) =>
    selector({
      activeParcel: null,
      activeParcelLoading: false,
      selectParcel: vi.fn(),
      clearParcel: vi.fn(),
      assessments: [],
      documents: [],
      appeals: [],
      taxStatements: [],
      recordings: [],
      auditTrail: [],
      operations: [],
      recentParcels: [],
    })
  ),
}));

vi.mock('../../../auth/useAuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    isAuthenticated: true,
    userId: 'u-test',
    countyId: 'benton',
    roles: ['EnterpriseAdmin'],
    token: null,
  })),
  toOsActor: vi.fn((auth: any) => ({
    userId: auth.userId ?? 'u-test',
    countyId: auth.countyId ?? 'benton',
    roles: auth.roles ?? [],
  })),
}));

vi.mock('../../../auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    userId: 'u-test',
    countyId: 'benton',
    roles: ['EnterpriseAdmin'],
    token: null,
  })),
}));

// Import after mocks
import PropertyWorkbench from '../PropertyWorkbench';
// Tab components are mocked above with vi.mock(); import them directly (not lazy)
// so the test's Suspense boundary never blocks on a cold-start dynamic import
// with fake timers active from setupTests.ts.
import MockPropertySummary from '../tabs/PropertySummary';
import MockPropertyForge from '../tabs/PropertyForge';
import MockPropertyAtlas from '../tabs/PropertyAtlas';
import MockPropertyDais from '../tabs/PropertyDais';
import MockPropertyClerk from '../tabs/PropertyClerk';
import MockPropertyTreasury from '../tabs/PropertyTreasury';
import MockPropertyAudit from '../tabs/PropertyAudit';
import MockPropertyDossier from '../tabs/PropertyDossier';
import MockPropertyPilot from '../tabs/PropertyPilot';

// ============================================================================
// Test Wrapper
// ============================================================================

const renderWorkbench = (initialRoute: string = '/property/12345-001') => {
  // Use mocked components directly (not lazy) to avoid Suspense hanging with
  // fake timers active from setupTests.ts. vi.mock() provides synchronous mocks.
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path='/property/:parcelId' element={<PropertyWorkbench />}>
            <Route index element={<MockPropertySummary />} />
            <Route path='forge' element={<MockPropertyForge />} />
            <Route path='atlas' element={<MockPropertyAtlas />} />
            <Route path='dais' element={<MockPropertyDais />} />
            <Route path='clerk' element={<MockPropertyClerk />} />
            <Route path='treasury' element={<MockPropertyTreasury />} />
            <Route path='audit' element={<MockPropertyAudit />} />
            <Route path='dossier' element={<MockPropertyDossier />} />
            <Route path='pilot' element={<MockPropertyPilot />} />
          </Route>
        </Routes>
      </Suspense>
    </MemoryRouter>
  );
};

// ============================================================================
// Tests
// ============================================================================

describe('WorkbenchTabBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tab Order Constitutional Invariants', () => {
    it('tab_order_is_locked_and_constitutional', async () => {
      renderWorkbench();

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
      });

      // Get all nav links
      const tabLinks = screen.getAllByRole('link');
      const tabLabels = tabLinks.map((link) =>
        link.textContent?.replace(/📊|🔥|🗺️|📋|📜|💰|🔍|📁|🎮/g, '').trim()
      );

      // Verify order matches constitutional order
      CONSTITUTIONAL_TAB_ORDER.forEach((tab, index) => {
        expect(tabLabels[index]).toBe(tab.label);
      });
    });

    it('all_nine_tabs_present_in_navigation', async () => {
      renderWorkbench();

      await waitFor(() => {
        CONSTITUTIONAL_TAB_ORDER.forEach(({ label }) => {
          expect(screen.getByText(label)).toBeInTheDocument();
        });
      });
    });

    it('tab_icons_match_constitutional_spec', async () => {
      renderWorkbench();

      await waitFor(() => {
        CONSTITUTIONAL_TAB_ORDER.forEach(({ icon }) => {
          expect(screen.getByText(icon)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Tab Navigation', () => {
    it('clicking_forge_tab_renders_forge_content', async () => {
      renderWorkbench();

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
      });

      // Click Forge tab
      fireEvent.click(screen.getByText('Forge'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-forge')).toBeInTheDocument();
        expect(screen.getByTestId('tab-name')).toHaveTextContent('forge');
      });
    });

    it('clicking_atlas_tab_renders_atlas_content', async () => {
      renderWorkbench();

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Atlas'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-atlas')).toBeInTheDocument();
      });
    });

    it('clicking_dais_tab_renders_dais_content', async () => {
      renderWorkbench();

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Dais'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-dais')).toBeInTheDocument();
      });
    });

    it('clicking_dossier_tab_renders_dossier_content', async () => {
      renderWorkbench();

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Dossier'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-dossier')).toBeInTheDocument();
      });
    });

    it('clicking_pilot_tab_renders_pilot_content', async () => {
      renderWorkbench();

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Pilot'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-pilot')).toBeInTheDocument();
      });
    });

    it('clicking_clerk_tab_renders_clerk_content', async () => {
      renderWorkbench();

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Clerk'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-clerk')).toBeInTheDocument();
      });
    });

    it('clicking_treasury_tab_renders_treasury_content', async () => {
      renderWorkbench();

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Treasury'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-treasury')).toBeInTheDocument();
      });
    });

    it('clicking_audit_tab_renders_audit_content', async () => {
      renderWorkbench();

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Audit'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-audit')).toBeInTheDocument();
      });
    });

    it('default_route_renders_summary_tab', async () => {
      renderWorkbench('/property/12345-001');

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-summary')).toBeInTheDocument();
      });
    });

    it('direct_url_to_tab_renders_correct_content', async () => {
      renderWorkbench('/property/12345-001/atlas');

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-atlas')).toBeInTheDocument();
      });
    });
  });

  describe('Parcel Context Propagation', () => {
    it('parcel_context_available_to_summary_tab', async () => {
      renderWorkbench('/property/99999-TEST');

      await waitFor(() => {
        expect(screen.getByTestId('parcel-context')).toHaveTextContent('99999-TEST');
      });
    });

    it('parcel_context_preserved_when_switching_tabs', async () => {
      renderWorkbench('/property/PARCEL-PERSIST');

      await waitFor(() => {
        expect(screen.getByTestId('parcel-context')).toHaveTextContent('PARCEL-PERSIST');
      });

      // Switch to Forge
      fireEvent.click(screen.getByText('Forge'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-forge')).toBeInTheDocument();
        expect(screen.getByTestId('parcel-context')).toHaveTextContent('PARCEL-PERSIST');
      });

      // Switch to Atlas
      fireEvent.click(screen.getByText('Atlas'));

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-atlas')).toBeInTheDocument();
        expect(screen.getByTestId('parcel-context')).toHaveTextContent('PARCEL-PERSIST');
      });
    });

    it('all_tabs_receive_parcel_context', async () => {
      const testParcelId = 'CTX-ALL-TABS';

      for (const tab of CONSTITUTIONAL_TAB_ORDER) {
        const route = tab.path
          ? `/property/${testParcelId}/${tab.path}`
          : `/property/${testParcelId}`;

        const { unmount } = renderWorkbench(route);

        await waitFor(() => {
          expect(screen.getByTestId('parcel-context')).toHaveTextContent(testParcelId);
        });

        unmount();
      }
    });
  });

  describe('Context Ribbon', () => {
    it('displays_parcel_id_in_context_ribbon', async () => {
      renderWorkbench('/property/HEADER-TEST');

      await waitFor(() => {
        const ribbon = screen.getByTestId('context-ribbon');
        expect(ribbon).toBeInTheDocument();
        expect(ribbon).toHaveTextContent('HEADER-TEST');
      });
    });

    it('suite_compass_is_present', async () => {
      renderWorkbench();

      await waitFor(() => {
        expect(screen.getByTestId('suite-compass')).toBeInTheDocument();
      });
    });
  });

  describe('No Parcel Error State', () => {
    it('shows_error_when_no_parcel_id', async () => {
      render(
        <MemoryRouter initialEntries={['/property/']}>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path='/property/' element={<PropertyWorkbench />} />
            </Routes>
          </Suspense>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No Parcel Selected/i)).toBeInTheDocument();
      });
    });
  });
});

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

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { Suspense, lazy } from 'react';
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
jest.mock('../tabs/PropertySummary', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='summary' />,
}));

jest.mock('../tabs/PropertyForge', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='forge' />,
}));

jest.mock('../tabs/PropertyAtlas', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='atlas' />,
}));

jest.mock('../tabs/PropertyDais', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='dais' />,
}));

jest.mock('../tabs/PropertyDossier', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='dossier' />,
}));

jest.mock('../tabs/PropertyPilot', () => ({
  __esModule: true,
  default: () => <MockTabWithContext tabName='pilot' />,
}));

// Mock ErrorBoundary
jest.mock('../../../components/errors/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock workbench chrome components (tested separately)
jest.mock('../../../components/workbench/ContextRibbon', () => ({
  ContextRibbon: ({ parcelId }: { parcelId: string }) => (
    <div data-testid="context-ribbon">{parcelId}</div>
  ),
}));

jest.mock('../../../components/workbench/SuiteCompass', () => ({
  SuiteCompass: () => <nav data-testid="suite-compass" />,
}));

jest.mock('../../../components/workbench/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed" />,
}));

jest.mock('../../../services/badges', () => ({
  BADGE_PROVIDERS: [],
}));

jest.mock('../../../services/activityFeed', () => ({
  useParcelActivity: () => ({ entries: [], loading: false, error: null }),
}));

jest.mock('../../../hooks/usePropertyLookup', () => ({
  usePropertyLookup: () => ({ data: null, loading: false, error: null }),
}));

// Import after mocks
import PropertyWorkbench from '../PropertyWorkbench';

// ============================================================================
// Test Wrapper
// ============================================================================

const renderWorkbench = (initialRoute: string = '/property/12345-001') => {
  const PropertySummary = lazy(() => import('../tabs/PropertySummary'));
  const PropertyForge = lazy(() => import('../tabs/PropertyForge'));
  const PropertyAtlas = lazy(() => import('../tabs/PropertyAtlas'));
  const PropertyDais = lazy(() => import('../tabs/PropertyDais'));
  const PropertyDossier = lazy(() => import('../tabs/PropertyDossier'));
  const PropertyPilot = lazy(() => import('../tabs/PropertyPilot'));

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path='/property/:parcelId' element={<PropertyWorkbench />}>
            <Route index element={<PropertySummary />} />
            <Route path='forge' element={<PropertyForge />} />
            <Route path='atlas' element={<PropertyAtlas />} />
            <Route path='dais' element={<PropertyDais />} />
            <Route path='dossier' element={<PropertyDossier />} />
            <Route path='pilot' element={<PropertyPilot />} />
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
    jest.clearAllMocks();
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
        link.textContent?.replace(/[📊🔥🗺️📋📁🎮]/g, '').trim()
      );

      // Verify order matches constitutional order
      CONSTITUTIONAL_TAB_ORDER.forEach((tab, index) => {
        expect(tabLabels[index]).toBe(tab.label);
      });
    });

    it('all_six_tabs_present_in_navigation', async () => {
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

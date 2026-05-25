/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 23 TASK 5: WORKBENCH REAL HOSTING GATE
 *
 * Validates that workbench tabs host real interactive surfaces,
 * NOT placeholders. Each Primary tab (Forge, Atlas, Dais) MUST render
 * a real component with interactive elements.
 *
 * Gate hierarchy:
 *   PRIMARY (MUST PASS):  Forge, Atlas, Dais
 *   SECONDARY (SHOULD):   Dossier, Pilot, Trace
 *   REGISTRY (INVENTORY): seven canonical Workbench tabs
 *   WORKBENCH-LEVEL:      7 tab IDs, restorable window size
 * ======================================================================
 */

import '@testing-library/jest-dom';
import React, { Suspense } from 'react';
import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mocks — pilotApi (all tab components that invoke tools)
// ---------------------------------------------------------------------------

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn().mockResolvedValue({ success: true, data: {} }),
  listPilotTools: vi.fn().mockResolvedValue({ count: 0, tools: [] }),
  filterMuseReadOnlyTools: (tools: unknown[]) => tools,
}));

// ---------------------------------------------------------------------------
// Mocks — stores
// ---------------------------------------------------------------------------

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: any) => {
    const state = {
      activeParcel: {
        parcelId: 'GATE-TEST-001',
        address: '100 Gate Test Ave',
        ownerName: 'Gate Tester',
        totalAssessedValue: 250000,
        marketValue: 260000,
        landValue: 80000,
        improvementValue: 170000,
        propertyType: 'Residential',
        legalDescription: 'LOT 1 BLK 1',
        dataSource: 'fixture',
      },
      activeParcelLoading: false,
      selectParcel: vi.fn(),
      // Dais reads appeals from store
      appeals: [],
      // Dossier reads documents from store
      documents: [],
      // Pilot reads operations from store
      operations: [],
    };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

// ---------------------------------------------------------------------------
// Mocks — runtime env
// ---------------------------------------------------------------------------

vi.mock('../../runtime/env', () => ({
  getEnv: () => ({
    VITE_API_URL: 'http://localhost:5000',
    VITE_PILOT_API_URL: 'http://localhost:5000/api/pilot',
  }),
}));

// ---------------------------------------------------------------------------
// Mocks — hooks that call APIs
// ---------------------------------------------------------------------------

vi.mock('../../hooks/useToolInvocation', () => ({
  useToolInvocation: () => ({
    invoke: vi.fn(),
    state: { status: 'idle', result: null, error: null },
    confirmationPending: null,
    confirm: vi.fn(),
    cancel: vi.fn(),
  }),
}));

vi.mock('../../hooks/usePilotTraceList', () => ({
  usePilotTraceList: () => ({ phase: 'ready', events: [], error: null, refresh: vi.fn() }),
}));

vi.mock('../../hooks/useEvidenceSnapshot', () => ({
  useEvidenceSnapshot: () => ({
    snapshot: null,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('../../hooks/useDossierDetails', () => ({
  useDossierDetails: () => ({
    details: null,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('../../services/dossierService', () => ({
  dossierService: {
    getDocuments: vi.fn().mockResolvedValue([]),
    getEvidence: vi.fn().mockResolvedValue([]),
    getChain: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({}),
  },
}));

// ---------------------------------------------------------------------------
// Mocks — Dais sub-panels (avoid deep dependency trees)
// ---------------------------------------------------------------------------

vi.mock('../../components/dais/AppealDeadlinePanel', () => ({
  default: () => <div data-testid="mock-appeal-deadline">AppealDeadlinePanel</div>,
}));

vi.mock('../../components/dais/AppealHearingPanel', () => ({
  default: () => <div data-testid="mock-appeal-hearing">AppealHearingPanel</div>,
}));

vi.mock('../../components/dais/AppealNoticePanel', () => ({
  default: () => <div data-testid="mock-appeal-notice">AppealNoticePanel</div>,
}));

vi.mock('../../components/dais/AppealCertificationPanel', () => ({
  default: () => <div data-testid="mock-appeal-cert">AppealCertificationPanel</div>,
}));

// ---------------------------------------------------------------------------
// Mocks — Dossier sub-panels
// ---------------------------------------------------------------------------

vi.mock('../../components/dossier/ParcelEvidencePacket', () => ({
  default: () => <div data-testid="mock-evidence-packet">ParcelEvidencePacket</div>,
}));

vi.mock('../../components/dossier/PacketNarrativeEditor', () => ({
  default: () => <div data-testid="mock-narrative-editor">PacketNarrativeEditor</div>,
}));

vi.mock('../../components/dossier/PacketFinalizationPanel', () => ({
  default: () => <div data-testid="mock-finalization">PacketFinalizationPanel</div>,
}));

vi.mock('../../components/dossier/PacketAppealHandoffPanel', () => ({
  default: () => <div data-testid="mock-appeal-handoff">PacketAppealHandoffPanel</div>,
}));

// ---------------------------------------------------------------------------
// Mocks — Pilot sub-components
// ---------------------------------------------------------------------------

vi.mock('../../components/pilot/ExecutionConsole', () => ({
  ExecutionConsole: () => <div data-testid="mock-execution-console">ExecutionConsole</div>,
}));

vi.mock('../../components/pilot/EvidenceRail', () => ({
  EvidenceRail: () => <div data-testid="mock-evidence-rail">EvidenceRail</div>,
}));

// ---------------------------------------------------------------------------
// Mocks — Forge sub-tabs
// ---------------------------------------------------------------------------

vi.mock('../../pages/workbench/tabs/forge/ForgeOverview', () => ({
  ForgeOverview: (props: any) => <div data-testid="forge-overview">ForgeOverview</div>,
}));

vi.mock('../../pages/workbench/tabs/forge/CostApproach', () => ({
  CostApproach: (props: any) => <div data-testid="forge-cost">CostApproach</div>,
}));

vi.mock('../../pages/workbench/tabs/forge/SalesComparison', () => ({
  SalesComparison: (props: any) => <div data-testid="forge-sales">SalesComparison</div>,
}));

vi.mock('../../pages/workbench/tabs/forge/IncomeApproach', () => ({
  IncomeApproach: (props: any) => <div data-testid="forge-income">IncomeApproach</div>,
}));

vi.mock('../../pages/workbench/tabs/forge/Reconciliation', () => ({
  Reconciliation: (props: any) => <div data-testid="forge-reconciliation">Reconciliation</div>,
}));

vi.mock('../../pages/workbench/tabs/forge/types', () => ({
  CURRENT_YEAR: 2026,
  TAX_YEARS: [2026, 2025, 2024],
}));

// ---------------------------------------------------------------------------
// Mocks — shared workbench components
// ---------------------------------------------------------------------------

vi.mock('../../components/workbench', () => ({
  ParcelContextHeader: ({ parcelId }: any) => (
    <div data-testid="parcel-context-header">{parcelId}</div>
  ),
  InvocationHistory: () => <div data-testid="invocation-history" />,
  EvidenceSnapshotPanel: () => <div data-testid="evidence-snapshot-panel" />,
  // WorkbenchSourceBadge added in Round A honesty pass — mock must include it
  WorkbenchSourceBadge: ({ source }: any) => (
    <span data-testid="workbench-source-badge" data-source={source} />
  ),
}));

vi.mock('../../components/errors/ErrorDisplay', () => ({
  ErrorDisplay: () => <div data-testid="error-display" />,
}));

// ---------------------------------------------------------------------------
// Mocks — UI materials (BentoGrid/BentoCard)
// ---------------------------------------------------------------------------

vi.mock('../../ui/materials/BentoGrid', () => ({
  BentoGrid: ({ children }: any) => <div data-testid="bento-grid">{children}</div>,
}));

vi.mock('../../ui/materials/BentoCard', () => ({
  BentoCard: ({ children, title, ...props }: any) => (
    <div data-testid="bento-card" data-title={title}>{children}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Helper: Wraps a component in MemoryRouter + Outlet context (parcel context)
// ---------------------------------------------------------------------------

function TabTestWrapper({ children, tabSlug }: { children: React.ReactNode; tabSlug: string }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
    <MemoryRouter initialEntries={[`/property/GATE-TEST-001/${tabSlug}`]}>
      <Routes>
        <Route
          path="/property/:parcelId"
          element={
            <div>
              <Outlet
                context={{
                  parcelId: 'GATE-TEST-001',
                  propertyData: {
                    parcelId: 'GATE-TEST-001',
                    address: '100 Gate Test Ave',
                    owner: 'Gate Tester',
                    assessedValue: 250000,
                    marketValue: 260000,
                    landValue: 80000,
                    improvementValue: 170000,
                    propertyType: 'Residential',
                    legalDescription: 'LOT 1 BLK 1',
                    source: 'fixture',
                  },
                  workMode: 'overview',
                }}
              />
            </div>
          }
        >
          <Route path={tabSlug} element={children} />
        </Route>
      </Routes>
    </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Lazy imports — mirrors PropertyWorkbenchWindow's lazy loading
// ---------------------------------------------------------------------------

const LazyForge = React.lazy(() =>
  import('../../pages/workbench/tabs/PropertyForge').then((m) => ({ default: m.PropertyForge }))
);
const LazyAtlas = React.lazy(() =>
  import('../../pages/workbench/tabs/PropertyAtlas').then((m) => ({ default: m.PropertyAtlas }))
);
const LazyDais = React.lazy(() => import('../../pages/workbench/tabs/PropertyDais'));
const LazyDossier = React.lazy(() =>
  import('../../pages/workbench/tabs/PropertyDossier').then((m) => ({ default: m.PropertyDossier }))
);
const LazyPilot = React.lazy(() =>
  import('../../pages/workbench/tabs/PropertyPilot').then((m) => ({ default: m.PropertyPilot }))
);
const LazyTrace = React.lazy(() =>
  import('../../pages/workbench/tabs/PropertyTrace').then((m) => ({ default: m.PropertyTrace }))
);

// =========================================================================
// PRIMARY GATE — MUST PASS: Forge, Atlas, Dais
// =========================================================================

describe('Workbench Real Hosting Gate', () => {
  beforeAll(async () => {
    // Sequentialise — parallel dynamic imports of the five tabs racing
    // each other has timed out under sweep load (default 15s hook
    // timeout). Bump the hook timeout to 90s and import one at a time
    // so the worker can resolve each lazy graph before starting the next.
    await import('../../pages/workbench/tabs/PropertyForge');
    await import('../../pages/workbench/tabs/PropertyAtlas');
    await import('../../pages/workbench/tabs/PropertyDais');
    await import('../../pages/workbench/tabs/PropertyDossier');
    await import('../../pages/workbench/tabs/PropertyPilot');
    await import('../../pages/workbench/tabs/PropertyTrace');
  }, 90000);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PRIMARY GATE — Forge', () => {
    it('renders a real surface, not a PlaceholderModule', async () => {
      render(
        <TabTestWrapper tabSlug="forge">
          <Suspense fallback={<div>Loading...</div>}>
            <LazyForge />
          </Suspense>
        </TabTestWrapper>
      );

      // PropertyForge has the heaviest lazy graph in the workbench — give
      // the Suspense resolve a generous budget so saturated workers don't
      // race the default 1s waitFor budget under sweep load.
      await waitFor(
        () => {
          expect(screen.getByTestId('property-forge-tab')).toBeInTheDocument();
        },
        { timeout: 25000 },
      );

      // Must NOT be a placeholder
      expect(screen.queryByTestId('placeholder-module')).not.toBeInTheDocument();
    }, 35000);

    it('contains at least one interactive element', async () => {
      render(
        <TabTestWrapper tabSlug="forge">
          <Suspense fallback={<div>Loading...</div>}>
            <LazyForge />
          </Suspense>
        </TabTestWrapper>
      );

      await waitFor(
        () => {
          expect(screen.getByTestId('property-forge-tab')).toBeInTheDocument();
        },
        { timeout: 25000 },
      );

      // Forge has sub-tab buttons (role="tab") + a Tax Year select
      const interactiveElements = [
        ...screen.queryAllByRole('tab'),
        ...screen.queryAllByRole('button'),
        ...document.querySelectorAll('select, input'),
      ];
      expect(interactiveElements.length).toBeGreaterThanOrEqual(1);
    }, 35000);
  });

  describe('PRIMARY GATE — Atlas', () => {
    it('renders a real surface, not a PlaceholderModule', async () => {
      render(
        <TabTestWrapper tabSlug="atlas">
          <Suspense fallback={<div>Loading...</div>}>
            <LazyAtlas />
          </Suspense>
        </TabTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('property-atlas-tab')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('placeholder-module')).not.toBeInTheDocument();
    });

    it('contains at least one interactive element', async () => {
      render(
        <TabTestWrapper tabSlug="atlas">
          <Suspense fallback={<div>Loading...</div>}>
            <LazyAtlas />
          </Suspense>
        </TabTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('property-atlas-tab')).toBeInTheDocument();
      });

      // Atlas has layer toggle buttons
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PRIMARY GATE — Dais', () => {
    it('renders a real surface, not a PlaceholderModule', async () => {
      render(
        <TabTestWrapper tabSlug="dais">
          <Suspense fallback={<div>Loading...</div>}>
            <LazyDais />
          </Suspense>
        </TabTestWrapper>
      );

      expect(
        await screen.findByTestId('property-dais-tab', {}, { timeout: 5000 })
      ).toBeInTheDocument();

      expect(screen.queryByTestId('placeholder-module')).not.toBeInTheDocument();
    });

    it('contains at least one interactive element (button, select, or input)', async () => {
      render(
        <TabTestWrapper tabSlug="dais">
          <Suspense fallback={<div>Loading...</div>}>
            <LazyDais />
          </Suspense>
        </TabTestWrapper>
      );

      expect(
        await screen.findByTestId('property-dais-tab', {}, { timeout: 5000 })
      ).toBeInTheDocument();

      // Dais has workflow type select + check status button + inputs
      const interactiveElements = [
        ...screen.queryAllByRole('button'),
        ...screen.queryAllByRole('combobox'),
        ...screen.queryAllByRole('textbox'),
        ...document.querySelectorAll('select, input'),
      ];
      expect(interactiveElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // SECONDARY — SHOULD PASS: Dossier, Pilot
  // =========================================================================

  describe('SECONDARY — Dossier', () => {
    it('renders a real surface, not a PlaceholderModule', async () => {
      render(
        <TabTestWrapper tabSlug="dossier">
          <Suspense fallback={<div>Loading...</div>}>
            <LazyDossier />
          </Suspense>
        </TabTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('parcel-context-header')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('placeholder-module')).not.toBeInTheDocument();
    });

    it('contains at least one interactive element', async () => {
      render(
        <TabTestWrapper tabSlug="dossier">
          <Suspense fallback={<div>Loading...</div>}>
            <LazyDossier />
          </Suspense>
        </TabTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('parcel-context-header')).toBeInTheDocument();
      });

      const interactiveElements = [
        ...screen.queryAllByRole('button'),
        ...screen.queryAllByRole('combobox'),
        ...screen.queryAllByRole('textbox'),
        ...document.querySelectorAll('select, input'),
      ];
      expect(interactiveElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SECONDARY — Pilot', () => {
    it('renders a real surface, not a PlaceholderModule', async () => {
      render(
        <TabTestWrapper tabSlug="pilot">
          <Suspense fallback={<div>Loading...</div>}>
            <LazyPilot />
          </Suspense>
        </TabTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('parcel-context-header')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('placeholder-module')).not.toBeInTheDocument();
    });
  });

  describe('SECONDARY — Trace', () => {
    it('renders a real surface, not a PlaceholderModule', async () => {
      render(
        <TabTestWrapper tabSlug="trace">
          <Suspense fallback={<div>Loading...</div>}>
            <LazyTrace />
          </Suspense>
        </TabTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('TerraTrace')).toBeInTheDocument();
      });

      expect(screen.getByTestId('mock-evidence-rail')).toBeInTheDocument();
      expect(screen.queryByTestId('placeholder-module')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // REGISTRY ASSERTIONS — canonical Workbench tabs only
  // =========================================================================

  describe('REGISTRY — tab ID inventory', () => {
    it('includes linked county office and OS support surfaces', async () => {
      const { VALID_WORKBENCH_TAB_IDS } = await import('../../config/suiteRegistry');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('clerk');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('treasury');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('audit');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('pilot');
      expect(VALID_WORKBENCH_TAB_IDS).toContain('trace');
    });
  });

  // =========================================================================
  // WORKBENCH-LEVEL — registry completeness + window sizing
  // =========================================================================

  describe('WORKBENCH-LEVEL', () => {
    it('VALID_WORKBENCH_TAB_IDS has exactly 11 entries', async () => {
      const { VALID_WORKBENCH_TAB_IDS } = await import('../../config/suiteRegistry');
      expect(VALID_WORKBENCH_TAB_IDS).toHaveLength(11);
    });

    it('VALID_WORKBENCH_TAB_IDS contains the 11 canonical tabs in order', async () => {
      const { VALID_WORKBENCH_TAB_IDS } = await import('../../config/suiteRegistry');
      const expected = ['summary', 'forge', 'atlas', 'dais', 'dossier', 'clerk', 'treasury', 'audit', 'pilot', 'trace', 'current-use'];
      expect(VALID_WORKBENCH_TAB_IDS).toEqual(expected);
    });

    it('getModuleWindowSize("property-workbench") returns a restorable priority window', async () => {
      const { getModuleWindowSize } = await import('../../stores/desktopStore');
      const result = getModuleWindowSize('property-workbench');
      expect(result.maximized).toBe(false);
      expect(result.size.width).toBeGreaterThan(0);
      expect(result.size.height).toBeGreaterThan(0);
    });
  });
});

/**
 * AssessorValuationJourney.contract.test.tsx
 *
 * Phase 14 — Operator Journey Proofing
 * =====================================
 *
 * Proves the valuation leg of the assessor journey is structurally intact:
 *
 *   Leg 1: PropertyForge tab mounts at /property/:parcelId/forge
 *   Leg 2: Sales sub-tab is discoverable (role=tab, label ~Sales)
 *   Leg 3: Income sub-tab is discoverable (role=tab, label ~Income)
 *
 * Does NOT render ComparableSalesPanel or IncomeValuationPanel internals —
 * those panels have heavy service dependencies. This contract verifies the
 * Forge tab shell and its sub-tab navigation surface.
 *
 * @see pages/workbench/tabs/PropertyForge.tsx — data-testid="property-forge-tab"
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Mock: auth context ──────────────────────────────────────────────────────

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    isAuthenticated: true,
    userId: 'benton-assessor-test',
    countyId: 'benton',
    roles: ['assessor'],
    token: null,
  })),
  useAuthContextOptional: vi.fn(() => null),
}));

// ── Mock: session ───────────────────────────────────────────────────────────

vi.mock('../../auth/useSession', () => ({
  useSession: vi.fn(() => ({
    userId: 'benton-assessor-test',
    countyId: 'benton',
    role: 'assessor',
    mode: 'pilot',
  })),
}));

// ── Mock: pilotApi (services path) ─────────────────────────────────────────

vi.mock('../../services/pilotApi', () => ({
  explain: vi.fn().mockResolvedValue({
    explanation: 'Mock explanation',
    sources: [],
    confidence: 0.9,
    traceId: 'test-trace',
  }),
}));

// ── Mock: pilotApi (api path) ───────────────────────────────────────────────

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn().mockResolvedValue({ result: null }),
}));

// ── Mock: comparableSalesService ────────────────────────────────────────────

vi.mock('../../services/comparableSalesService', () => ({
  loadBentonComps: vi.fn().mockResolvedValue([]),
  filterComps: vi.fn((comps: unknown[]) => comps),
  reconcileValue: vi.fn().mockResolvedValue({ reconciledValue: 285000, confidence: 'HIGH' }),
}));

// ── Mock: incomeValuationService ────────────────────────────────────────────

vi.mock('../../services/incomeValuationService', () => ({
  calculateNoi: vi.fn().mockReturnValue(0),
  calculateIncomeValuation: vi.fn().mockReturnValue({
    incomeValue: 285000,
    capRate: 0.07,
    noi: 20000,
    riskClassification: 'low',
  }),
  saveIncomeValuationRecord: vi.fn().mockResolvedValue(undefined),
}));

// ── Mock: useForgeValuation (avoids QueryClientProvider requirement) ─────────

vi.mock('../../hooks/forge/useForgeValuation', () => ({
  useCostApproach: vi.fn(() => ({ status: 'idle', data: null, error: null, refetch: vi.fn() })),
  useSalesComparison: vi.fn(() => ({ status: 'idle', data: null, error: null, refetch: vi.fn() })),
  useIncomeApproach: vi.fn(() => ({ status: 'idle', data: null, error: null, refetch: vi.fn() })),
  useReconciliation: vi.fn(() => ({ status: 'idle', data: null, error: null, refetch: vi.fn() })),
}));

// ── Mock: lucide-react ──────────────────────────────────────────────────────

vi.mock('lucide-react', () => {
  const Icon = (props: Record<string, unknown>) => React.createElement('svg', { 'data-slot': 'icon', ...props });
  return new Proxy({}, { get: () => Icon });
});

// ── Mock: dataProvider ─────────────────────────────────────────────────────

vi.mock('../../services/dataProvider', () => ({
  dataProvider: {
    getProperties: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    getProperty: vi.fn().mockResolvedValue(null),
  },
  resetDataProvider: vi.fn(),
  initDataProvider: vi.fn(),
  getDataProvider: vi.fn(() => ({
    getProperties: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    getProperty: vi.fn().mockResolvedValue(null),
  })),
}));

// ── Mock: propertyStore ─────────────────────────────────────────────────────

const MOCK_PROPERTY_STORE_STATE = {
  activeParcel: null,
  assessments: [],
  documents: [],
  appeals: [],
  taxStatements: [],
  recordings: [],
  auditLog: [],
  recentParcels: [],
  searchResults: null,
  isLoading: false,
  error: null,
  selectParcel: vi.fn(),
  clearParcel: vi.fn(),
  searchParcels: vi.fn(),
};

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn((selector?: (s: typeof MOCK_PROPERTY_STORE_STATE) => unknown) => {
    if (typeof selector === 'function') {
      return selector(MOCK_PROPERTY_STORE_STATE);
    }
    return MOCK_PROPERTY_STORE_STATE;
  }),
}));

// ── Mock: runtime/env ──────────────────────────────────────────────────────

vi.mock('../../runtime/env', () => ({
  getEnv: vi.fn(() => ({
    API_BASE_URL: 'http://localhost:5000',
    PILOT_MODE: 'true',
  })),
}));

// ── Mock: BentoGrid + BentoCard ────────────────────────────────────────────

vi.mock('../../ui/materials/BentoGrid', () => ({
  BentoGrid: ({ children }: { children?: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'bento-grid' }, children),
}));

vi.mock('../../ui/materials/BentoCard', () => ({
  BentoCard: ({ children, title }: { children?: React.ReactNode; title?: string }) =>
    React.createElement('div', { 'data-testid': 'bento-card', 'data-title': title }, children),
}));

// ── Mock: ComparableSalesPanel ─────────────────────────────────────────────

vi.mock('../../components/workbench/ComparableSalesPanel', () => ({
  ComparableSalesPanel: () =>
    React.createElement('div', { 'data-testid': 'mock-comparable-sales-panel' }, 'ComparableSalesPanel'),
}));

// ── Mock: IncomeValuationPanel ─────────────────────────────────────────────

vi.mock('../../components/workbench/IncomeValuationPanel', () => ({
  IncomeValuationPanel: () =>
    React.createElement('div', { 'data-testid': 'mock-income-valuation-panel' }, 'IncomeValuationPanel'),
}));

// ── Mock: errors/ErrorDisplay ──────────────────────────────────────────────

vi.mock('../../components/errors/ErrorDisplay', () => ({
  ErrorDisplay: ({ message }: { message?: string }) =>
    React.createElement('div', { 'data-testid': 'mock-error-display' }, message ?? 'Error'),
}));

// ── Mock: useErrorHandler ──────────────────────────────────────────────────

vi.mock('../../hooks/useErrorHandler', () => ({
  useErrorHandler: vi.fn(() => ({
    error: null,
    handleError: vi.fn(),
    clearError: vi.fn(),
  })),
}));

// ── Mock: workbenchTabContext — provides parcelId via context ──────────────

vi.mock('../../context/workbenchTabContext', () => {
  const WorkbenchTabCtx = {
    Provider: ({ children, value }: { children: React.ReactNode; value: unknown }) =>
      React.createElement(React.Fragment, null, children),
    _currentValue: null,
  };

  return {
    WorkbenchTabCtx,
    useWorkbenchTab: vi.fn(() => ({
      parcelId: PARCEL_ID,
      propertyData: {
        parcelId: PARCEL_ID,
        address: '123 Test St, Kennewick, WA',
        owner: 'Test Owner',
        assessedValue: 285000,
        marketValue: 295000,
        landValue: 85000,
        improvementValue: 200000,
        propertyType: 'Residential',
        legalDescription: 'LOT 1 BLK 1 TEST PLAT',
        source: 'benton-pacs',
      },
      workMode: 'assess' as const,
    })),
  };
});

// ── Import subject after mocks ──────────────────────────────────────────────

const PARCEL_ID = '1-0001-010-0010-000';

import PropertyForge from '../../pages/workbench/tabs/PropertyForge';

// ── Helpers ─────────────────────────────────────────────────────────────────

function renderForge() {
  return render(
    <MemoryRouter initialEntries={[`/property/${PARCEL_ID}/forge`]}>
      <Routes>
        <Route path="/property/:parcelId/forge" element={<PropertyForge />} />
      </Routes>
    </MemoryRouter>
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

afterEach(() => cleanup());

describe('Leg 1 — PropertyForge tab mounts', () => {
  it('renders the forge tab root without crashing', () => {
    renderForge();
    expect(document.querySelector('[data-testid="property-forge-tab"]')).not.toBeNull();
  });

  it('renders a tablist with aria-label "Forge approach tabs"', () => {
    renderForge();
    const tablist = screen.getByRole('tablist', { name: /forge approach tabs/i });
    expect(tablist).toBeTruthy();
  });
});

describe('Leg 2 — Sales sub-tab is discoverable', () => {
  it('has a tab with label matching /sales/i', () => {
    renderForge();
    const tabs = screen.getAllByRole('tab');
    const salesTab = tabs.find(t => /sales/i.test(t.textContent ?? ''));
    expect(salesTab).toBeDefined();
  });
});

describe('Leg 3 — Income sub-tab is discoverable', () => {
  it('has a tab with label matching /income/i', () => {
    renderForge();
    const tabs = screen.getAllByRole('tab');
    const incomeTab = tabs.find(t => /income/i.test(t.textContent ?? ''));
    expect(incomeTab).toBeDefined();
  });
});

/**
 * Comparable Sales Forge host proof
 *
 * Verifies the real Sales sub-tab renders inside Forge, supports launch hints,
 * and the comparable sales service boundary handles both success and failure.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';

import PropertyForge from '../../pages/workbench/tabs/PropertyForge';
import { ComparableSalesPanel } from '../../components/workbench/ComparableSalesPanel';
import {
  adjustComp,
  filterComps,
  findCompsForSubject,
  reconcileComps,
  type ComparableSale,
  type SubjectProperty,
} from '../../services/comparableSalesService';
import { invokeTool } from '../../api/pilotApi';

const mockInvokeTool = vi.mocked(invokeTool);

type MockParcel = {
  parcelId: string;
  address: string;
  buildingSquareFeet: number;
  landAcreage: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  totalAssessedValue: number;
  ownerName?: string;
};

const storeState: { activeParcel: MockParcel | null } = {
  activeParcel: null,
};

vi.mock('../../api/pilotApi', () => ({
  invokeTool: vi.fn(),
  listPilotTools: vi.fn(),
  filterMuseReadOnlyTools: (tools: unknown[]) => tools,
}));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: unknown) => {
    const state = {
      activeParcel: storeState.activeParcel,
      activeParcelLoading: false,
      selectParcel: vi.fn(),
      appeals: [],
      documents: [],
      operations: [],
    };

    return typeof selector === 'function' ? selector(state) : state;
  },
}));

vi.mock('../../components/workbench', () => ({
  ParcelContextHeader: ({ parcelId }: { parcelId: string }) => (
    <div data-testid="parcel-context-header">{parcelId}</div>
  ),
  InvocationHistory: () => <div data-testid="invocation-history" />,
  EvidenceSnapshotPanel: () => <div data-testid="evidence-snapshot-panel" />,
}));

vi.mock('../../ui/materials/BentoCard', () => ({
  BentoCard: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <section data-testid="bento-card" aria-label={title}>
      {children}
    </section>
  ),
}));

vi.mock('../../components/errors/ErrorDisplay', () => ({
  ErrorDisplay: ({ error }: { error: { message: string; errorCode?: string; correlationId?: string } }) => (
    <div data-testid="error-display">
      {error.errorCode} {error.message} {error.correlationId}
    </div>
  ),
}));

vi.mock('../../pages/workbench/tabs/forge/ForgeOverview', () => ({
  ForgeOverview: () => <div data-testid="mock-forge-overview" />,
}));

vi.mock('../../pages/workbench/tabs/forge/CostApproach', () => ({
  CostApproach: () => <div data-testid="mock-forge-cost" />,
}));

vi.mock('../../pages/workbench/tabs/forge/IncomeApproach', () => ({
  IncomeApproach: () => <div data-testid="mock-forge-income" />,
}));

vi.mock('../../pages/workbench/tabs/forge/Reconciliation', () => ({
  Reconciliation: () => <div data-testid="mock-forge-reconcile" />,
}));

function buildParcel(parcelId: string): MockParcel {
  return {
    parcelId,
    address: '100 Sales Test Ave',
    buildingSquareFeet: 1850,
    landAcreage: 0.28,
    yearBuilt: 1998,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'Residential',
    totalAssessedValue: 325000,
  };
}

function renderForge(
  ui: React.ReactElement,
  {
    parcelId = 'GATE-TEST-001',
    search = '?tab=sales',
  }: { parcelId?: string; search?: string } = {}
) {
  return render(
    <MemoryRouter initialEntries={[`/property/${parcelId}/forge${search}`]}>
      <Routes>
        <Route
          path="/property/:parcelId"
          element={
            <Outlet
              context={{
                parcelId,
                propertyData: {
                  parcelId,
                  address: '100 Sales Test Ave',
                  owner: 'Sales Tester',
                  assessedValue: 325000,
                  marketValue: 340000,
                  landValue: 90000,
                  improvementValue: 235000,
                  propertyType: 'Residential',
                  legalDescription: 'LOT 1 BLK 1',
                  source: 'fixture',
                },
                workMode: 'overview',
              }}
            />
          }
        >
          <Route path="forge" element={ui} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Comparable Sales Forge host', () => {
  beforeEach(() => {
    storeState.activeParcel = null;
    mockInvokeTool.mockReset();
    mockInvokeTool.mockResolvedValue({ success: true, data: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('lands on the real Sales sub-tab when a launch hint selects it', () => {
    storeState.activeParcel = buildParcel('GATE-TEST-001');

    renderForge(<PropertyForge />, { search: '?tab=sales' });

    expect(screen.getByTestId('sales-comparison-host')).toBeInTheDocument();
    expect(screen.getByTestId('comparable-sales-panel')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /sales/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText(/sales comps rationale/i)).toBeInTheDocument();
    expect(screen.getByText(/subject: 100 sales test ave/i)).toBeInTheDocument();
  });

  it('shows the empty Comparable Sales state when no parcel is bound', () => {
    renderForge(<ComparableSalesPanel />);

    expect(screen.getByTestId('comparable-sales-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/select a parcel to view comparable sales/i)).toBeInTheDocument();
  });

  it('shows the populated Comparable Sales state when parcel context is present', () => {
    storeState.activeParcel = buildParcel('GATE-TEST-001');

    renderForge(<ComparableSalesPanel />);

    expect(screen.getByTestId('comparable-sales-panel')).toBeInTheDocument();
    expect(screen.getByText(/subject: 100 sales test ave/i)).toBeInTheDocument();
    expect(screen.getByText(/sale date/i)).toBeInTheDocument();
    expect(screen.getByText(/qualified only/i)).toBeInTheDocument();
  });

  it('filters out the subject parcel and respects qualified-only defaults', () => {
    const subject: SubjectProperty = {
      parcelId: 'SUBJECT-001',
      address: '1 Subject Way',
      grossLivingArea: 2000,
      lotSizeSqft: 9000,
      yearBuilt: 2000,
      bedrooms: 3,
      bathrooms: 2,
      condition: 'Average',
      qualityGrade: 'AVG',
      propertyType: 'residential',
      assessedValue: 350000,
    };

    const comps: ComparableSale[] = [
      {
        parcelId: 'SUBJECT-001',
        saleDate: '2025-01-01T00:00:00.000Z',
        salePrice: 300000,
        propertyType: 'residential',
        address: '1 Subject Way',
        grossLivingArea: 2000,
        lotSizeSqft: 9000,
        yearBuilt: 2000,
        bedrooms: 3,
        bathrooms: 2,
        condition: 'Average',
        qualityGrade: 'AVG',
        saleQualification: 'qualified',
      },
      {
        parcelId: 'COMP-001',
        saleDate: '2025-02-01T00:00:00.000Z',
        salePrice: 310000,
        propertyType: 'residential',
        address: '2 Comp Way',
        grossLivingArea: 1980,
        lotSizeSqft: 8800,
        yearBuilt: 1999,
        bedrooms: 3,
        bathrooms: 2,
        condition: 'Good',
        qualityGrade: 'AVG',
        saleQualification: 'qualified',
      },
      {
        parcelId: 'COMP-002',
        saleDate: '2025-03-01T00:00:00.000Z',
        salePrice: 280000,
        propertyType: 'residential',
        address: '3 Comp Way',
        grossLivingArea: 2050,
        lotSizeSqft: 9200,
        yearBuilt: 2001,
        bedrooms: 4,
        bathrooms: 2,
        condition: 'Average',
        qualityGrade: 'AVG',
        saleQualification: 'unqualified',
      },
    ];

    const filtered = filterComps(subject, comps);
    expect(filtered.map((sale) => sale.parcelId)).toEqual(['COMP-001']);

    const ranked = findCompsForSubject(subject, comps);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.parcelId).toBe('COMP-001');
  });

  it('covers adjust and reconcile backend success and failure responses', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const subject: SubjectProperty = {
      parcelId: 'SUBJECT-001',
      address: '1 Subject Way',
      grossLivingArea: 2000,
      lotSizeSqft: 9000,
      yearBuilt: 2000,
      bedrooms: 3,
      bathrooms: 2,
      condition: 'Average',
      qualityGrade: 'AVG',
      propertyType: 'residential',
      assessedValue: 350000,
    };

    const comp: ComparableSale = {
      parcelId: 'COMP-001',
      saleDate: '2025-02-01T00:00:00.000Z',
      salePrice: 310000,
      propertyType: 'residential',
      address: '2 Comp Way',
      grossLivingArea: 1980,
      lotSizeSqft: 8800,
      yearBuilt: 1999,
      bedrooms: 3,
      bathrooms: 2,
      condition: 'Good',
      qualityGrade: 'AVG',
      saleQualification: 'qualified',
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        salePrice: 310000,
        glaAdjustment: 5000,
        lotAdjustment: 0,
        ageAdjustment: 0,
        bedroomAdjustment: 0,
        bathroomAdjustment: 0,
        conditionAdjustment: 0,
        locationAdjustment: 0,
        totalNetAdjustment: 5000,
        adjustedPrice: 315000,
        grossAdjustmentPct: 2,
        source: 'backend',
      }),
    });

    const adjusted = await adjustComp(subject, comp);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/costforge/sales-comparison/adjust-comparable',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(adjusted.adjustedPrice).toBe(315000);

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ message: 'unavailable' }),
    });

    await expect(adjustComp(subject, comp)).rejects.toThrow(/failed/i);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        comparableCount: 2,
        weightedAverage: 312500,
        median: 312500,
        mean: 312500,
        low: 310000,
        high: 315000,
        range: 5000,
        coefficientOfVariation: 2,
        averageGrossAdjustmentPct: 2,
        confidence: 'HIGH',
        comparableWeights: [
          { adjustedPrice: 315000, weight: 0.6 },
          { adjustedPrice: 310000, weight: 0.4 },
        ],
        source: 'backend',
      }),
    });

    const reconciled = await reconcileComps([
      { adjustedPrice: 315000, grossAdjustmentPct: 2 },
      { adjustedPrice: 310000, grossAdjustmentPct: 1 },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/costforge/sales-comparison/reconcile',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(reconciled.confidence).toBe('HIGH');
  });
});

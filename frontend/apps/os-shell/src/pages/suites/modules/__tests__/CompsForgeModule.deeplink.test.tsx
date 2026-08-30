import React from 'react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import CompsForgeModule from '../CompsForgeModule';
import { useCompsForgeHandoffStore } from '../compsForgeHandoffStore';

const activateModuleMock = vi.hoisted(() => vi.fn());

vi.mock('@/orchestration/moduleActivation', () => ({
  default: activateModuleMock,
  activateModule: activateModuleMock,
}));

const propertyState = { activeParcel: null as null | { countyCode?: string; neighborhood?: string } };

vi.mock('@/stores/propertyStore', () => ({
  usePropertyStore: (selector: unknown) => {
    const state = { activeParcel: propertyState.activeParcel };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

const loadCountyCompsMock = vi.hoisted(() => vi.fn());
const loadAttestedCountyCompsMock = vi.hoisted(() => vi.fn());
const adjustCompMock = vi.hoisted(() => vi.fn());
const reconcileCompsMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/comparableSalesService', () => ({
  adjustComp: adjustCompMock,
  findCompsForSubject: vi.fn(() => []),
  getComparableCountyCode: vi.fn((raw: string | null) => {
    const value = String(raw ?? '').replace(/\s+county$/i, '').trim().toLowerCase();
    if (value === '005' || value === 'benton') return '005';
    if (value === '033' || value === 'king') return '033';
    if (value === '063' || value === 'spokane') return '063';
    if (value === '077' || value === 'yakima') return '077';
    return null;
  }),
  getComparableCountyName: vi.fn((raw: string | null) => {
    if (raw === '005') return 'Benton';
    if (raw === '033') return 'King';
    if (raw === '063') return 'Spokane';
    if (raw === '077') return 'Yakima';
    return 'Washington';
  }),
  loadAttestedCountyComps: loadAttestedCountyCompsMock,
  loadCountyComps: loadCountyCompsMock,
  reconcileComps: reconcileCompsMock,
  supportsGovernedComparableAdjustments: vi.fn(() => false),
}));

function washingtonCountyContext(overrides: Record<string, unknown> = {}) {
  return {
    countyCode: '063',
    countyName: 'Spokane',
    resetValuationScope: true,
    launchContext: 'washington-counties-hub',
    dataTrustTier: 'public-reference-not-county-certified',
    referencePackageSource: 'hosted',
    referenceDataPosture: 'public_recorder_export',
    referenceRecordCount: 1,
    latestReferenceSaleDate: '2026-03-01',
    salesReviewAvailability: 'available',
    salesReviewUnavailableMessage: null,
    ...overrides,
  };
}

function publicComparable(overrides: Record<string, unknown> = {}) {
  return {
    parcelId: 'SP-1',
    saleDate: '2026-03-01',
    salePrice: 500000,
    propertyType: 'residential',
    address: '100 Spokane Public Sale Ave',
    countyCode: '063',
    countyName: 'Spokane',
    city: 'Spokane',
    neighborhoodCode: 'SP-N1',
    currentNeighborhoodCode: 'SP-N1',
    grossLivingArea: null,
    lotSizeSqft: null,
    yearBuilt: null,
    bedrooms: null,
    bathrooms: null,
    condition: null,
    qualityGrade: null,
    saleQualification: 'candidate_ready',
    ...overrides,
  };
}

function deferredSales() {
  let resolve!: (sales: unknown[]) => void;
  const promise = new Promise<unknown[]>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

describe('CompsForgeModule deeplink consumption', () => {
  beforeEach(() => {
    activateModuleMock.mockReset();
    propertyState.activeParcel = null;
    loadCountyCompsMock.mockReset();
    loadAttestedCountyCompsMock.mockReset();
    adjustCompMock.mockReset();
    reconcileCompsMock.mockReset();
    useCompsForgeHandoffStore.getState().clearHandoffContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('declares the candidate reconciliation contract posture', async () => {
    loadCountyCompsMock.mockResolvedValue([]);

    render(<CompsForgeModule metadata={{ countyName: 'Benton County' }} />);

    const posture = screen.getByTestId('compsforge-contract-classification');
    expect(posture).toHaveAttribute('data-contract-status', 'contract-backed');
    expect(posture).toHaveAttribute('data-contract-id', 'compsforge_candidate_reconciliation_v1');
    expect(screen.getByText('compsforge_candidate_reconciliation_v1')).toBeInTheDocument();
    expect(screen.getByText(/governed adjustment and reconciliation remain Benton-certified/i)).toBeInTheDocument();
  });

  it('opens neighborhood rollups in scouting mode instead of the parcel-only dead end', async () => {
    loadCountyCompsMock.mockResolvedValue([
      {
        parcelId: 'P-1',
        saleDate: '2026-03-01',
        salePrice: 400000,
        propertyType: 'residential',
        address: '100 West Richland Ave',
        countyCode: '005',
        countyName: 'Benton',
        city: 'West Richland',
        neighborhoodCode: 'NBHD-WR01',
        currentNeighborhoodCode: 'NBHD-WR01',
        grossLivingArea: null,
        lotSizeSqft: null,
        yearBuilt: null,
        bedrooms: null,
        bathrooms: null,
        condition: null,
        qualityGrade: null,
        saleQualification: 'qualified',
      },
      {
        parcelId: 'P-2',
        saleDate: '2026-02-01',
        salePrice: 410000,
        propertyType: 'residential',
        address: '999 Other Neighborhood Rd',
        countyCode: '005',
        countyName: 'Benton',
        city: 'West Richland',
        neighborhoodCode: 'NBHD-OTHER',
        currentNeighborhoodCode: 'NBHD-OTHER',
        grossLivingArea: null,
        lotSizeSqft: null,
        yearBuilt: null,
        bedrooms: null,
        bathrooms: null,
        condition: null,
        qualityGrade: null,
        saleQualification: 'qualified',
      },
    ]);

    render(
      <CompsForgeModule
        metadata={{
          countyName: 'Benton County',
          rollupScope: 'neighborhood',
          neighborhoodCode: 'NBHD-WR01',
          neighborhoodName: 'West Richland Estates',
        }}
      />,
    );

    expect(
      await screen.findByText(/Rollup scouting mode is active for West Richland Estates/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Select a parcel before running sales comparison/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/100 West Richland Ave/i)).toBeInTheDocument();
    expect(screen.queryByText('999 Other Neighborhood Rd')).not.toBeInTheDocument();
  });

  it('keeps city handoffs honest about reval-area and neighborhood discipline', async () => {
    loadCountyCompsMock.mockResolvedValue([
      {
        parcelId: 'P-3',
        saleDate: '2026-03-15',
        salePrice: 390000,
        propertyType: 'residential',
        address: '200 Kennewick Way',
        countyCode: '005',
        countyName: 'Benton',
        city: 'Kennewick',
        neighborhoodCode: 'NBHD-K1',
        currentNeighborhoodCode: 'NBHD-K1',
        grossLivingArea: null,
        lotSizeSqft: null,
        yearBuilt: null,
        bedrooms: null,
        bathrooms: null,
        condition: null,
        qualityGrade: null,
        saleQualification: 'qualified',
      },
    ]);

    render(
      <CompsForgeModule
        metadata={{
          countyName: 'Benton County',
          rollupScope: 'city',
          city: 'Kennewick',
        }}
      />,
    );

    expect(
      await screen.findByText(/Counties actually work comps by reval area and neighborhood/i),
    ).toBeInTheDocument();
    expect(await screen.findByText('200 Kennewick Way')).toBeInTheDocument();
    expect(screen.getAllByText(/City overview/i).length).toBeGreaterThan(0);
  });

  it('uses the exact Counties HUB county and source instead of a stale active parcel', async () => {
    propertyState.activeParcel = { countyCode: '005', neighborhood: 'BENTON-STALE' };
    loadAttestedCountyCompsMock.mockResolvedValue([
      publicComparable(),
      publicComparable({
        parcelId: 'SP-2',
        address: '200 Spokane Review Sale Ave',
        saleQualification: 'review_required',
      }),
      publicComparable({
        parcelId: 'SP-3',
        address: '300 Spokane Historic Sale Ave',
        saleDate: '2015-03-01',
      }),
    ]);

    render(<CompsForgeModule metadata={washingtonCountyContext()} />);

    expect(
      await screen.findByText(/Spokane County public sales scouting is active/i),
    ).toBeInTheDocument();
    expect(loadAttestedCountyCompsMock).toHaveBeenCalledWith('063', 'hosted');
    expect(loadCountyCompsMock).not.toHaveBeenCalled();
    expect(await screen.findByText('100 Spokane Public Sale Ave')).toBeInTheDocument();
    expect(screen.getByTestId('compsforge-public-trust')).toHaveTextContent(
      /public\/reference · not county-certified · source current through 2026-03-01/i,
    );
    expect(screen.queryByText('BENTON-STALE')).not.toBeInTheDocument();
    expect(screen.queryByText(/Select a parcel before running sales comparison/i)).not.toBeInTheDocument();
    expect(adjustCompMock).not.toHaveBeenCalled();
    expect(reconcileCompsMock).not.toHaveBeenCalled();

    const qualifiedOnlyCheckbox = screen.getByRole('checkbox', { name: /Qualified sales only/i });
    expect(qualifiedOnlyCheckbox).not.toBeChecked();
    expect(screen.getByText('200 Spokane Review Sale Ave')).toBeInTheDocument();
    expect(screen.queryByText('300 Spokane Historic Sale Ave')).not.toBeInTheDocument();
    fireEvent.click(qualifiedOnlyCheckbox);
    expect(screen.queryByText('100 Spokane Public Sale Ave')).not.toBeInTheDocument();
    expect(screen.queryByText('200 Spokane Review Sale Ave')).not.toBeInTheDocument();
    expect(screen.getByText(/No county-qualified sales match this filter/i)).toBeInTheDocument();
    fireEvent.click(qualifiedOnlyCheckbox);
    expect(await screen.findByText('200 Spokane Review Sale Ave')).toBeInTheDocument();
    expect(screen.queryByText('300 Spokane Historic Sale Ave')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Sale date from'), {
      target: { value: '2015-01-01' },
    });
    expect(await screen.findByText('300 Spokane Historic Sale Ave')).toBeInTheDocument();
  });

  it('fails closed when the selected county has no governed public sales shard', async () => {
    propertyState.activeParcel = { countyCode: '005', neighborhood: 'BENTON-STALE' };

    render(
      <CompsForgeModule
        metadata={washingtonCountyContext({
          referenceRecordCount: null,
          latestReferenceSaleDate: null,
          salesReviewAvailability: 'unavailable',
          salesReviewUnavailableMessage: 'Spokane County public sales are not staged.',
        })}
      />,
    );

    expect(await screen.findByText('Spokane County public sales are not staged.')).toBeInTheDocument();
    expect(screen.getByText('Spokane (063)')).toBeInTheDocument();
    expect(loadAttestedCountyCompsMock).not.toHaveBeenCalled();
    expect(loadCountyCompsMock).not.toHaveBeenCalled();
    expect(screen.queryByText('BENTON-STALE')).not.toBeInTheDocument();
    expect(screen.queryByText(/Select a parcel before running sales comparison/i)).not.toBeInTheDocument();
  });

  it('never renders prior-county candidates under a newly selected county while loading', async () => {
    let resolveKing: ((sales: unknown[]) => void) | undefined;
    loadAttestedCountyCompsMock.mockImplementation((countyCode: string) => {
      if (countyCode === '063') return Promise.resolve([publicComparable()]);
      return new Promise((resolve) => {
        resolveKing = resolve;
      });
    });

    const { rerender } = render(<CompsForgeModule metadata={washingtonCountyContext()} />);
    expect(await screen.findByText('100 Spokane Public Sale Ave')).toBeInTheDocument();

    rerender(
      <CompsForgeModule
        metadata={washingtonCountyContext({
          countyCode: '033',
          countyName: 'King',
          referenceRecordCount: 2,
          latestReferenceSaleDate: '2026-04-01',
        })}
      />,
    );

    expect(screen.queryByText('100 Spokane Public Sale Ave')).not.toBeInTheDocument();
    expect(screen.getByText(/Loading King County sales/i)).toBeInTheDocument();
    expect(loadAttestedCountyCompsMock).toHaveBeenLastCalledWith('033', 'hosted');

    await act(async () => {
      resolveKing?.([]);
    });
    await waitFor(() => {
      expect(screen.getByText(/No observed public comparable sales are available/i)).toBeInTheDocument();
    });
  });

  it('ignores a superseded county request that resolves after the new county', async () => {
    const spokaneRequest = deferredSales();
    const kingRequest = deferredSales();
    loadAttestedCountyCompsMock.mockImplementation((countyCode: string) => (
      countyCode === '063' ? spokaneRequest.promise : kingRequest.promise
    ));

    const { rerender } = render(<CompsForgeModule metadata={washingtonCountyContext()} />);
    await waitFor(() => {
      expect(loadAttestedCountyCompsMock).toHaveBeenCalledWith('063', 'hosted');
    });

    rerender(
      <CompsForgeModule
        metadata={washingtonCountyContext({
          countyCode: '033',
          countyName: 'King',
          referenceRecordCount: 1,
          latestReferenceSaleDate: '2026-04-01',
        })}
      />,
    );
    await waitFor(() => {
      expect(loadAttestedCountyCompsMock).toHaveBeenLastCalledWith('033', 'hosted');
    });

    await act(async () => {
      kingRequest.resolve([
        publicComparable({
          parcelId: 'KING-1',
          address: '100 King Current Sale Ave',
          countyCode: '033',
          countyName: 'King',
          city: 'Seattle',
        }),
      ]);
    });
    expect(await screen.findByText('100 King Current Sale Ave')).toBeInTheDocument();

    await act(async () => {
      spokaneRequest.resolve([publicComparable({ address: '999 Spokane Late Sale Ave' })]);
    });
    expect(screen.getByText('100 King Current Sale Ave')).toBeInTheDocument();
    expect(screen.queryByText('999 Spokane Late Sale Ave')).not.toBeInTheDocument();
  });

  it('reloads the attested body when the same county package is refreshed', async () => {
    const refreshedRequest = deferredSales();
    loadAttestedCountyCompsMock
      .mockResolvedValueOnce([publicComparable({ address: '100 Prior Package Sale Ave' })])
      .mockReturnValueOnce(refreshedRequest.promise);

    const { rerender } = render(<CompsForgeModule metadata={washingtonCountyContext()} />);
    expect(await screen.findByText('100 Prior Package Sale Ave')).toBeInTheDocument();

    rerender(
      <CompsForgeModule
        metadata={washingtonCountyContext({
          referenceRecordCount: 2,
          latestReferenceSaleDate: '2026-04-01',
        })}
      />,
    );

    expect(screen.queryByText('100 Prior Package Sale Ave')).not.toBeInTheDocument();
    expect(screen.getByText(/Loading Spokane County sales/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(loadAttestedCountyCompsMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      refreshedRequest.resolve([
        publicComparable({
          parcelId: 'SP-REFRESHED',
          address: '200 Current Package Sale Ave',
          saleDate: '2026-04-01',
        }),
      ]);
    });

    expect(await screen.findByText('200 Current Package Sale Ave')).toBeInTheDocument();
    expect(screen.queryByText('100 Prior Package Sale Ave')).not.toBeInTheDocument();
    expect(loadCountyCompsMock).not.toHaveBeenCalled();
  });

  it('populates the County Studio round-trip chip from segment handoff metadata', async () => {
    loadCountyCompsMock.mockResolvedValue([]);

    render(
      <CompsForgeModule
        metadata={{
          countyName: 'Benton County',
          segmentId: 'seg-42',
          segmentLabel: 'R1 Core',
          sampleParcelIds: ['P-1', 'P-2'],
        }}
      />,
    );

    await waitFor(() => {
      expect(useCompsForgeHandoffStore.getState().contextSegmentId).toBe('seg-42');
      expect(useCompsForgeHandoffStore.getState().preloadedSampleIds).toEqual(['P-1', 'P-2']);
    });

    const chip = screen.getByTestId('cfg-scoped-from-chip');
    expect(chip.textContent).toMatch(/R1 Core/);

    fireEvent.click(chip);
    expect(activateModuleMock).toHaveBeenCalledWith(
      'county-studio',
      expect.objectContaining({
        source: 'system',
        metadata: expect.objectContaining({ segmentId: 'seg-42' }),
      }),
    );
  });
});

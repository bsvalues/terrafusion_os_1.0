import React from 'react';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
const adjustCompMock = vi.hoisted(() => vi.fn());
const reconcileCompsMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/comparableSalesService', () => ({
  adjustComp: adjustCompMock,
  findCompsForSubject: vi.fn(() => []),
  getComparableCountyCode: vi.fn((raw: string) => raw.toLowerCase().includes('benton') ? '005' : '077'),
  getComparableCountyName: vi.fn((raw: string) => raw === '077' ? 'Yakima' : 'Benton'),
  loadCountyComps: loadCountyCompsMock,
  reconcileComps: reconcileCompsMock,
  supportsGovernedComparableAdjustments: vi.fn(() => false),
}));

describe('CompsForgeModule deeplink consumption', () => {
  beforeEach(() => {
    activateModuleMock.mockReset();
    propertyState.activeParcel = null;
    loadCountyCompsMock.mockReset();
    adjustCompMock.mockReset();
    reconcileCompsMock.mockReset();
    useCompsForgeHandoffStore.getState().clearHandoffContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
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

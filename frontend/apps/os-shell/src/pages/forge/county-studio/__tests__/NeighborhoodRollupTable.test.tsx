import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { NeighborhoodRollupTable } from '../components/NeighborhoodRollupTable';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { NeighborhoodRollupRowDto } from '../types/countyStudio.types';

const MOCK_ROWS: NeighborhoodRollupRowDto[] = [
  {
    neighborhoodCode: 'NBHD-K1', neighborhoodName: 'NBHD-K1', city: 'Kennewick',
    segmentCount: 2, parcelCount: 150, medianRatio: 0.96, cod: 8.5, prd: 1.01,
    stabilityScore: 88, riskScore: 22, exceptionCount: 1, exceptionRate: 0.0067,
    complianceStatus: 'IaaoCompliant',
  },
  {
    neighborhoodCode: 'NBHD-K2', neighborhoodName: 'NBHD-K2', city: 'Kennewick',
    segmentCount: 3, parcelCount: 220, medianRatio: 0.88, cod: 22.0, prd: 1.04,
    stabilityScore: 55, riskScore: 78, exceptionCount: 34, exceptionRate: 0.155,
    complianceStatus: 'NonCompliant',
  },
  {
    neighborhoodCode: 'NBHD-R1', neighborhoodName: 'NBHD-R1', city: 'Richland',
    segmentCount: 2, parcelCount: 110, medianRatio: 0.95, cod: 9.2, prd: 1.02,
    stabilityScore: 82, riskScore: 25, exceptionCount: 0, exceptionRate: 0,
    complianceStatus: 'IaaoCompliant',
  },
];

describe('NeighborhoodRollupTable', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().setNeighborhoodRollup(MOCK_ROWS);
      useCountyStudioStore.getState().setLoadStatus('neighborhoodRollup', 'success');
      useCountyStudioStore.getState().drillToCity('Kennewick');
    });
  });

  it('filters to selectedCity from the store', () => {
    render(<NeighborhoodRollupTable />);
    // NBHD-R1 (Richland) should be hidden; NBHD-K1 and NBHD-K2 should show.
    expect(screen.getByText('NBHD-K1')).toBeInTheDocument();
    expect(screen.getByText('NBHD-K2')).toBeInTheDocument();
    expect(screen.queryByText('NBHD-R1')).not.toBeInTheDocument();
  });

  it('clicking a row drills to that neighborhood', () => {
    render(<NeighborhoodRollupTable />);
    fireEvent.click(screen.getByText('NBHD-K1'));
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('neighborhood');
    expect(s.selectedCity).toBe('Kennewick');
    expect(s.selectedNeighborhood).toBe('NBHD-K1');
  });

  it('NonCompliant filter pill hides compliant rows within the city', () => {
    render(<NeighborhoodRollupTable />);
    fireEvent.click(screen.getByTestId('nbhd-filter-NonCompliant'));
    expect(screen.queryByText('NBHD-K1')).not.toBeInTheDocument();
    expect(screen.getByText('NBHD-K2')).toBeInTheDocument();
  });

  it('stability chip severity reflects score', () => {
    render(<NeighborhoodRollupTable />);
    const chips = screen.getAllByTestId('nbhd-stability-chip');
    const critical = chips.find((c) => c.textContent === '55');
    const healthy  = chips.find((c) => c.textContent === '88');
    expect(critical?.dataset.severity).toBe('critical');
    expect(healthy?.dataset.severity).toBe('ok');
  });
});

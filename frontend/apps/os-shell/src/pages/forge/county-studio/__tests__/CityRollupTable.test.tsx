import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { CityRollupTable } from '../components/CityRollupTable';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CityRollupRowDto } from '../types/countyStudio.types';

const MOCK_ROWS: CityRollupRowDto[] = [
  {
    city: 'Kennewick',
    segmentCount: 6,
    parcelCount: 1240,
    medianRatio: 0.95,
    cod: 12.3,
    prd: 1.01,
    exceptionCount: 8,
    exceptionRate: 0.0065,
    worstSegmentName: 'NBHD-K1 · R1 · GOOD',
    worstSegmentMedianRatio: 0.84,
    complianceStatus: 'IaaoCompliant',
  },
  {
    city: 'Richland',
    segmentCount: 4,
    parcelCount: 720,
    medianRatio: 0.82,          // hard-fail median → NonCompliant
    cod: 18.5,
    prd: 1.05,
    exceptionCount: 142,
    exceptionRate: 0.197,
    worstSegmentName: 'NBHD-R2 · R1 · STANDARD',
    worstSegmentMedianRatio: 0.78,
    complianceStatus: 'NonCompliant',
  },
];

describe('CityRollupTable', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup(MOCK_ROWS);
      useCountyStudioStore.getState().setLoadStatus('cityRollup', 'success');
      useCountyStudioStore.getState().drillToCounty();
    });
  });

  it('renders one row per city', () => {
    render(<CityRollupTable />);
    expect(screen.getByText('Kennewick')).toBeInTheDocument();
    expect(screen.getByText('Richland')).toBeInTheDocument();
    expect(screen.getAllByTestId('city-rollup-row')).toHaveLength(2);
  });

  it('clicking a row advances drill to that city', () => {
    render(<CityRollupTable />);
    fireEvent.click(screen.getByText('Kennewick'));
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('city');
    expect(s.selectedCity).toBe('Kennewick');
  });

  it('compliance chip reflects status', () => {
    render(<CityRollupTable />);
    const chips = screen.getAllByTestId('city-compliance-chip');
    expect(chips).toHaveLength(2);
    expect(chips[0].dataset.status).toBe('IaaoCompliant');
    expect(chips[1].dataset.status).toBe('NonCompliant');
  });

  it('Non-compliant filter pill hides compliant rows', () => {
    render(<CityRollupTable />);
    fireEvent.click(screen.getByTestId('city-filter-NonCompliant'));
    expect(screen.queryByText('Kennewick')).not.toBeInTheDocument();
    expect(screen.getByText('Richland')).toBeInTheDocument();
  });

  it('shows empty-state CTA when there are no rows', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([]);
      useCountyStudioStore.getState().setLoadStatus('cityRollup', 'success');
    });
    render(<CityRollupTable />);
    expect(screen.getByTestId('city-rollup-empty')).toBeInTheDocument();
    // The CTA points the user at LeftRail → Derive Segment Metrics
    expect(screen.getByText(/Derive Segment Metrics/i)).toBeInTheDocument();
  });

  it('shows error state with the captured message', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([]);
      useCountyStudioStore.getState().setLoadStatus('cityRollup', 'error', 'HTTP 409: no active segment set');
    });
    render(<CityRollupTable />);
    expect(screen.getByTestId('city-rollup-error')).toBeInTheDocument();
    expect(screen.getByText(/HTTP 409/)).toBeInTheDocument();
  });

  it('formats exception rate as a percentage', () => {
    render(<CityRollupTable />);
    // Richland exceptionRate=0.197 → "19.7%"
    expect(screen.getByText('19.7%')).toBeInTheDocument();
    // Kennewick exceptionRate=0.0065 → "0.7%" (rounded to 1 decimal)
    expect(screen.getByText('0.7%')).toBeInTheDocument();
  });

  it('preserves hood_cd and keeps reval separate in worst-segment rollups', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([
        {
          city: 'Kennewick',
          segmentCount: 6,
          parcelCount: 1240,
          medianRatio: 0.95,
          cod: 12.3,
          prd: 1.01,
          exceptionCount: 8,
          exceptionRate: 0.0065,
          worstSegmentName: '52100 401B · R · UNKNOWN',
          worstSegmentNeighborhoodCode: '52100 401B',
          worstSegmentRevalArea: null,
          worstSegmentBuildingType: 'R',
          worstSegmentQualityGrade: 'UNKNOWN',
          worstSegmentMedianRatio: 14.742,
          complianceStatus: 'IaaoCompliant',
        },
      ]);
      useCountyStudioStore.getState().setLoadStatus('cityRollup', 'success');
    });

    render(<CityRollupTable />);
    expect(screen.getByText('Neighborhood 52100 401B')).toBeInTheDocument();
    expect(screen.queryByText(/MHOME|PERMC|R · R/)).not.toBeInTheDocument();
  });
});

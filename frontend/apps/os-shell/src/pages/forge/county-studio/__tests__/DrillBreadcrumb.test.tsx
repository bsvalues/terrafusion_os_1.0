import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { DrillBreadcrumb } from '../components/DrillBreadcrumb';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountySegmentDto } from '../types/countyStudio.types';

describe('DrillBreadcrumb', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().drillToCounty();
      useCountyStudioStore.getState().setSegments([]);
    });
  });

  it('renders only County crumb at county level', () => {
    render(<DrillBreadcrumb />);
    expect(screen.getByTestId('crumb-county')).toBeInTheDocument();
    expect(screen.queryByTestId('crumb-city')).not.toBeInTheDocument();
    expect(screen.queryByTestId('crumb-neighborhood')).not.toBeInTheDocument();
  });

  it('renders County > City at city level', () => {
    act(() => {
      useCountyStudioStore.getState().drillToCity('Kennewick');
    });
    render(<DrillBreadcrumb />);
    expect(screen.getByTestId('crumb-city')).toHaveTextContent('Kennewick');
    expect(screen.queryByTestId('crumb-neighborhood')).not.toBeInTheDocument();
  });

  it('renders full chain at neighborhood level', () => {
    act(() => {
      useCountyStudioStore.getState().drillToNeighborhood('Richland', 'NBHD-R1', 2);
    });
    render(<DrillBreadcrumb />);
    expect(screen.getByTestId('crumb-county')).toBeInTheDocument();
    expect(screen.getByTestId('crumb-city')).toHaveTextContent('Richland');
    expect(screen.getByTestId('crumb-neighborhood')).toHaveTextContent('Neighborhood NBHD-R1 · Reval 2');
  });

  it('renders segment crumb when a segment is selected', () => {
    const segment: CountySegmentDto = {
      segmentId: 'seg-1', segmentSetId: 'ss-1',
      name: 'NBHD-R1 · R1 · STANDARD', segmentType: 'Residential',
      revalArea: 2,
      buildingType: 'R1',
      qualityGrade: 'STANDARD',
      parcelCount: 42, medianRatio: 0.95, cod: 8.1, prd: 1.01,
      stabilityScore: 82, riskScore: 22, exceptionCount: 0,
      geographyRef: 'NBHD-R1',
    };
    act(() => {
      useCountyStudioStore.getState().drillToNeighborhood('Richland', 'NBHD-R1', 2);
      useCountyStudioStore.getState().setSegments([segment]);
      useCountyStudioStore.getState().selectSegment('seg-1');
    });
    render(<DrillBreadcrumb />);
    expect(screen.getByTestId('crumb-segment')).toHaveTextContent('Neighborhood NBHD-R1 · Reval 2');
  });

  it('clicking County crumb collapses drill', () => {
    act(() => {
      useCountyStudioStore.getState().drillToNeighborhood('Richland', 'NBHD-R1', 2);
    });
    render(<DrillBreadcrumb />);
    fireEvent.click(screen.getByTestId('crumb-county'));
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('county');
    expect(s.selectedCity).toBeNull();
    expect(s.selectedNeighborhood).toBeNull();
  });

  it('clicking City crumb collapses to city (clearing neighborhood)', () => {
    act(() => {
      useCountyStudioStore.getState().drillToNeighborhood('Kennewick', 'NBHD-K1', 5);
    });
    render(<DrillBreadcrumb />);
    fireEvent.click(screen.getByTestId('crumb-city'));
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('city');
    expect(s.selectedCity).toBe('Kennewick');
    expect(s.selectedNeighborhood).toBeNull();
    expect(s.selectedNeighborhoodRevalArea).toBeNull();
  });
});

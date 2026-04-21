import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { SegmentTable } from '../components/SegmentTable';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountySegmentDto } from '../types/countyStudio.types';

const MOCK_SEGMENTS: CountySegmentDto[] = [
  {
    segmentId: 's1',
    segmentSetId: 'ss1',
    name: 'West Richland R1',
    segmentType: 'Residential',
    parcelCount: 412,
    medianRatio: 0.97,
    cod: 14.2,
    prd: 1.01,
    stabilityScore: 72,
    riskScore: 35,
    exceptionCount: 8,
    geographyRef: null,
  },
  {
    segmentId: 's2',
    segmentSetId: 'ss1',
    name: 'Kennewick C1',
    segmentType: 'Commercial',
    parcelCount: 89,
    medianRatio: 0.84,
    cod: 22.8,
    prd: 1.06,
    stabilityScore: 48,
    riskScore: 78,
    exceptionCount: 22,
    geographyRef: null,
  },
];

describe('SegmentTable', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().setSegments(MOCK_SEGMENTS);
      useCountyStudioStore.getState().selectSegment(null);
    });
  });

  it('renders one row per segment', () => {
    render(<SegmentTable />);
    expect(screen.getByText('West Richland R1')).toBeInTheDocument();
    expect(screen.getByText('Kennewick C1')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<SegmentTable />);
    expect(screen.getByText(/^Segment/)).toBeInTheDocument();
    expect(screen.getByText(/^Parcels/)).toBeInTheDocument();
    expect(screen.getByText(/^Median Ratio/)).toBeInTheDocument();
    expect(screen.getByText(/^COD/)).toBeInTheDocument();
    expect(screen.getByText(/^Stability/)).toBeInTheDocument();
  });

  it('selecting a row calls selectSegment in the store', () => {
    render(<SegmentTable />);
    fireEvent.click(screen.getByText('West Richland R1'));
    expect(useCountyStudioStore.getState().selectedSegmentId).toBe('s1');
  });

  it('marks low-stability segment with red chip', () => {
    render(<SegmentTable />);
    const chips = screen.getAllByTestId('stability-chip');
    const lowChip = chips.find((el) => el.textContent === '48');
    expect(lowChip).toBeDefined();
    expect(lowChip?.dataset.severity).toBe('critical');
  });

  it('shows empty state when no segments loaded', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([]);
    });
    render(<SegmentTable />);
    expect(screen.getByText(/no segments loaded/i)).toBeInTheDocument();
  });
});

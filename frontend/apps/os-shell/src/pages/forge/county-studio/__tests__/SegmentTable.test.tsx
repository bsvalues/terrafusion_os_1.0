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
    name: 'NBHD-WR1 · R1 · STANDARD',
    segmentType: 'Residential',
    parcelCount: 412,
    medianRatio: 0.97,
    cod: 14.2,
    prd: 1.01,
    ratioCount: 42,
    salesCount: 42,
    prb: 0.02,
    weightedMeanRatio: 0.962,
    yoyMedianRatioDelta: 0.018,
    stabilityScore: 72,
    riskScore: 35,
    exceptionCount: 8,
    geographyRef: 'NBHD-WR1',
  },
  {
    segmentId: 's2',
    segmentSetId: 'ss1',
    name: 'NBHD-KC1 · C1 · COMM',
    segmentType: 'Commercial',
    parcelCount: 89,
    medianRatio: 0.84,
    cod: 22.8,
    prd: 1.06,
    ratioCount: 8,
    salesCount: 8,
    prb: -0.14,
    weightedMeanRatio: 0.792,
    yoyMedianRatioDelta: -0.061,
    stabilityScore: 48,
    riskScore: 78,
    exceptionCount: 22,
    geographyRef: 'NBHD-KC1',
  },
];

describe('SegmentTable', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().setStudy(null);
      useCountyStudioStore.getState().setSegments(MOCK_SEGMENTS);
      useCountyStudioStore.getState().selectSegment(null);
    });
  });

  it('renders one row per segment', () => {
    render(<SegmentTable />);
    expect(screen.getByText('Neighborhood NBHD-WR1')).toBeInTheDocument();
    expect(screen.getByText('Neighborhood NBHD-KC1')).toBeInTheDocument();
    expect(screen.getByText('Residential · R1 · STANDARD')).toBeInTheDocument();
    expect(screen.getByText('Commercial · C1 · COMM')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<SegmentTable />);
    expect(screen.getByText(/^Segment/)).toBeInTheDocument();
    expect(screen.getByText(/^Parcels/)).toBeInTheDocument();
    expect(screen.getByText(/^Median Ratio/)).toBeInTheDocument();
    expect(screen.getByText(/^COD/)).toBeInTheDocument();
    expect(screen.getByText(/^PRB/)).toBeInTheDocument();
    expect(screen.getByText(/^Wtd Mean/)).toBeInTheDocument();
    expect(screen.getByText(/^YoY/)).toBeInTheDocument();
    expect(screen.getByText(/^Stability/)).toBeInTheDocument();
  });

  it('renders Benton-depth statistics parity signals in the table', () => {
    render(<SegmentTable />);
    expect(screen.getByText('0.020')).toBeInTheDocument();
    expect(screen.getByText('0.962')).toBeInTheDocument();
    expect(screen.getByText('+0.018')).toBeInTheDocument();
    const sampleChips = screen.getAllByTestId('sample-health-chip');
    const healthyChip = sampleChips.find((chip) => chip.textContent === '42 · Healthy');
    const thinChip = sampleChips.find((chip) => chip.textContent === '8 · Thin');
    expect(healthyChip).toHaveAttribute('data-severity', 'ok');
    expect(thinChip).toHaveAttribute('data-severity', 'thin');
  });

  it('selecting a row calls selectSegment in the store', () => {
    render(<SegmentTable />);
    fireEvent.click(screen.getByText('Neighborhood NBHD-WR1'));
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

  it('shows derive-first guidance when a study is open but no segment set is active yet', () => {
    act(() => {
      useCountyStudioStore.getState().setStudy({
        studyId: 'study-1',
        countyId: 'benton',
        taxYear: 2026,
        studyType: 'RatioStudy',
        status: 'Active',
        baselineVersion: null,
        activeSegmentSetId: null,
        createdAt: '',
        updatedAt: '',
        createdBy: 'test',
        updatedBy: 'test',
      });
      useCountyStudioStore.getState().setSegments([]);
    });
    render(<SegmentTable />);
    expect(screen.getByTestId('segment-table-empty-derive')).toHaveTextContent(/derive segment metrics/i);
  });

  it('filter prop hides non-matching segments', () => {
    render(<SegmentTable filter={(s) => s.riskScore > 50} />);
    // s2 has riskScore 78, s1 has 35
    expect(screen.queryByText('Neighborhood NBHD-WR1')).not.toBeInTheDocument();
    expect(screen.getByText('Neighborhood NBHD-KC1')).toBeInTheDocument();
  });

  it('shows all segments when no filter is provided', () => {
    render(<SegmentTable />);
    expect(screen.getByText('Neighborhood NBHD-WR1')).toBeInTheDocument();
    expect(screen.getByText('Neighborhood NBHD-KC1')).toBeInTheDocument();
  });
});

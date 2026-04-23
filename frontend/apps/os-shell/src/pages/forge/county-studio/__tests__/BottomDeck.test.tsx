import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import { BottomDeck } from '../components/BottomDeck';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('BottomDeck', () => {
  it('renders three tabs', () => {
    render(<BottomDeck />);
    expect(screen.getByText('Distribution')).toBeInTheDocument();
    expect(screen.getByText('Before / After')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
  });

  it('defaults to Distribution tab', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([
        {
          segmentId: 's1',
          segmentSetId: 'ss1',
          name: 'Test Seg',
          segmentType: 'Residential',
          parcelCount: 100,
          medianRatio: 0.97,
          cod: 14.0,
          prd: 1.01,
          stabilityScore: 75,
          riskScore: 30,
          exceptionCount: 2,
          geographyRef: null,
        },
      ]);
    });
    render(<BottomDeck />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('switching to Warnings tab shows warnings list', () => {
    render(<BottomDeck />);
    fireEvent.click(screen.getByText('Warnings'));
    expect(screen.getByTestId('warnings-panel')).toBeInTheDocument();
  });

  it('shows no-segments message when segments empty', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([]);
    });
    render(<BottomDeck />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('flags PRD out-of-bounds as critical (PRD > 1.03)', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([{
        segmentId: 'sx', segmentSetId: 'ss1', name: 'High PRD Seg',
        segmentType: 'Residential', parcelCount: 200, medianRatio: 0.99,
        cod: 12.0, prd: 1.08,   // prd > 1.03
        stabilityScore: 80, riskScore: 30, exceptionCount: 0, geographyRef: null,
      }]);
    });
    render(<BottomDeck />);
    fireEvent.click(screen.getByText('Warnings'));
    expect(screen.getByText(/PRD/)).toBeInTheDocument();
    expect(screen.getByText(/High PRD Seg/)).toBeInTheDocument();
  });

  it('flags high exception rate as warning (exceptions > 10% of parcels)', () => {
    act(() => {
      useCountyStudioStore.getState().setSegments([{
        segmentId: 'sy', segmentSetId: 'ss1', name: 'Exc Rate Seg',
        segmentType: 'Residential', parcelCount: 100, medianRatio: 0.99,
        cod: 12.0, prd: 1.01, stabilityScore: 75, riskScore: 30,
        exceptionCount: 15,  // 15% — above 10% threshold
        geographyRef: null,
      }]);
    });
    render(<BottomDeck />);
    fireEvent.click(screen.getByText('Warnings'));
    expect(screen.getByText(/exception rate/i)).toBeInTheDocument();
  });

  // ── Follow-up: loading + error states ───────────────────────────────

  it('renders skeleton while loadStatus.segments is loading', () => {
    act(() => {
      useCountyStudioStore.setState({
        loadStatus: { segments: 'loading', cohorts: 'idle', scenarios: 'idle' },
      });
    });
    render(<BottomDeck />);
    expect(screen.getByTestId('bottom-deck-loading')).toBeInTheDocument();
    // The distribution chart's testid is NOT present during loading.
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('renders error panel when loadStatus.segments is error', () => {
    act(() => {
      useCountyStudioStore.setState({
        loadStatus: { segments: 'error', cohorts: 'idle', scenarios: 'idle' },
        loadErrors: { segments: 'backend 503', cohorts: null, scenarios: null },
      });
    });
    render(<BottomDeck />);
    const errorPanel = screen.getByTestId('bottom-deck-error');
    expect(errorPanel).toBeInTheDocument();
    expect(errorPanel).toHaveTextContent('backend 503');
  });
});

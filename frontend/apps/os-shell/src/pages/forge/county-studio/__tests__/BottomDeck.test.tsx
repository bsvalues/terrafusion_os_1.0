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
});

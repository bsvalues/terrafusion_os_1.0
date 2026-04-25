// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/NeighborhoodInspector.test.tsx
//
// Unit tests for NeighborhoodInspector.
// Covers: empty state when no neighborhood selected, metrics displayed when
// a matching row exists, compliance lamp status attribute, null metric display.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { NeighborhoodInspector } from '../components/NeighborhoodInspector';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { NeighborhoodRollupRowDto } from '../types/countyStudio.types';

const MOCK_NBHD_ROW: NeighborhoodRollupRowDto = {
  neighborhoodCode: 'NBHD-WR01',
  neighborhoodName: 'West Richland Estates',
  city: 'West Richland',
  segmentCount: 2,
  parcelCount: 3840,
  medianRatio: 0.96,
  cod: 11.2,
  prd: 1.00,
  stabilityScore: 78,
  riskScore: 28,
  exceptionCount: 9,
  exceptionRate: 0.023,
  complianceStatus: 'IaaoCompliant',
};

function setNbhd(code: string | null, rows: NeighborhoodRollupRowDto[] = [MOCK_NBHD_ROW]) {
  act(() => {
    useCountyStudioStore.getState().setNeighborhoodRollup(rows);
    useCountyStudioStore.setState({ selectedNeighborhood: code });
  });
}

beforeEach(() => {
  act(() => {
    useCountyStudioStore.getState().setNeighborhoodRollup([]);
    useCountyStudioStore.setState({ selectedNeighborhood: null });
  });
});

describe('NeighborhoodInspector', () => {
  it('shows "Select a neighborhood to inspect" when none selected', () => {
    setNbhd(null);
    render(<NeighborhoodInspector />);
    expect(screen.queryByTestId('neighborhood-inspector')).not.toBeInTheDocument();
    expect(screen.getByText(/select a neighborhood to inspect/i)).toBeInTheDocument();
  });

  it('shows empty state when selectedNeighborhood has no matching row', () => {
    act(() => {
      useCountyStudioStore.getState().setNeighborhoodRollup([MOCK_NBHD_ROW]);
      useCountyStudioStore.setState({ selectedNeighborhood: 'NBHD-MISSING' });
    });
    render(<NeighborhoodInspector />);
    expect(screen.queryByTestId('neighborhood-inspector')).not.toBeInTheDocument();
  });

  it('renders neighborhood-inspector panel when row matches', () => {
    setNbhd('NBHD-WR01');
    render(<NeighborhoodInspector />);
    expect(screen.getByTestId('neighborhood-inspector')).toBeInTheDocument();
    expect(screen.getByText('West Richland Estates')).toBeInTheDocument();
  });

  it('shows city, segment count, and parcel count in sub-header', () => {
    setNbhd('NBHD-WR01');
    render(<NeighborhoodInspector />);
    const panel = screen.getByTestId('neighborhood-inspector');
    expect(panel).toHaveTextContent('West Richland');
    expect(panel).toHaveTextContent('2 segments');
    expect(panel).toHaveTextContent('3,840');
  });

  it('compliance lamp has data-status="IaaoCompliant"', () => {
    setNbhd('NBHD-WR01');
    render(<NeighborhoodInspector />);
    const lamp = screen.getByTestId('nbhd-compliance-lamp');
    expect(lamp).toHaveAttribute('data-status', 'IaaoCompliant');
    expect(lamp).toHaveTextContent('IAAO Compliant');
  });

  it('compliance lamp reflects MarginalCompliance', () => {
    const marginal: NeighborhoodRollupRowDto = {
      ...MOCK_NBHD_ROW,
      complianceStatus: 'MarginalCompliance',
    };
    setNbhd('NBHD-WR01', [marginal]);
    render(<NeighborhoodInspector />);
    const lamp = screen.getByTestId('nbhd-compliance-lamp');
    expect(lamp).toHaveAttribute('data-status', 'MarginalCompliance');
    expect(lamp).toHaveTextContent('Marginal Compliance');
  });

  it('compliance lamp reflects NonCompliant', () => {
    const bad: NeighborhoodRollupRowDto = {
      ...MOCK_NBHD_ROW,
      complianceStatus: 'NonCompliant',
    };
    setNbhd('NBHD-WR01', [bad]);
    render(<NeighborhoodInspector />);
    expect(screen.getByTestId('nbhd-compliance-lamp')).toHaveAttribute('data-status', 'NonCompliant');
  });

  it('renders stability score metric row', () => {
    setNbhd('NBHD-WR01');
    render(<NeighborhoodInspector />);
    expect(screen.getByText('Stability Score')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
  });

  it('shows "—" for null median ratio / COD / PRD', () => {
    const nullMetrics: NeighborhoodRollupRowDto = {
      ...MOCK_NBHD_ROW,
      medianRatio: null,
      cod: null,
      prd: null,
    };
    setNbhd('NBHD-WR01', [nullMetrics]);
    render(<NeighborhoodInspector />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });
});

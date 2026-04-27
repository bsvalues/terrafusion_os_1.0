// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/CityInspector.test.tsx
//
// Unit tests for CityInspector.
// Covers: empty state when no city selected, metrics displayed when a city row
// is found, compliance lamp status attribute, worstSegmentName visibility.

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CityInspector } from '../components/CityInspector';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CityRollupRowDto } from '../types/countyStudio.types';

const navigateMock = vi.fn();
const activateModuleMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/orchestration/moduleActivation', () => ({
  default: (...args: unknown[]) => activateModuleMock(...args),
}));

const MOCK_CITY_ROW: CityRollupRowDto = {
  city: 'West Richland',
  segmentCount: 4,
  parcelCount: 12480,
  medianRatio: 0.97,
  cod: 13.5,
  prd: 1.01,
  exceptionCount: 22,
  exceptionRate: 0.018,
  worstSegmentName: 'WR-R3 South',
  worstSegmentMedianRatio: 0.84,
  complianceStatus: 'IaaoCompliant',
};

function setup(selectedCity: string | null, rows: CityRollupRowDto[] = [MOCK_CITY_ROW]) {
  act(() => {
    useCountyStudioStore.getState().setCityRollup(rows);
    useCountyStudioStore.getState().drillToCity(selectedCity ?? '__none__');
    if (!selectedCity) {
      // Reset selection without changing drill level by directly setting store state
      useCountyStudioStore.setState({ selectedCity: null });
    }
  });
}

beforeEach(() => {
  act(() => {
    useCountyStudioStore.getState().setCityRollup([]);
    useCountyStudioStore.setState({
      selectedCity: null,
      activeStudy: {
        studyId: 'study-benton-2026',
        countyId: 'benton',
        countyName: 'Benton County',
        taxYear: 2026,
        studyType: 'AnnualRevaluation',
        status: 'InProgress',
      },
    });
  });
  navigateMock.mockReset();
  activateModuleMock.mockReset();
});

describe('CityInspector', () => {
  it('shows "Select a city to inspect" when no city is selected', () => {
    setup(null);
    render(<CityInspector />);
    expect(screen.queryByTestId('city-inspector')).not.toBeInTheDocument();
    expect(screen.getByText(/select a city to inspect/i)).toBeInTheDocument();
  });

  it('shows "Select a city to inspect" when selectedCity has no matching row', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
      useCountyStudioStore.setState({ selectedCity: 'Nonexistent City' });
    });
    render(<CityInspector />);
    expect(screen.queryByTestId('city-inspector')).not.toBeInTheDocument();
  });

  it('renders city-inspector panel when a matching row is found', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
      useCountyStudioStore.setState({ selectedCity: 'West Richland' });
    });
    render(<CityInspector />);
    expect(screen.getByTestId('city-inspector')).toBeInTheDocument();
    expect(screen.getByText('West Richland')).toBeInTheDocument();
  });

  it('displays parcel count and segment count', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
      useCountyStudioStore.setState({ selectedCity: 'West Richland' });
    });
    render(<CityInspector />);
    expect(screen.getByTestId('city-inspector')).toHaveTextContent('12,480');
    expect(screen.getByTestId('city-inspector')).toHaveTextContent('4 segments');
  });

  it('compliance lamp has data-status="IaaoCompliant" and shows compliant label', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
      useCountyStudioStore.setState({ selectedCity: 'West Richland' });
    });
    render(<CityInspector />);
    const lamp = screen.getByTestId('city-compliance-lamp');
    expect(lamp).toHaveAttribute('data-status', 'IaaoCompliant');
    expect(lamp).toHaveTextContent('IAAO Compliant');
  });

  it('compliance lamp reflects NonCompliant status', () => {
    const nonCompliant: CityRollupRowDto = {
      ...MOCK_CITY_ROW,
      medianRatio: 0.78,
      complianceStatus: 'NonCompliant',
    };
    act(() => {
      useCountyStudioStore.getState().setCityRollup([nonCompliant]);
      useCountyStudioStore.setState({ selectedCity: 'West Richland' });
    });
    render(<CityInspector />);
    const lamp = screen.getByTestId('city-compliance-lamp');
    expect(lamp).toHaveAttribute('data-status', 'NonCompliant');
    expect(lamp).toHaveTextContent('Non-compliant');
  });

  it('shows worst segment section when worstSegmentName is present', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
      useCountyStudioStore.setState({ selectedCity: 'West Richland' });
    });
    render(<CityInspector />);
    // segmentIdentity.formatOperationalPrimary now prefixes neighborhood codes
    // with "Neighborhood ", so match the bare code via partial regex.
    expect(screen.getAllByText(/WR-R3 South/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Worst segment/i)).toBeInTheDocument();
  });

  it('hides worst segment section when worstSegmentName is null', () => {
    const noWorst: CityRollupRowDto = { ...MOCK_CITY_ROW, worstSegmentName: null, worstSegmentMedianRatio: null };
    act(() => {
      useCountyStudioStore.getState().setCityRollup([noWorst]);
      useCountyStudioStore.setState({ selectedCity: 'West Richland' });
    });
    render(<CityInspector />);
    expect(screen.queryByText(/Worst segment/i)).not.toBeInTheDocument();
  });

  it('shows "—" for null metric values', () => {
    const nullMetrics: CityRollupRowDto = {
      ...MOCK_CITY_ROW,
      medianRatio: null,
      cod: null,
      prd: null,
    };
    act(() => {
      useCountyStudioStore.getState().setCityRollup([nullMetrics]);
      useCountyStudioStore.setState({ selectedCity: 'West Richland' });
    });
    render(<CityInspector />);
    // All three metric rows with null values show "—"
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('routes city scope to Atlas Live', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
      useCountyStudioStore.setState({ selectedCity: 'West Richland' });
    });
    render(<CityInspector />);
    fireEvent.click(screen.getByTestId('city-inspector-handoff-atlas'));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining('/forge/atlas-live?')
    );
    expect(navigateMock.mock.calls[0]?.[0]).toContain('countyId=benton');
    expect(navigateMock.mock.calls[0]?.[0]).toContain('city=West+Richland');
  });

  it('routes city scope into downstream forge modules', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
      useCountyStudioStore.setState({ selectedCity: 'West Richland' });
    });
    render(<CityInspector />);

    fireEvent.click(screen.getByTestId('city-inspector-handoff-salesforge'));
    fireEvent.click(screen.getByTestId('city-inspector-handoff-costforge'));
    fireEvent.click(screen.getByTestId('city-inspector-handoff-compsforge'));

    expect(activateModuleMock).toHaveBeenNthCalledWith(1, 'sales-forge', expect.objectContaining({
      source: 'system',
      metadata: expect.objectContaining({
        countyId: 'benton',
        city: 'West Richland',
        rollupScope: 'city',
      }),
    }));
    expect(activateModuleMock).toHaveBeenNthCalledWith(2, 'costforge', expect.objectContaining({
      metadata: expect.objectContaining({
        countyId: 'benton',
        city: 'West Richland',
        rollupScope: 'city',
      }),
    }));
    expect(activateModuleMock).toHaveBeenNthCalledWith(3, 'comps-forge', expect.objectContaining({
      metadata: expect.objectContaining({
        countyId: 'benton',
        city: 'West Richland',
        rollupScope: 'city',
      }),
    }));
  });

  it('keeps parcel workbench disabled at city scope', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([MOCK_CITY_ROW]);
      useCountyStudioStore.setState({ selectedCity: 'West Richland' });
    });
    render(<CityInspector />);
    expect(screen.getByTestId('city-inspector-handoff-workbench-disabled')).toBeDisabled();
  });
});

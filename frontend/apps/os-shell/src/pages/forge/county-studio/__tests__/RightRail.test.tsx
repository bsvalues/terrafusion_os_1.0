// frontend/apps/os-shell/src/pages/forge/county-studio/__tests__/RightRail.test.tsx
//
// Unit tests for RightRail.
// Covers: default tab (Inspector), tab switching (Scenario / Compare / Govnc),
// InspectorForScope routing based on drillLevel and selectedSegmentId.

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RightRail } from '../components/RightRail';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

// Mock all child panel components so tab-switching tests remain isolated.
vi.mock('../components/ObjectInspector', () => ({
  ObjectInspector: () => <div data-testid="mock-object-inspector" />,
}));
vi.mock('../components/CityInspector', () => ({
  CityInspector: () => <div data-testid="mock-city-inspector" />,
}));
vi.mock('../components/NeighborhoodInspector', () => ({
  NeighborhoodInspector: () => <div data-testid="mock-neighborhood-inspector" />,
}));
vi.mock('../components/ScenarioWorksheet', () => ({
  ScenarioWorksheet: () => <div data-testid="mock-scenario-worksheet" />,
}));
vi.mock('../components/ScenarioCompareGrid', () => ({
  ScenarioCompareGrid: () => <div data-testid="mock-scenario-compare-grid" />,
}));
vi.mock('../components/AdjustmentSetPanel', () => ({
  AdjustmentSetPanel: () => <div data-testid="mock-adjustment-set-panel" />,
}));

function setDrillState({
  drillLevel = 'county',
  selectedSegmentId = null,
}: {
  drillLevel?: 'county' | 'city' | 'neighborhood';
  selectedSegmentId?: string | null;
} = {}) {
  act(() => {
    useCountyStudioStore.setState({ drillLevel, selectedSegmentId });
  });
}

beforeEach(() => {
  setDrillState();
});

describe('RightRail — tab switching', () => {
  it('shows Inspector content by default', () => {
    render(<RightRail />);
    expect(screen.getByTestId('mock-object-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-scenario-worksheet')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-scenario-compare-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-adjustment-set-panel')).not.toBeInTheDocument();
  });

  it('clicking Scenario tab shows ScenarioWorksheet', () => {
    render(<RightRail />);
    fireEvent.click(screen.getByText('Scenario'));
    expect(screen.getByTestId('mock-scenario-worksheet')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-object-inspector')).not.toBeInTheDocument();
  });

  it('clicking Compare tab shows ScenarioCompareGrid', () => {
    render(<RightRail />);
    fireEvent.click(screen.getByText('Compare'));
    expect(screen.getByTestId('mock-scenario-compare-grid')).toBeInTheDocument();
  });

  it('clicking Govnc tab shows AdjustmentSetPanel', () => {
    render(<RightRail />);
    fireEvent.click(screen.getByText('Govnc'));
    expect(screen.getByTestId('mock-adjustment-set-panel')).toBeInTheDocument();
  });

  it('clicking back to Inspector from Scenario shows Inspector again', () => {
    render(<RightRail />);
    fireEvent.click(screen.getByText('Scenario'));
    fireEvent.click(screen.getByText('Inspector'));
    expect(screen.getByTestId('mock-object-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-scenario-worksheet')).not.toBeInTheDocument();
  });

  it('renders all four tab buttons', () => {
    render(<RightRail />);
    expect(screen.getByText('Inspector')).toBeInTheDocument();
    expect(screen.getByText('Scenario')).toBeInTheDocument();
    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.getByText('Govnc')).toBeInTheDocument();
  });
});

describe('RightRail — InspectorForScope routing', () => {
  it('renders ObjectInspector at county drill with no segment selected', () => {
    setDrillState({ drillLevel: 'county', selectedSegmentId: null });
    render(<RightRail />);
    expect(screen.getByTestId('mock-object-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-city-inspector')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-neighborhood-inspector')).not.toBeInTheDocument();
  });

  it('renders CityInspector when drillLevel=city and no segment selected', () => {
    setDrillState({ drillLevel: 'city', selectedSegmentId: null });
    render(<RightRail />);
    expect(screen.getByTestId('mock-city-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-object-inspector')).not.toBeInTheDocument();
  });

  it('renders NeighborhoodInspector when drillLevel=neighborhood and no segment selected', () => {
    setDrillState({ drillLevel: 'neighborhood', selectedSegmentId: null });
    render(<RightRail />);
    expect(screen.getByTestId('mock-neighborhood-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-object-inspector')).not.toBeInTheDocument();
  });

  it('renders ObjectInspector when a segment is selected regardless of drillLevel', () => {
    setDrillState({ drillLevel: 'neighborhood', selectedSegmentId: 'seg-42' });
    render(<RightRail />);
    expect(screen.getByTestId('mock-object-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-neighborhood-inspector')).not.toBeInTheDocument();
  });

  it('renders ObjectInspector when segment selected at city drillLevel', () => {
    setDrillState({ drillLevel: 'city', selectedSegmentId: 'seg-7' });
    render(<RightRail />);
    expect(screen.getByTestId('mock-object-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-city-inspector')).not.toBeInTheDocument();
  });
});

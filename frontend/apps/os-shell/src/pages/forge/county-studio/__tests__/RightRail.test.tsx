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

const openMock = vi.fn();

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
  vi.stubGlobal('open', openMock);
  openMock.mockClear();
  act(() => {
    useCountyStudioStore.getState().setStudy({
      studyId: 'study-1',
      countyId: 'benton',
      countyName: 'Benton County',
      taxYear: 2026,
      studyType: 'RatioStudy',
      status: 'Active',
      baselineVersion: null,
      activeSegmentSetId: 'set-1',
      createdAt: '',
      updatedAt: '',
      createdBy: 'test',
      updatedBy: 'test',
    });
    useCountyStudioStore.getState().setCohorts([]);
    useCountyStudioStore.getState().setScenarios([]);
    useCountyStudioStore.getState().setSegments([
      {
        segmentId: 'seg-42',
        segmentSetId: 'set-1',
        name: 'NBHD-K1 · R1 · STANDARD',
        segmentType: 'Residential',
        parcelCount: 412,
        medianRatio: 0.97,
        cod: 14.2,
        prd: 1.01,
        stabilityScore: 72,
        riskScore: 35,
        exceptionCount: 8,
        geographyRef: 'NBHD-K1',
        revalArea: 2,
        modelGroup: 'MG-12',
        valueTier: 'Upper',
      },
    ]);
  });
  setDrillState();
});

describe('RightRail — Prometheus command actions', () => {
  it('opens the diagnosis rail TerraAtlas action in a browser window with valuation context', () => {
    setDrillState({ drillLevel: 'county', selectedSegmentId: null });
    render(<RightRail />);

    fireEvent.click(screen.getByRole('button', { name: 'Open in TerraAtlas' }));

    expect(openMock).toHaveBeenCalledWith(expect.stringContaining('/forge/atlas-live?'), '_blank', 'noopener,noreferrer');
    const [url] = openMock.mock.calls[0];
    const params = new URL(String(url), 'http://localhost').searchParams;
    expect(params.get('countyId')).toBe('benton');
    expect(params.get('taxYear')).toBe('2026');
    expect(params.get('studyId')).toBe('study-1');
    expect(params.get('source')).toBe('county-studio');
    expect(params.get('selectedRiskObject')).toBe('seg-42');
    expect(params.get('segmentId')).toBe('seg-42');
    expect(params.get('neighborhoodCode')).toBe('NBHD-K1');
    expect(params.get('revalArea')).toBe('2');
    expect(params.get('modelGroup')).toBe('MG-12');
    expect(params.get('valueTier')).toBe('Upper');
    expect(params.has('city')).toBe(false);
    expect(params.has('selectedCity')).toBe(false);
  });
});

describe('RightRail — tab switching', () => {
  it('shows the Prometheus diagnosis card by default', () => {
    render(<RightRail />);
    expect(screen.getByTestId('prometheus-decision-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-object-inspector')).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByText('Governance'));
    expect(screen.getByTestId('mock-adjustment-set-panel')).toBeInTheDocument();
  });

  it('clicking back to Inspector from Scenario shows Inspector again', () => {
    render(<RightRail />);
    fireEvent.click(screen.getByText('Scenario'));
    fireEvent.click(screen.getByText('Inspector'));
    expect(screen.getByTestId('prometheus-decision-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-scenario-worksheet')).not.toBeInTheDocument();
  });

  it('renders all four tab buttons', () => {
    render(<RightRail />);
    expect(screen.getByText('Inspector')).toBeInTheDocument();
    expect(screen.getByText('Scenario')).toBeInTheDocument();
    expect(screen.getByText('Compare')).toBeInTheDocument();
    expect(screen.getByText('Governance')).toBeInTheDocument();
  });

  it('renders scope and active panel summary above the tabs', () => {
    render(<RightRail />);
    expect(screen.getByTestId('right-rail-scope-label')).toHaveTextContent('Benton County');
    expect(screen.getByTestId('right-rail-panel-summary')).toHaveTextContent(/route corrective action/i);
    fireEvent.click(screen.getByText('Scenario'));
    expect(screen.getByTestId('right-rail-panel-summary')).toHaveTextContent(/preview impact before saving/i);
  });
});

describe('RightRail — InspectorForScope routing', () => {
  it('renders the Prometheus diagnosis card at county drill with no segment selected', () => {
    setDrillState({ drillLevel: 'county', selectedSegmentId: null });
    render(<RightRail />);
    expect(screen.getByTestId('prometheus-decision-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-object-inspector')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-city-inspector')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-neighborhood-inspector')).not.toBeInTheDocument();
  });

  it('keeps the Prometheus diagnosis card active when drillLevel=city and no segment selected', () => {
    setDrillState({ drillLevel: 'city', selectedSegmentId: null });
    render(<RightRail />);
    expect(screen.getByTestId('prometheus-decision-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-city-inspector')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-object-inspector')).not.toBeInTheDocument();
  });

  it('keeps the Prometheus diagnosis card active when drillLevel=neighborhood and no segment selected', () => {
    setDrillState({ drillLevel: 'neighborhood', selectedSegmentId: null });
    render(<RightRail />);
    expect(screen.getByTestId('prometheus-decision-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-neighborhood-inspector')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-object-inspector')).not.toBeInTheDocument();
  });

  it('renders ObjectInspector when a segment is selected regardless of drillLevel', () => {
    setDrillState({ drillLevel: 'neighborhood', selectedSegmentId: 'seg-42' });
    render(<RightRail />);
    expect(screen.getByTestId('mock-object-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-neighborhood-inspector')).not.toBeInTheDocument();
    expect(screen.getByTestId('right-rail-scope-label')).toHaveTextContent('Neighborhood NBHD-K1 · Reval 2');
  });

  it('renders ObjectInspector when segment selected at city drillLevel', () => {
    setDrillState({ drillLevel: 'city', selectedSegmentId: 'seg-7' });
    render(<RightRail />);
    expect(screen.getByTestId('mock-object-inspector')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-city-inspector')).not.toBeInTheDocument();
  });
});

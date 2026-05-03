import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { AtlasLivePage } from '../AtlasLivePage';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';
import { vi } from 'vitest';

vi.mock('../hooks/useAtlasLiveHub', () => ({
  useAtlasLiveHub: () => ({
    sendSelection: vi.fn(),
  }),
}));

vi.mock('../hooks/useAtlasMapData', () => ({
  useAtlasMapData: () => ({
    countyContext: {
      contractId: 'county_data_trust_launch_context_v1',
      countyId: '19190019-1919-1919-1919-191919191919',
      countyName: 'Benton',
      countyCode: '005',
      segmentId: 'seg-1',
      neighborhoodCode: '13011',
      studyId: 'study-1234',
      taxYear: 2026,
      primarySourceMode: 'local_pacs_mirror',
      prometheusStatus: 'automated_with_review',
      latestSaleDate: '2026-01-13',
      stagedSales: 59559,
      needsReview: 730,
      detailRoute: '/launch-data/washington/counties/005.json',
      salesRoute: '/launch-data/washington/sales/by-county/005.json',
      geometryAvailability: 'compatibility',
      geometryMessage: 'Compatibility geometry feed active.',
      trustTier: 'production_provisional',
      trustLabel: 'Production Provisional',
      dataTrustBadges: ['Production Provisional', 'Sync-Derived', 'Converted Legacy Sensitive'],
      databasePosture: 'TerraFusion.Benton.Operational + TerraFusion.Benton.LegacyBridge',
      launchContextPosture: 'Benton operational/provisional lane.',
      productionClaimAllowed: false,
      dataTrustMessage: 'Benton is operational/provisional and sync-derived.',
    },
    outlines: null,
    parcels: null,
    loading: false,
    error: null,
    scopeMessage: 'Compatibility geometry feed active.',
  }),
}));

describe('AtlasLivePage', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/forge/atlas-live?studyId=study-1234&countyId=19190019-1919-1919-1919-191919191919&countyName=Benton&segmentId=seg-1&neighborhoodCode=13011&taxYear=2026');
    act(() => {
      useAtlasLiveStore.setState({
        studyId: null,
        countyId: null,
        countyName: null,
        countyCode: null,
        segmentId: null,
        neighborhoodCode: null,
        syncState: 'DISCONNECTED',
        activeTool: 'none',
        lassoActive: false,
        activeOverlays: [],
        bbox: null,
        zoom: 10,
      });
    });
  });

  it('renders the Atlas Live View header', () => {
    render(<AtlasLivePage />);
    expect(screen.getByText(/Atlas Live View/i)).toBeInTheDocument();
  });

  it('renders the route scope with county context', () => {
    render(<AtlasLivePage />);
    expect(screen.getByTestId('atlas-route-scope')).toHaveTextContent('County: Benton');
    expect(screen.getByTestId('atlas-route-scope')).toHaveTextContent('Segment: seg-1');
  });

  it('renders the county context card', () => {
    render(<AtlasLivePage />);
    expect(screen.getByTestId('atlas-county-context')).toHaveTextContent('Benton County · 005');
  });

  it('renders county data trust contract posture', () => {
    render(<AtlasLivePage />);
    const posture = screen.getByTestId('atlas-county-trust-posture');
    expect(posture).toHaveAttribute('data-contract-id', 'county_data_trust_launch_context_v1');
    expect(posture).toHaveAttribute('data-trust-tier', 'production_provisional');
    expect(posture).toHaveTextContent('Production Provisional');
    expect(posture).toHaveTextContent('TerraFusion.Benton.Operational');
  });

  it('renders the sync badge', () => {
    render(<AtlasLivePage />);
    expect(screen.getByTestId('atlas-sync-badge')).toBeInTheDocument();
  });

  it('renders the scope message', () => {
    render(<AtlasLivePage />);
    expect(screen.getByTestId('atlas-scope-message')).toHaveTextContent('Compatibility geometry feed active.');
  });

  it('renders the map surface placeholder', () => {
    render(<AtlasLivePage />);
    expect(screen.getByTestId('atlas-map-surface')).toBeInTheDocument();
  });

  it('renders the toolbar', () => {
    render(<AtlasLivePage />);
    expect(screen.getByTestId('atlas-toolbar')).toBeInTheDocument();
  });

  it('Lasso tool button toggles lasso mode in store', () => {
    act(() => {
      useAtlasLiveStore.getState().setActiveTool('none');
    });
    render(<AtlasLivePage />);
    const lassoBtn = screen.getByRole('button', { name: /Lasso/i });
    fireEvent.click(lassoBtn);
    expect(useAtlasLiveStore.getState().activeTool).toBe('lasso');
  });
});

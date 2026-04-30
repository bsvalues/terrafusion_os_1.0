import React from 'react';
import { render } from '@testing-library/react';
import { act } from 'react';
import { AtlasOverlayManager } from '../components/AtlasOverlayManager';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';

describe('AtlasOverlayManager', () => {
  beforeEach(() => {
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

  it('stamps metric overlays with segment-derivation contract metadata', () => {
    const map = {
      isStyleLoaded: () => true,
      setFeatureState: vi.fn(),
      removeFeatureState: vi.fn(),
    };

    act(() => {
      useAtlasLiveStore.getState().addOverlay({
        id: 'median-ratio',
        type: 'metric-overlay',
        metricKey: 'medianRatio',
        values: [{ parcelId: 'parcel-1', value: 0.91 }],
        styleHints: {},
      });
    });

    render(<AtlasOverlayManager map={map} />);

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'parcels', id: 'parcel-1' },
      expect.objectContaining({
        atlasOverlayActive: true,
        atlasContractId: 'terraforge_segment_derivation_v1',
        atlasSourcePopulation: 'segment_derivation.medianRatio',
        atlasTrustPosture: 'contract-backed overlay projection',
      }),
    );
  });

  it('preserves explicit overlay contract metadata from the projection', () => {
    const map = {
      isStyleLoaded: () => true,
      setFeatureState: vi.fn(),
      removeFeatureState: vi.fn(),
    };

    act(() => {
      useAtlasLiveStore.getState().addOverlay({
        id: 'compat',
        type: 'compare-overlay',
        metricKey: 'medianRatio',
        values: [{ parcelId: 'parcel-2', value: 0.72 }],
        styleHints: {},
        contractId: 'terraforge_statistics_compat_v1',
        sourcePopulation: 'statistics_ratio_study_compat_v1 shared population',
        trustPosture: 'Benton production provisional',
      });
    });

    render(<AtlasOverlayManager map={map} />);

    expect(map.setFeatureState).toHaveBeenCalledWith(
      { source: 'parcels', id: 'parcel-2' },
      expect.objectContaining({
        atlasContractId: 'terraforge_statistics_compat_v1',
        atlasSourcePopulation: 'statistics_ratio_study_compat_v1 shared population',
        atlasTrustPosture: 'Benton production provisional',
      }),
    );
  });
});

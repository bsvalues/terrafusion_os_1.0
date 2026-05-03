import { act } from '@testing-library/react';

beforeEach(() => {
  vi.resetModules();
});

describe('atlasLiveStore — initial state', () => {
  it('starts disconnected with no study and no overlays', async () => {
    const { useAtlasLiveStore } = await import('@/stores/atlasLiveStore');
    const state = useAtlasLiveStore.getState();
    expect(state.studyId).toBeNull();
    expect(state.countyId).toBeNull();
    expect(state.countyName).toBeNull();
    expect(state.countyCode).toBeNull();
    expect(state.segmentId).toBeNull();
    expect(state.neighborhoodCode).toBeNull();
    expect(state.syncState).toBe('DISCONNECTED');
    expect(state.activeOverlays).toEqual([]);
    expect(state.activeTool).toBe('none');
    expect(state.lassoActive).toBe(false);
  });
});

describe('atlasLiveStore — actions', () => {
  it('setStudyId updates studyId', async () => {
    const { useAtlasLiveStore } = await import('@/stores/atlasLiveStore');
    act(() => {
      useAtlasLiveStore.getState().setStudyId('study-abc');
    });
    expect(useAtlasLiveStore.getState().studyId).toBe('study-abc');
  });

  it('setCountyScope updates county, segment, and neighborhood route context', async () => {
    const { useAtlasLiveStore } = await import('@/stores/atlasLiveStore');
    act(() => {
      useAtlasLiveStore.getState().setCountyScope({
        countyId: 'cid-1',
        countyName: 'Benton',
        countyCode: '005',
        segmentId: 'seg-1',
        neighborhoodCode: '13011',
      });
    });
    expect(useAtlasLiveStore.getState().countyId).toBe('cid-1');
    expect(useAtlasLiveStore.getState().countyName).toBe('Benton');
    expect(useAtlasLiveStore.getState().countyCode).toBe('005');
    expect(useAtlasLiveStore.getState().segmentId).toBe('seg-1');
    expect(useAtlasLiveStore.getState().neighborhoodCode).toBe('13011');
  });

  it('setSyncState transitions correctly', async () => {
    const { useAtlasLiveStore } = await import('@/stores/atlasLiveStore');
    act(() => {
      useAtlasLiveStore.getState().setSyncState('LIVE');
    });
    expect(useAtlasLiveStore.getState().syncState).toBe('LIVE');
  });

  it('addOverlay appends overlay and removeOverlay removes it', async () => {
    const { useAtlasLiveStore } = await import('@/stores/atlasLiveStore');
    act(() => {
      useAtlasLiveStore.getState().addOverlay({
        id: 'overlay-1',
        type: 'metric-overlay',
        metricKey: 'ratio',
        values: [],
        styleHints: {},
      });
    });
    expect(useAtlasLiveStore.getState().activeOverlays).toHaveLength(1);

    act(() => {
      useAtlasLiveStore.getState().removeOverlay('overlay-1');
    });
    expect(useAtlasLiveStore.getState().activeOverlays).toHaveLength(0);
  });

  it('setActiveTool switches tool', async () => {
    const { useAtlasLiveStore } = await import('@/stores/atlasLiveStore');
    act(() => {
      useAtlasLiveStore.getState().setActiveTool('lasso');
    });
    expect(useAtlasLiveStore.getState().activeTool).toBe('lasso');
  });

  it('clearOverlays empties overlay list', async () => {
    const { useAtlasLiveStore } = await import('@/stores/atlasLiveStore');
    act(() => {
      useAtlasLiveStore.getState().addOverlay({
        id: 'o1',
        type: 'scenario-delta',
        metricKey: null,
        values: [],
        styleHints: {},
      });
      useAtlasLiveStore.getState().clearOverlays();
    });
    expect(useAtlasLiveStore.getState().activeOverlays).toHaveLength(0);
  });
});

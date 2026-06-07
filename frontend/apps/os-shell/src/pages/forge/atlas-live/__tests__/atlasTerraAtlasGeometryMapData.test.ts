import { describe, expect, it, vi } from 'vitest';

describe('fetchTerraAtlasParcelGeometryMapData', () => {
  it('reads TerraAtlas parcel geometry through the Atlas Live geometry route with study context', async () => {
    vi.resetModules();
    const apiFetchJson = vi.fn().mockResolvedValue({
      outlines: null,
      parcels: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    vi.doMock('@/lib/apiBase', () => ({
      apiFetchJson,
    }));

    const { fetchTerraAtlasParcelGeometryMapData } = await import('../atlasLiveApi');
    const signal = new AbortController().signal;

    await fetchTerraAtlasParcelGeometryMapData({
      countyId: '19190019-1919-1919-1919-191919191919',
      taxYear: 2026,
      studyId: 'study-1',
      segmentId: 'seg-1',
      neighborhoodCode: '13011',
      limit: 5000,
      signal,
    });

    expect(apiFetchJson).toHaveBeenCalledWith(
      '/atlas-live/geometry/parcels?countyId=19190019-1919-1919-1919-191919191919&taxYear=2026&studyId=study-1&segmentId=seg-1&neighborhoodCode=13011&limit=5000',
      { signal },
    );
  });
});

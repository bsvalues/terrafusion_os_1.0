import { describe, expect, it, vi } from 'vitest';
import type { ParcelTileCollection } from '../../geo/v2/v2Api';

const MOCK_PARCELS: ParcelTileCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [] },
      properties: {
        parcelId: 'P1',
        neighborhoodCode: '13011',
        assessedValue: 350000,
        propertyClass: 'Residential',
        areaAcres: 0.25,
        yearBuilt: 1994,
        situsAddress: '100 Main St',
        primaryUse: 'SFR',
        saleDate: '2026-01-01',
        salePrice: 345000,
        qualDecision: 'Qualified',
        ratio: 1.01,
        nbhdMedianRatio: 0.99,
        ratioDeviation: 0.02,
        isOutlier: false,
      },
    },
  ],
};

describe('fetchAtlasCompatibilityMapData', () => {
  it('returns parcel geometry when neighborhood outline loading stalls', async () => {
    vi.resetModules();
    vi.doMock('../../geo/v2/v2Api', () => ({
      fetchNbhdOutlines: vi.fn(() => new Promise(() => undefined)),
      fetchParcelTiles: vi.fn(() => Promise.resolve(MOCK_PARCELS)),
    }));

    const { fetchAtlasCompatibilityMapData } = await import('../atlasLiveApi');

    const result = await Promise.race([
      fetchAtlasCompatibilityMapData('005', 2026, null, undefined, 50),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timed out')), 200)),
    ]);

    expect(result.outlines).toBeNull();
    expect(result.parcels?.features).toHaveLength(1);
  });
});

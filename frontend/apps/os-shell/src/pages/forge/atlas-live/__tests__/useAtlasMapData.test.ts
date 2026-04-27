import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useAtlasMapData } from '../hooks/useAtlasMapData';
import * as atlasApi from '../atlasLiveApi';
import type { NbhdOutlineCollection, ParcelTileCollection } from '../../geo/v2/v2Api';

const MOCK_SCOPE = {
  studyId: 'study-1',
  countyId: '19190019-1919-1919-1919-191919191919',
  countyName: 'Benton',
  countyCode: null,
  segmentId: 'seg-1',
  neighborhoodCode: '13011',
  taxYear: 2026,
} as const;

const MOCK_CONTEXT = {
  countyId: '19190019-1919-1919-1919-191919191919',
  countyName: 'Benton',
  countyCode: '005',
  segmentId: 'seg-1',
  neighborhoodCode: '13011',
  studyId: 'study-1',
  taxYear: 2026,
  primarySourceMode: 'local_pacs_mirror',
  prometheusStatus: 'automated_with_review',
  latestSaleDate: '2026-01-13',
  stagedSales: 59559,
  needsReview: 730,
  detailRoute: '/launch-data/washington/counties/005.json',
  salesRoute: '/launch-data/washington/sales/by-county/005.json',
  geometryAvailability: 'compatibility' as const,
  geometryMessage: 'Compatibility geometry feed active.',
};

const MOCK_OUTLINES = {
  type: 'FeatureCollection' as const,
  features: [{ type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [] }, properties: { neighborhoodCode: '13011' } }],
};

const MOCK_PARCELS = {
  type: 'FeatureCollection' as const,
  features: [{ type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [] }, properties: { parcelId: 'P1' } }],
};

describe('useAtlasMapData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads county context before compatibility geometry', async () => {
    const contextSpy = vi.spyOn(atlasApi, 'fetchAtlasCountyContext')
      .mockResolvedValue(MOCK_CONTEXT);
    const geometrySpy = vi.spyOn(atlasApi, 'fetchAtlasCompatibilityMapData')
      .mockResolvedValue({
        outlines: MOCK_OUTLINES as unknown as NbhdOutlineCollection,
        parcels: MOCK_PARCELS as unknown as ParcelTileCollection,
      });

    const { result } = renderHook(() => useAtlasMapData(MOCK_SCOPE));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(contextSpy).toHaveBeenCalledWith(MOCK_SCOPE, expect.any(AbortSignal));
    expect(geometrySpy).toHaveBeenCalledWith('005', 2026, '13011', expect.any(AbortSignal));
    expect(result.current.countyContext?.countyCode).toBe('005');
    expect(result.current.outlines).not.toBeNull();
    expect(result.current.parcels).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('stays county-scoped but geometry-empty when the county has no published map lane', async () => {
    vi.spyOn(atlasApi, 'fetchAtlasCountyContext').mockResolvedValue({
      ...MOCK_CONTEXT,
      countyName: 'Spokane',
      countyCode: '063',
      geometryAvailability: 'unpublished',
      geometryMessage: 'County geometry is not yet published.',
    });
    const geometrySpy = vi.spyOn(atlasApi, 'fetchAtlasCompatibilityMapData');

    const { result } = renderHook(() => useAtlasMapData({
      ...MOCK_SCOPE,
      countyName: 'Spokane',
      countyCode: '063',
    }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.countyContext?.countyCode).toBe('063');
    expect(result.current.outlines).toBeNull();
    expect(result.current.parcels).toBeNull();
    expect(result.current.scopeMessage).toContain('not yet published');
    expect(geometrySpy).not.toHaveBeenCalled();
  });

  it('shows a scoped-entry message when opened without county context', async () => {
    const { result } = renderHook(() => useAtlasMapData({
      studyId: null,
      countyId: null,
      countyName: null,
      countyCode: null,
      segmentId: null,
      neighborhoodCode: null,
      taxYear: 2026,
    }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.countyContext).toBeNull();
    expect(result.current.scopeMessage).toContain('Open Atlas Live View from County Studio');
    expect(result.current.error).toBeNull();
  });

  it('surfaces county-context errors cleanly', async () => {
    vi.spyOn(atlasApi, 'fetchAtlasCountyContext').mockRejectedValue(new Error('status 500'));

    const { result } = renderHook(() => useAtlasMapData(MOCK_SCOPE));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toContain('status 500');
    expect(result.current.outlines).toBeNull();
    expect(result.current.parcels).toBeNull();
  });
});

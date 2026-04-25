// useAtlasMapData — unit tests for the Atlas map-data loader.
//
// Verifies:
//   - Both fetchers are invoked with the requested taxYear on mount
//   - Fulfilled values flow to outlines/parcels state
//   - Loading flag transitions true → false
//   - A single-endpoint failure does not clear the other endpoint's data
//   - Both-endpoints-failed sets a human error message
//   - Changing taxYear triggers a refetch with the new value

import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useAtlasMapData } from '../hooks/useAtlasMapData';
import * as v2Api from '../../geo/v2/v2Api';

const MOCK_OUTLINES = {
  type: 'FeatureCollection' as const,
  features: [{ type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [] }, properties: { neighborhoodCode: 'A1' } }],
};

const MOCK_PARCELS = {
  type: 'FeatureCollection' as const,
  features: [{ type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [] }, properties: { parcelId: 'P1' } }],
};

describe('useAtlasMapData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches outlines and parcels in parallel with the requested taxYear', async () => {
    const outlinesSpy = vi.spyOn(v2Api, 'fetchNbhdOutlines')
      .mockResolvedValue(MOCK_OUTLINES as unknown as v2Api.NbhdOutlineCollection);
    const parcelsSpy = vi.spyOn(v2Api, 'fetchParcelTiles')
      .mockResolvedValue(MOCK_PARCELS as unknown as v2Api.ParcelTileCollection);

    const { result } = renderHook(() => useAtlasMapData(2026));

    expect(result.current.loading).toBe(true);
    expect(result.current.outlines).toBeNull();
    expect(result.current.parcels).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(outlinesSpy).toHaveBeenCalledWith(2026, expect.any(AbortSignal));
    expect(parcelsSpy).toHaveBeenCalledWith(expect.objectContaining({ taxYear: 2026, limit: 5000 }));
    expect(result.current.outlines).not.toBeNull();
    expect(result.current.parcels).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('preserves parcels when only outlines fails', async () => {
    vi.spyOn(v2Api, 'fetchNbhdOutlines').mockRejectedValue(new Error('outlines 500'));
    vi.spyOn(v2Api, 'fetchParcelTiles')
      .mockResolvedValue(MOCK_PARCELS as unknown as v2Api.ParcelTileCollection);

    const { result } = renderHook(() => useAtlasMapData(2026));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.outlines).toBeNull();
    expect(result.current.parcels).not.toBeNull();
    // Error is NOT set because parcels succeeded — partial data is still useful.
    expect(result.current.error).toBeNull();
  });

  it('sets error only when both endpoints fail', async () => {
    vi.spyOn(v2Api, 'fetchNbhdOutlines').mockRejectedValue(new Error('outlines 500'));
    vi.spyOn(v2Api, 'fetchParcelTiles').mockRejectedValue(new Error('parcels 500'));

    const { result } = renderHook(() => useAtlasMapData(2026));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.outlines).toBeNull();
    expect(result.current.parcels).toBeNull();
    expect(result.current.error).toMatch(/Map data unavailable/);
    expect(result.current.error).toContain('outlines 500');
  });

  it('refetches with new taxYear when taxYear changes', async () => {
    const outlinesSpy = vi.spyOn(v2Api, 'fetchNbhdOutlines')
      .mockResolvedValue(MOCK_OUTLINES as unknown as v2Api.NbhdOutlineCollection);
    vi.spyOn(v2Api, 'fetchParcelTiles')
      .mockResolvedValue(MOCK_PARCELS as unknown as v2Api.ParcelTileCollection);

    const { rerender, result } = renderHook(({ year }) => useAtlasMapData(year), {
      initialProps: { year: 2026 },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(outlinesSpy).toHaveBeenLastCalledWith(2026, expect.any(AbortSignal));

    rerender({ year: 2025 });
    await waitFor(() => expect(outlinesSpy).toHaveBeenLastCalledWith(2025, expect.any(AbortSignal)));
  });

  it('passes neighborhoodCode filter through when supplied', async () => {
    vi.spyOn(v2Api, 'fetchNbhdOutlines')
      .mockResolvedValue(MOCK_OUTLINES as unknown as v2Api.NbhdOutlineCollection);
    const parcelsSpy = vi.spyOn(v2Api, 'fetchParcelTiles')
      .mockResolvedValue(MOCK_PARCELS as unknown as v2Api.ParcelTileCollection);

    const { result } = renderHook(() => useAtlasMapData(2026, 'HOOD-42'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(parcelsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ taxYear: 2026, neighborhoodCode: 'HOOD-42' }),
    );
  });
});

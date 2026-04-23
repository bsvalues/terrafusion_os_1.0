// useAtlasMapData — loads canonical neighborhood outlines + parcel tiles from
// the GeoForge v2 endpoints so AtlasLivePage can render real Benton County
// geometry instead of an empty basemap.
//
// Inputs:
//   taxYear (default 2026)
//   neighborhoodCode (optional filter; null = county-wide)
//
// Output:
//   { outlines, parcels, loading, error }
//
// Cancellation: abort controllers tied to effect lifecycle — if the component
// unmounts or taxYear/neighborhoodCode changes mid-flight, in-flight requests
// are aborted so stale responses don't overwrite fresher ones.

import { useEffect, useState } from 'react';
import {
  fetchNbhdOutlines,
  fetchParcelTiles,
  type NbhdOutlineCollection,
  type ParcelTileCollection,
} from '../../geo/v2/v2Api';

export interface AtlasMapData {
  outlines: NbhdOutlineCollection | null;
  parcels: ParcelTileCollection | null;
  loading: boolean;
  error: string | null;
}

export function useAtlasMapData(
  taxYear: number = 2026,
  neighborhoodCode: string | null = null,
): AtlasMapData {
  const [outlines, setOutlines] = useState<NbhdOutlineCollection | null>(null);
  const [parcels,  setParcels]  = useState<ParcelTileCollection | null>(null);
  const [loading,  setLoading]  = useState<boolean>(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setError(null);

    // Fire both fetches in parallel; settle independently so a failure on one
    // doesn't orphan the other.
    Promise.allSettled([
      fetchNbhdOutlines(taxYear, controller.signal),
      fetchParcelTiles({
        taxYear,
        neighborhoodCode,
        limit: 5000,   // Benton ≈ 89K parcels; cap the first-load tile set for
                       // performance. Viewport-bound pagination is a future enhancement.
        signal: controller.signal,
      }),
    ])
      .then(([outlinesResult, parcelsResult]) => {
        if (cancelled) return;

        if (outlinesResult.status === 'fulfilled') {
          setOutlines(outlinesResult.value);
        } else {
          // Don't clobber parcels with the outlines error; capture it and move on.
          console.warn('[useAtlasMapData] outline fetch failed:', outlinesResult.reason);
        }

        if (parcelsResult.status === 'fulfilled') {
          setParcels(parcelsResult.value);
        } else {
          console.warn('[useAtlasMapData] parcel fetch failed:', parcelsResult.reason);
        }

        // Only flag the combined call as failed if BOTH endpoints errored —
        // a partial result still renders a useful map (outlines alone is fine).
        if (outlinesResult.status === 'rejected' && parcelsResult.status === 'rejected') {
          const msg = String(outlinesResult.reason?.message ?? outlinesResult.reason ?? 'unknown error');
          setError(`Map data unavailable: ${msg}`);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [taxYear, neighborhoodCode]);

  return { outlines, parcels, loading, error };
}

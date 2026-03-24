import { useState, useEffect, useCallback } from 'react';

export interface PacsProperty {
  propId: number;
  geoId: string;
  address: string;
  ownerName: string;
  assessedValue: number;
  marketValue: number;
  landValue: number;
  improvementValue: number;
  propertyType: string;
  legalDescription: string;
  appraisalYear: number | null;
  lastModified: string | null;
  source: string;
}

interface PropertyLookupState {
  data: PacsProperty | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches a single property by geo_id (parcel ID).
 * Uses the /api/properties/parcel/{geoId} endpoint (TerraFusion native store).
 * Falls back to /ops/pacs/property/{geoId} if the primary endpoint fails.
 */
export function usePropertyLookup(geoId: string | undefined) {
  const [state, setState] = useState<PropertyLookupState>({
    data: null,
    loading: !!geoId,
    error: null,
  });

  const fetchProperty = useCallback(async (id: string) => {
    setState({ data: null, loading: true, error: null });
    try {
      const res = await fetch(`/api/properties/parcel/${encodeURIComponent(id)}`);
      // Fall back to PACS ops endpoint for parcels not in native store or when auth is not available
      if (res.status === 404 || res.status === 401 || res.status === 403) {
        const fallback = await fetch(`/ops/pacs/property/${encodeURIComponent(id)}`);
        if (fallback.status === 404) {
          setState({ data: null, loading: false, error: `No property found for ${id}` });
          return;
        }
        if (!fallback.ok) {
          const body = await fallback.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${fallback.status}`);
        }
        const data: PacsProperty = await fallback.json();
        setState({ data, loading: false, error: null });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data: PacsProperty = await res.json();
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Property lookup failed';
      setState({ data: null, loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    if (geoId) {
      fetchProperty(geoId);
    } else {
      setState({ data: null, loading: false, error: null });
    }
  }, [geoId, fetchProperty]);

  return { ...state, refetch: geoId ? () => fetchProperty(geoId) : undefined };
}

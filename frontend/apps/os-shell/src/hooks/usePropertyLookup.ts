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
 * Fetches a single property from PACS by geo_id (parcel ID).
 * Uses the /ops/pacs/property/{geoId} endpoint backed by real SQL Server data.
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
      const res = await fetch(`/ops/pacs/property/${encodeURIComponent(id)}`);
      if (res.status === 404) {
        setState({ data: null, loading: false, error: `No property found for ${id}` });
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

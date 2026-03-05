/**
 * useDossierDetails.ts
 *
 * CX-25: Fetch structured parcel dossier details from the backend.
 * Follows the useState + useCallback pattern from useCostForgeAPI.
 *
 * Features:
 * - Auto-fetches on parcelId change
 * - Handles nullable sections (selective ?include= support)
 * - Exposes correlationId from response for trace linking
 * - Supports manual refetch
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DossierDetailsOptions, DossierDetailsResponse } from '../contracts/dossierDetails';
import { dossierService } from '../services/dossierService';

// ============================================================================
// Types
// ============================================================================

export interface DossierDetailsError {
  message: string;
  code?: string;
}

export interface UseDossierDetailsResult {
  data: DossierDetailsResponse | null;
  loading: boolean;
  error: DossierDetailsError | null;
  /** Server-echoed correlation ID for trace linking. */
  correlationId: string | null;
  /** Trigger a fresh fetch. */
  refetch: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetch structured dossier details for a parcel.
 *
 * @param parcelId - The parcel to fetch details for (null = idle, no fetch).
 * @param options  - Optional: include, levyLimit, noteLimit.
 */
export function useDossierDetails(
  parcelId: string | null,
  options?: DossierDetailsOptions,
): UseDossierDetailsResult {
  const [data, setData] = useState<DossierDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<DossierDetailsError | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);

  // Track the active parcelId to prevent stale closures after unmount / parcel change
  const activeParcelRef = useRef<string | null>(null);

  // Stable serialization of options for dependency tracking
  const optionsKey = options
    ? `${options.include || ''}_${options.levyLimit ?? ''}_${options.noteLimit ?? ''}`
    : '';

  const fetchDetails = useCallback(
    async (pid: string) => {
      // Guard: bail if parcelId changed while we were waiting
      if (activeParcelRef.current !== pid) return;

      setLoading(true);
      setError(null);

      try {
        const result = await dossierService.getDetails(pid, options);

        // Guard after async
        if (activeParcelRef.current !== pid) return;

        setData(result.data);
        setCorrelationId(result.data.correlationId || result.correlationId);
      } catch (err) {
        // Guard after async
        if (activeParcelRef.current !== pid) return;

        const msg = err instanceof Error ? err.message : String(err);
        setError({
          message: msg,
          code: msg.includes('404') ? 'NOT_FOUND' : 'FETCH_ERROR',
        });
        setData(null);
        setCorrelationId(null);
      } finally {
        // Guard after async
        if (activeParcelRef.current !== pid) return;
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [optionsKey],
  );

  // Auto-fetch when parcelId or options change
  useEffect(() => {
    if (!parcelId) {
      activeParcelRef.current = null;
      setData(null);
      setLoading(false);
      setError(null);
      setCorrelationId(null);
      return;
    }

    activeParcelRef.current = parcelId;
    fetchDetails(parcelId);
  }, [parcelId, fetchDetails]);

  const refetch = useCallback(() => {
    if (!parcelId) return;
    activeParcelRef.current = parcelId;
    fetchDetails(parcelId);
  }, [parcelId, fetchDetails]);

  return { data, loading, error, correlationId, refetch };
}

/**
 * useParcelSearch — API-backed parcel search for CommandPalette
 *
 * Debounces user input, calls the Atlas parcel search API,
 * and returns results for display in the command palette.
 *
 * @module shell/command-palette/useParcelSearch
 * @see Slice 7.3: CommandPalette Parcel Search
 */

import { useEffect, useRef, useState } from 'react';
import { atlasService, type ParcelResult } from '../../services/atlasService';

// ============================================================================
// Types
// ============================================================================

export interface ParcelSearchResult {
  parcelNumber: string;
  address: string;
  ownerName: string;
}

export interface UseParcelSearchReturn {
  results: ParcelSearchResult[];
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;
const PAGE_SIZE = 5;

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Searches parcels by address/owner via the Atlas API.
 *
 * - Only fires when `enabled` is true and query has >= 3 characters
 * - Debounces by 300ms
 * - Cancels in-flight requests when query changes
 * - Returns empty results + error string on failure (never throws)
 */
export function useParcelSearch(query: string, enabled: boolean): UseParcelSearchReturn {
  const [results, setResults] = useState<ParcelSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous debounce timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    const trimmed = query.trim();

    // Don't search if disabled, too short, or all-digits (handled by existing shortcut)
    if (!enabled || trimmed.length < MIN_QUERY_LENGTH || /^\d+$/.test(trimmed)) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await atlasService.searchParcels({
          query: trimmed,
          limit: PAGE_SIZE,
        });

        // If aborted while awaiting, discard result
        if (controller.signal.aborted) return;

        setResults(
          response.results.map((r: ParcelResult) => ({
            parcelNumber: r.parcelId,
            address: r.address,
            ownerName: r.owner,
          }))
        );
        setError(null);
      } catch (err: unknown) {
        // Ignore abort errors
        if (err instanceof DOMException && err.name === 'AbortError') return;

        setResults([]);
        setError('Parcel search failed');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    // Cleanup on unmount or dependency change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [query, enabled]);

  return { results, isLoading, error };
}

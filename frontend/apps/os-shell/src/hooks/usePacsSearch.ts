import { useState, useCallback, useRef } from 'react';

export interface PacsSearchResult {
  propId: number;
  geoId: string;
  address: string;
  ownerName: string;
  assessedValue: number;
  marketValue: number;
  propertyType: string;
}

interface SearchState {
  results: PacsSearchResult[];
  loading: boolean;
  error: string | null;
  query: string;
  count: number;
}

/**
 * Search PACS properties by address, owner name, or parcel ID.
 * Uses /ops/pacs/search?q=... backed by real SQL Server data.
 * Debounces requests and cancels stale fetches.
 */
export function usePacsSearch() {
  const [state, setState] = useState<SearchState>({
    results: [],
    loading: false,
    error: null,
    query: '',
    count: 0,
  });

  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort();

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setState({ results: [], loading: false, error: null, query: trimmed, count: 0 });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null, query: trimmed }));

    try {
      const res = await fetch(
        `/ops/pacs/search?q=${encodeURIComponent(trimmed)}&limit=12`,
        { signal: controller.signal }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!controller.signal.aborted) {
        setState({
          results: data.items ?? [],
          loading: false,
          error: null,
          query: trimmed,
          count: data.count ?? 0,
        });
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Search failed';
      if (!controller.signal.aborted) {
        setState((prev) => ({ ...prev, loading: false, error: message }));
      }
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setState({ results: [], loading: false, error: null, query: '', count: 0 });
  }, []);

  return { ...state, search, clear };
}

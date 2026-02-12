import { useMemo } from 'react';
import Fuse from 'fuse.js';

export interface FuzzySearchOptions {
  keys: Array<{ name: string; weight: number }>;
  threshold?: number;
  minMatchCharLength?: number;
  includeScore?: boolean;
}

export function useFuzzySearch<T>(
  data: T[] | undefined,
  searchQuery: string,
  options: FuzzySearchOptions
) {
  const fuse = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    
    return new Fuse(data, {
      keys: options.keys,
      threshold: options.threshold || 0.4,
      includeScore: options.includeScore || true,
      minMatchCharLength: options.minMatchCharLength || 2
    });
  }, [data, options]);

  const results = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    if (!searchQuery || searchQuery.length < (options.minMatchCharLength || 2) || !fuse) {
      return data.slice(0, 20);
    }
    
    const fuseResults = fuse.search(searchQuery);
    return fuseResults.map(result => result.item).slice(0, 20);
  }, [searchQuery, fuse, data, options.minMatchCharLength]);

  return { results, isSearching: !!searchQuery };
}
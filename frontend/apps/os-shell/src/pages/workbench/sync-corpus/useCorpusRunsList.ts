import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCorpusRecentRuns, type RecentRunEntry } from '@/api/syncCorpus';

export function useCorpusRunsList(): {
  runs: RecentRunEntry[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
} {
  const query = useQuery({
    queryKey: ['sync-corpus-runs'],
    queryFn: ({ signal }) => getCorpusRecentRuns(10, signal),
  });

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    runs: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : null,
    refresh,
  };
}

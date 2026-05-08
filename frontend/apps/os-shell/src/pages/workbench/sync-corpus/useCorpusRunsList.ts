/**
 * SYNC-UX-1C: hook returning the local "recent runs" list.
 *
 * Backend has no list-runs endpoint, so the browser tracks the
 * last 10 runs it has issued via localStorage. This hook reads
 * that list once on mount and exposes a manual refresh.
 */

import { useCallback, useState } from 'react';
import { readRecentRuns, type RecentRunEntry } from '@/api/syncCorpus';

export function useCorpusRunsList(): {
  runs: RecentRunEntry[];
  refresh: () => void;
} {
  const [runs, setRuns] = useState<RecentRunEntry[]>(() => readRecentRuns());
  const refresh = useCallback(() => {
    setRuns(readRecentRuns());
  }, []);
  return { runs, refresh };
}

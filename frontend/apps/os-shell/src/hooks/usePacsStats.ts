import { useState, useEffect } from 'react';

export interface PacsStats {
  totalProperties: number;
  totalAssessedValue: number;
  totalMarketValue: number;
  source: string;
}

/**
 * Fetches aggregate PACS statistics (total properties, assessed/market value).
 * Uses /ops/pacs/stats backed by real SQL Server data.
 * Fetches once on mount.
 */
export function usePacsStats() {
  const [stats, setStats] = useState<PacsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/ops/pacs/stats');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        const data: PacsStats = await res.json();
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Stats fetch failed');
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { stats, loading, error };
}

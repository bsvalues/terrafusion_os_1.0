import { useEffect, useRef, useState } from 'react';

export interface LaneStatus {
  model: string;
  endpoint: string;
  live: boolean;
  latencyMs: number | null;
}

interface RouterStatusResponse {
  lanes: Record<string, LaneStatus>;
  fallbackActive: boolean;
}

export interface MuseLaneStatusResult {
  lanes: Record<string, LaneStatus> | null;
  fallbackActive: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const POLL_MS = 30_000;

export function useMuseLaneStatus(): MuseLaneStatusResult {
  const [lanes, setLanes] = useState<Record<string, LaneStatus> | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/pilot/router/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as RouterStatusResponse;
      setLanes(data.lanes);
      setFallbackActive(data.fallbackActive);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch router status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
    timerRef.current = setInterval(() => void fetchStatus(), POLL_MS);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { lanes, fallbackActive, loading, error, lastUpdated };
}

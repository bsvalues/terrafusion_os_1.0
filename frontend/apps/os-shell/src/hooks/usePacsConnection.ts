/**
 * usePacsConnection — Shared hook for PACS connection state
 * ===================================================================
 * Polls /ops/pacs/proof every 60 s and provides live connection status
 * to all suite modules. Uses the pacsService for graceful degradation.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { pacsService, type PacsConnectionStatus } from '@/services/pacsService';

const POLL_INTERVAL_MS = 60_000;

const INITIAL_STATUS: PacsConnectionStatus = {
  connected: false,
  contractValid: false,
  dbName: '',
  server: '',
  totalProperties: 0,
  latencyMs: -1,
  lastVerifiedUtc: '',
  errors: [],
  warnings: [],
};

export function usePacsConnection() {
  const [status, setStatus] = useState<PacsConnectionStatus>(INITIAL_STATUS);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const result = await pacsService.getConnectionStatus();
    setStatus(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  return { status, loading, refresh };
}

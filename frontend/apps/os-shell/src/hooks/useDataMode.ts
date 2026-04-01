/**
 * TerraFusion OS — useDataMode Hook
 *
 * Returns the current data mode (live/mock), connection status,
 * and last health check timestamp. Used by taskbar indicator and
 * any component needing mode awareness.
 */

import { useState, useEffect, useCallback } from 'react';

export interface DataModeState {
  mode: 'live' | 'mock';
  connected: boolean;
  lastHealthCheck: Date | null;
  checking: boolean;
}

const HEALTH_CHECK_INTERVAL = 30_000; // 30 seconds

export function useDataMode(): DataModeState {
  const [state, setState] = useState<DataModeState>({
    mode: 'mock',
    connected: false,
    lastHealthCheck: null,
    checking: false,
  });

  const checkHealth = useCallback(async () => {
    setState((s) => ({ ...s, checking: true }));
    try {
      const res = await fetch('/health/live', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const isLive = res.ok;
      setState({
        mode: isLive ? 'live' : 'mock',
        connected: isLive,
        lastHealthCheck: new Date(),
        checking: false,
      });
    } catch {
      setState({
        mode: 'mock',
        connected: false,
        lastHealthCheck: new Date(),
        checking: false,
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return state;
}

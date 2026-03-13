/**
 * useCanonConnection — Pilot runtime connectivity + tool inventory hook.
 *
 * Polls GET /pilot/health on mount and at interval.
 * Caches tool list from GET /pilot/tools on first successful health check.
 *
 * @module canon/useCanonConnection
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { getPilotHealth, listPilotTools, type PilotHealthResponse, type PilotTool } from '../api/pilotApi';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface CanonConnection {
  status: ConnectionStatus;
  health: PilotHealthResponse | null;
  tools: PilotTool[];
  toolCount: number;
  error: string | null;
  refresh: () => void;
}

const POLL_INTERVAL_MS = 15_000;

export function useCanonConnection(): CanonConnection {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [health, setHealth] = useState<PilotHealthResponse | null>(null);
  const [tools, setTools] = useState<PilotTool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const toolsLoadedRef = useRef(false);

  const check = useCallback(async () => {
    try {
      const h = await getPilotHealth();
      if (!mountedRef.current) return;
      setHealth(h);
      setStatus('connected');
      setError(null);

      // Load tools once on first successful connection
      if (!toolsLoadedRef.current) {
        try {
          const toolList = await listPilotTools();
          if (!mountedRef.current) return;
          setTools(toolList.tools);
          toolsLoadedRef.current = true;
        } catch {
          // Non-fatal: health is up but tools endpoint failed
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus('disconnected');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const refresh = useCallback(() => {
    toolsLoadedRef.current = false;
    void check();
  }, [check]);

  useEffect(() => {
    mountedRef.current = true;
    void check();
    const timer = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [check]);

  return {
    status,
    health,
    tools,
    toolCount: tools.length,
    error,
    refresh,
  };
}

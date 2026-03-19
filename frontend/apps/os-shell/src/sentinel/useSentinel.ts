import { useEffect, useRef } from 'react';
import { probeHealth } from './sentinelProbe';
import { useSentinelStore } from './sentinelStore';
import { createLogger } from '@/hooks/useLogger';

const logger = createLogger('Sentinel');

type SentinelStatus = 'healthy' | 'degraded' | 'down';

let probeStarted = false;
let probeIntervalId: number | null = null;
let probeInFlight = false;

export function useSentinel(pollMs = 7000) {
  const {
    status,
    lastPingAt,
    latencyMs,
    apiBase,
    endpoint,
    buildSha,
    env,
    warnings,
    intentFilter,
    moduleCountTotal,
    moduleCountActive,
    moduleCountFilteredOut,
    systemComponents,
    setProbeResult,
  } = useSentinelStore();

  const lastStatusRef = useRef<SentinelStatus>(status);

  useEffect(() => {
    if (probeStarted) return;
    probeStarted = true;

    const runProbe = async () => {
      if (probeInFlight) return;
      probeInFlight = true;

      const result = await probeHealth(endpoint, 1500);
      const now = Date.now();

      setProbeResult({
        status: result.status,
        lastPingAt: now,
        latencyMs: result.latencyMs,
        warnings: result.warnings,
        intentFilter: result.intentFilter,
        moduleCountTotal: result.moduleCountTotal,
        moduleCountActive: result.moduleCountActive,
        moduleCountFilteredOut: result.moduleCountFilteredOut,
        systemComponents: result.systemComponents,
      });

      if (lastStatusRef.current !== result.status) {
        const prev = lastStatusRef.current;
        lastStatusRef.current = result.status;
        logger.info('status change', { from: prev, to: result.status, endpoint, latencyMs: result.latencyMs, warnings: result.warnings });
      }

      probeInFlight = false;
    };

    runProbe();
    probeIntervalId = window.setInterval(runProbe, pollMs);

    return () => {
      if (probeIntervalId) window.clearInterval(probeIntervalId);
      probeIntervalId = null;
      probeStarted = false;
    };
  }, [endpoint, pollMs, setProbeResult]);

  return {
    status,
    lastPingAt,
    latencyMs,
    apiBase,
    endpoint,
    buildSha,
    env,
    warnings,
    intentFilter,
    moduleCountTotal,
    moduleCountActive,
    moduleCountFilteredOut,
    systemComponents,
  };
}

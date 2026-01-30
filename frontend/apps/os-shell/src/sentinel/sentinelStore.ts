import { create } from 'zustand';
import { buildApiUrl } from '../lib/apiBase';
import { getViteEnv } from '../shared/viteEnv';

type SentinelStatus = 'healthy' | 'degraded' | 'down';

type SentinelState = {
  status: SentinelStatus;
  lastPingAt: number | null;
  latencyMs: number | null;
  apiBase: string;
  endpoint: string;
  buildSha: string;
  env: string;
  warnings: string[];
  intentFilter: string | null;
  moduleCountTotal: number | null;
  moduleCountActive: number | null;
  moduleCountFilteredOut: number | null;
  systemComponents: Record<string, boolean> | null;
  panelOpen: boolean;
  setProbeResult: (input: {
    status: SentinelStatus;
    lastPingAt: number | null;
    latencyMs: number | null;
    warnings: string[];
    intentFilter: string | null;
    moduleCountTotal: number | null;
    moduleCountActive: number | null;
    moduleCountFilteredOut: number | null;
    systemComponents: Record<string, boolean> | null;
  }) => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  clearWarnings: () => void;
};

// Use centralized apiBase module for governance-compliant URL resolution
const env = getViteEnv();
const defaultApiBase = '/api';
const defaultEndpoint = buildApiUrl('/system/health');

export const useSentinelStore = create<SentinelState>((set) => ({
  status: 'degraded',
  lastPingAt: null,
  latencyMs: null,
  apiBase: defaultApiBase,
  endpoint: defaultEndpoint,
  buildSha: env.VITE_BUILD_SHA || 'dev',
  env: env.MODE || 'development',
  warnings: [],
  intentFilter: null,
  moduleCountTotal: null,
  moduleCountActive: null,
  moduleCountFilteredOut: null,
  systemComponents: null,
  panelOpen: false,
  setProbeResult: ({
    status,
    lastPingAt,
    latencyMs,
    warnings,
    intentFilter,
    moduleCountTotal,
    moduleCountActive,
    moduleCountFilteredOut,
    systemComponents,
  }) =>
    set({
      status,
      lastPingAt,
      latencyMs,
      warnings,
      intentFilter,
      moduleCountTotal,
      moduleCountActive,
      moduleCountFilteredOut,
      systemComponents,
    }),
  setPanelOpen: (open) => set({ panelOpen: open }),
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  clearWarnings: () => set({ warnings: [] }),
}));

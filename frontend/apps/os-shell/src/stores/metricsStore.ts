import { create } from 'zustand';
import { systemAPI } from '../services/systemAPI';

export interface KPI {
  id: string;
  label: string;
  value: string | number;
  delta?: string;
  status: 'verified' | 'pending' | 'anomaly';
  trend?: number[]; // For sparkline
}

interface MetricsStore {
  kpis: KPI[];
  status: 'idle' | 'loading' | 'ok' | 'error';
  error: string | null;

  setKpis: (kpis: KPI[]) => void;
  setStatus: (status: MetricsStore['status']) => void;
  setError: (error: string | null) => void;
  refresh: () => Promise<void>;
}

/** Convert governed API health response into display KPIs without inferred telemetry. */
function buildKpis(health: Record<string, unknown>, stats: Record<string, unknown> | null): KPI[] {
  const status = typeof health.status === 'string' ? health.status : 'Unavailable';
  const moduleCount = typeof health.moduleCount === 'number' ? health.moduleCount : 0;
  const healthyModules = typeof health.healthyModules === 'number' ? health.healthyModules : 0;
  const totalModules =
    typeof health.moduleCountTotal === 'number' ? health.moduleCountTotal : moduleCount;
  const activeModules =
    typeof health.moduleCountActive === 'number' ? health.moduleCountActive : healthyModules;
  const warnings = Array.isArray(health.warnings) ? health.warnings : [];
  const systemComponents =
    health.systemComponents && typeof health.systemComponents === 'object'
      ? (health.systemComponents as Record<string, boolean>)
      : {};
  const unhealthyComponents = Object.values(systemComponents).filter((healthy) => !healthy).length;
  const statusNormalized = status.toLowerCase();
  const healthStatus: KPI['status'] =
    statusNormalized === 'healthy' ? 'verified' : statusNormalized === 'degraded' ? 'pending' : 'anomaly';

  const kpis: KPI[] = [
    { id: 'health', label: 'System Health', value: status, status: healthStatus },
    {
      id: 'modules',
      label: 'Active Modules',
      value: `${activeModules}/${totalModules}`,
      status: activeModules > 0 && activeModules === totalModules ? 'verified' : 'pending',
    },
    {
      id: 'orchestration',
      label: 'Healthy Modules',
      value: `${healthyModules}/${moduleCount}`,
      status: healthyModules === moduleCount ? 'verified' : 'pending',
    },
    {
      id: 'warnings',
      label: 'Health Warnings',
      value: warnings.length,
      status: warnings.length === 0 ? 'verified' : 'pending',
      delta: unhealthyComponents > 0 ? `${unhealthyComponents} unhealthy component(s)` : undefined,
    },
  ];

  // Merge stats if available (e.g. agent count, parcel count)
  if (stats && typeof stats === 'object') {
    if (typeof stats['activeAgents'] === 'number') {
      kpis.push({ id: 'agents', label: 'Active Agents', value: (stats['activeAgents'] as number).toLocaleString(), status: 'verified' });
    }
    if (typeof stats['parcelCount'] === 'number') {
      kpis.push({ id: 'parcels', label: 'Parcels Indexed', value: (stats['parcelCount'] as number).toLocaleString(), status: 'verified' });
    }
  }

  return kpis;
}

export const useMetricsStore = create<MetricsStore>((set) => ({
  kpis: [],
  status: 'idle',
  error: null,

  setKpis: (kpis) => set({ kpis }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),

  refresh: async () => {
    set({ status: 'loading', error: null });
    try {
      // Fetch real data from system API (parallel)
      const [health, stats] = await Promise.allSettled([
        systemAPI.getSystemHealth(),
        systemAPI.getSystemStats(),
      ]);

      const healthData = health.status === 'fulfilled' ? health.value : {};
      const statsData = stats.status === 'fulfilled' ? stats.value : null;

      set({ kpis: buildKpis(healthData, statsData), status: 'ok' });
    } catch {
      set({ status: 'error', error: 'Failed to fetch metrics' });
    }
  },
}));

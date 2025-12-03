/**
 * WorkspaceActivityProvider – swappable data source for OS activity.
 *
 * Default implementation uses in-memory runtime store with static seeds.
 * Future: swap in Redux, query cache, AI swarm telemetry, WebSocket stream.
 */
import type { SystemWorkspaceActivityItem, WorkspaceActivityItem } from './types';

export interface WorkspaceActivityProvider {
  getRecentActivity(
    workspaceId: string,
    options?: { limit?: number }
  ): Promise<WorkspaceActivityItem[]>;

  recordActivity(
    workspaceId: string,
    entry: Omit<WorkspaceActivityItem, 'id' | 'timestamp'>
  ): Promise<void>;

  /**
   * OS-wide activity retrieval (optional).
   * Returns recent activity from ALL workspaces, sorted newest-first.
   * Providers that don't support OS-wide views can leave this undefined.
   */
  getAllRecentActivity?(options?: {
    limitPerWorkspace?: number;
  }): Promise<SystemWorkspaceActivityItem[]>;
}

/**
 * In-memory runtime store per workspace.
 * Starts with seed data, accumulates recorded activity.
 */
const RUNTIME_ACTIVITY: Map<string, WorkspaceActivityItem[]> = new Map();

/**
 * Static seed data for workspace initialization.
 */
const STATIC_SEEDS: Record<string, WorkspaceActivityItem[]> = {
  __default__: [
    {
      id: 'seed-bootstrap-1',
      timestamp: new Date().toISOString(),
      summary: 'Workspace initialized',
      type: 'info',
      source: 'OS Core',
      kind: 'system_event',
    },
    {
      id: 'seed-health-1',
      timestamp: new Date().toISOString(),
      summary: 'Health check: nominal',
      type: 'info',
      source: 'Telemetry',
      kind: 'health_update',
    },
  ],
  home: [
    {
      id: 'home-bootstrap-1',
      timestamp: new Date().toISOString(),
      summary: 'Home workspace ready',
      type: 'info',
      source: 'OS Core',
      kind: 'system_event',
    },
    {
      id: 'home-swarm-1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      summary: 'AI swarm coordination check completed',
      type: 'info',
      source: 'AI Swarm',
      kind: 'system_event',
    },
    {
      id: 'home-health-1',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      summary: 'System heartbeat nominal',
      type: 'info',
      source: 'System Monitor',
      kind: 'health_update',
    },
  ],
  quantumLab: [
    {
      id: 'ql-init-1',
      timestamp: new Date().toISOString(),
      summary: 'Quantum Lab initialized',
      type: 'info',
      source: 'OS Core',
      kind: 'system_event',
    },
    {
      id: 'ql-harmony-1',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      summary: 'Harmony mode engaged',
      type: 'info',
      source: 'Quantum Engine',
      kind: 'system_event',
    },
    {
      id: 'ql-drift-1',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      summary: 'Model drift within tolerance (0.07σ)',
      type: 'info',
      source: 'Drift Monitor',
      kind: 'health_update',
    },
  ],
};

/** Maximum activity items per workspace to prevent unbounded growth */
const MAX_PER_WORKSPACE = 100;

/**
 * Generate a unique activity ID.
 */
const generateActivityId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Get or initialize the activity list for a workspace.
 */
const getOrInitWorkspaceActivity = (workspaceId: string): WorkspaceActivityItem[] => {
  const key = workspaceId || '__default__';

  if (!RUNTIME_ACTIVITY.has(key)) {
    // Seed with static data on first access
    const seeds = STATIC_SEEDS[key] ?? STATIC_SEEDS.__default__ ?? [];
    RUNTIME_ACTIVITY.set(key, [...seeds]);
  }

  return RUNTIME_ACTIVITY.get(key) ?? [];
};

/**
 * Default provider – in-memory with read + write support.
 */
export const defaultWorkspaceActivityProvider: WorkspaceActivityProvider = {
  async getRecentActivity(workspaceId, options) {
    const limit = options?.limit ?? 20;
    const items = getOrInitWorkspaceActivity(workspaceId);
    // Return newest first (reverse of chronological order)
    return [...items].reverse().slice(0, limit);
  },

  async recordActivity(workspaceId, entry) {
    const key = workspaceId || '__default__';
    const list = getOrInitWorkspaceActivity(key);

    const item: WorkspaceActivityItem = {
      id: generateActivityId(),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Append and trim to max
    const updated = [...list, item].slice(-MAX_PER_WORKSPACE);
    RUNTIME_ACTIVITY.set(key, updated);
  },

  async getAllRecentActivity(options) {
    const limitPerWorkspace = options?.limitPerWorkspace ?? 20;
    const result: SystemWorkspaceActivityItem[] = [];

    for (const [workspaceId, items] of RUNTIME_ACTIVITY.entries()) {
      // Take the most recent items per workspace
      const recent = items.slice(-limitPerWorkspace);
      for (const item of recent) {
        result.push({ workspaceId, item });
      }
    }

    // Sort newest first across all workspaces
    result.sort(
      (a, b) => new Date(b.item.timestamp).getTime() - new Date(a.item.timestamp).getTime()
    );

    return result;
  },
};

// Global active provider – swappable at runtime for tests or real infra
let activeProvider: WorkspaceActivityProvider = defaultWorkspaceActivityProvider;

/**
 * Replace the active provider (useful for tests or real telemetry backends).
 */
export const setWorkspaceActivityProvider = (provider: WorkspaceActivityProvider): void => {
  activeProvider = provider;
};

/**
 * Get the current active provider.
 */
export const getWorkspaceActivityProvider = (): WorkspaceActivityProvider => activeProvider;

/**
 * Reset to default provider (useful for test cleanup).
 */
export const resetWorkspaceActivityProvider = (): void => {
  activeProvider = defaultWorkspaceActivityProvider;
};

/**
 * Clear all runtime activity data (useful for test cleanup).
 */
export const clearRuntimeActivity = (): void => {
  RUNTIME_ACTIVITY.clear();
};

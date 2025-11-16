/**
 * useWorkspaceContext Hook
 * Detect and manage current workspace context
 */

import { useEffect, useState } from 'react';

export type WorkspaceType =
  | 'backend'
  | 'frontend'
  | 'portal'
  | 'tdc'
  | 'sdk'
  | 'config'
  | 'terrabuild'
  | 'marketplace'
  | 'root'
  | 'unknown';

export interface WorkspaceContext {
  type: WorkspaceType;
  name: string;
  path: string;
  environment: 'local' | 'dev' | 'staging' | 'prod';
  services: {
    api: boolean;
    consciousness: boolean;
    portal: boolean;
    rustIde: boolean;
  };
}

interface UseWorkspaceContextReturn {
  context: WorkspaceContext;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_CONTEXT: WorkspaceContext = {
  type: 'unknown',
  name: 'Unknown Workspace',
  path: '/',
  environment: 'local',
  services: {
    api: false,
    consciousness: false,
    portal: false,
    rustIde: false,
  },
};

export function useWorkspaceContext(): UseWorkspaceContextReturn {
  const [context, setContext] = useState<WorkspaceContext>(DEFAULT_CONTEXT);
  const [loading, setLoading] = useState(true);

  const detectWorkspace = async (): Promise<WorkspaceContext> => {
    try {
      // Try to fetch from backend API
      const response = await fetch('http://localhost:8787/api/workspaces/current', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          type: data.type || 'unknown',
          name: data.name || 'Unknown',
          path: data.path || '/',
          environment: data.environment || 'local',
          services: data.services || DEFAULT_CONTEXT.services,
        };
      }
    } catch (error) {
      console.warn('[WorkspaceContext] Failed to fetch from backend:', error);
    }

    // Fallback: detect from current URL/path
    const path = window.location.pathname;
    let type: WorkspaceType = 'portal'; // Default since we're in Portal
    let name = 'TerraFusion Command Portal';

    if (path.includes('/backend')) {
      type = 'backend';
      name = 'Backend Services';
    } else if (path.includes('/frontend')) {
      type = 'frontend';
      name = 'Frontend Applications';
    } else if (path.includes('/sdk')) {
      type = 'sdk';
      name = 'SDK Development';
    } else if (path.includes('/config')) {
      type = 'config';
      name = 'Configuration Management';
    }

    // Check service availability
    const services = await checkServices();

    return {
      type,
      name,
      path: path || '/',
      environment: detectEnvironment(),
      services,
    };
  };

  const checkServices = async () => {
    const checks = await Promise.allSettled([
      fetch('http://localhost:5000/api/health').then((r) => r.ok),
      fetch('http://localhost:3004/api/health').then((r) => r.ok),
      fetch('http://localhost:5173').then((r) => r.ok),
      fetch('http://localhost:8787/api/health').then((r) => r.ok),
    ]);

    return {
      api: checks[0].status === 'fulfilled' && checks[0].value,
      consciousness: checks[1].status === 'fulfilled' && checks[1].value,
      portal: checks[2].status === 'fulfilled' && checks[2].value,
      rustIde: checks[3].status === 'fulfilled' && checks[3].value,
    };
  };

  const detectEnvironment = (): 'local' | 'dev' | 'staging' | 'prod' => {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'local';
    } else if (hostname.includes('dev')) {
      return 'dev';
    } else if (hostname.includes('staging')) {
      return 'staging';
    } else {
      return 'prod';
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const newContext = await detectWorkspace();
      setContext(newContext);
    } catch (error) {
      console.error('[WorkspaceContext] Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    context,
    loading,
    refresh,
  };
}

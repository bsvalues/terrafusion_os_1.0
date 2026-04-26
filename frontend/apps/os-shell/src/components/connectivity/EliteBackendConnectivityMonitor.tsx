import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import EliteProgress from '@/components/ui/EliteProgress';
import { systemAPI } from '@/services/systemAPI';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EliteActivityIcon,
  EliteNetworkIcon,
  EliteServerIcon,
  EliteShieldIcon,
} from '../icons/EliteIcons';

interface SystemHealthResponse {
  status: string;
  moduleCount: number;
  healthyModules: number;
  systemComponents: Record<string, boolean>;
  warnings: string[];
  moduleCountTotal?: number | null;
  moduleCountActive?: number | null;
}

function normalizeHealth(raw: unknown): SystemHealthResponse {
  const data = raw as Partial<SystemHealthResponse> | null;
  if (!data || typeof data.status !== 'string') {
    throw new Error('Backend health response does not match /api/system/health.');
  }

  return {
    status: data.status,
    moduleCount: typeof data.moduleCount === 'number' ? data.moduleCount : 0,
    healthyModules: typeof data.healthyModules === 'number' ? data.healthyModules : 0,
    systemComponents:
      data.systemComponents && typeof data.systemComponents === 'object'
        ? data.systemComponents
        : {},
    warnings: Array.isArray(data.warnings) ? data.warnings : [],
    moduleCountTotal: data.moduleCountTotal ?? null,
    moduleCountActive: data.moduleCountActive ?? null,
  };
}

function getStatusColor(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'healthy') return 'text-green-400 bg-green-500/20 border-green-500/30';
  if (normalized === 'degraded') return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
  return 'text-red-400 bg-red-500/20 border-red-500/30';
}

const EliteBackendConnectivityMonitor: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    try {
      setError(null);
      const data = normalizeHealth(await systemAPI.getSystemHealth());
      setHealth(data);
      setLastCheck(new Date());
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : 'Backend health evidence is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
    const interval = setInterval(() => {
      void loadHealth();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadHealth]);

  const componentEntries = useMemo(() => Object.entries(health?.systemComponents ?? {}), [health]);
  const connectedComponents = componentEntries.filter(([, isHealthy]) => isHealthy).length;
  const totalComponents = componentEntries.length;
  const componentHealth = totalComponents > 0 ? (connectedComponents / totalComponents) * 100 : 0;
  const activeModules = health?.moduleCountActive ?? health?.healthyModules ?? 0;
  const totalModules = health?.moduleCountTotal ?? health?.moduleCount ?? 0;

  return (
    <Card className='w-full terra-glass border-terra-cyan/20 backdrop-blur-md'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 rounded-lg bg-terra-cyan/10 border border-terra-cyan/20'>
            <EliteServerIcon className='w-6 h-6 text-terra-cyan' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-white'>Backend Connectivity</h3>
            <p className='text-sm text-gray-400'>
              Governed health evidence from `/api/system/health`
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <div className='text-right mr-4'>
            <div
              className={`text-2xl font-bold ${
                componentHealth >= 90
                  ? 'text-green-400'
                  : componentHealth >= 70
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}
            >
              {loading ? '...' : `${componentHealth.toFixed(0)}%`}
            </div>
            <div className='text-xs text-gray-400'>Component Health</div>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() => void loadHealth()}
            className='border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/10'
          >
            <EliteShieldIcon className='w-4 h-4 mr-2' />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {error && (
          <div className='p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-200'>
            {error}
          </div>
        )}

        {health && (
          <>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div className='p-4 rounded-lg bg-slate-900/40 border border-terra-cyan/20'>
                <div className='text-sm text-gray-400 mb-2'>Overall Status</div>
                <Badge className={getStatusColor(health.status)}>{health.status}</Badge>
              </div>

              <div className='p-4 rounded-lg bg-slate-900/40 border border-terra-cyan/20'>
                <div className='text-sm text-gray-400 mb-2'>Components</div>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {connectedComponents}/{totalComponents}
                </div>
                <EliteProgress value={componentHealth} className='mt-2' />
              </div>

              <div className='p-4 rounded-lg bg-slate-900/40 border border-terra-cyan/20'>
                <div className='text-sm text-gray-400 mb-2'>Modules</div>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {activeModules}/{totalModules}
                </div>
              </div>
            </div>

            <div>
              <h4 className='text-sm font-semibold text-gray-300 mb-3 flex items-center'>
                <EliteNetworkIcon className='w-4 h-4 mr-2 text-terra-cyan' />
                Component Evidence
              </h4>
              {componentEntries.length === 0 ? (
                <div className='text-sm text-gray-400'>No component evidence returned.</div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {componentEntries.map(([name, isHealthy]) => (
                    <div
                      key={name}
                      className='flex items-center justify-between p-3 bg-slate-900/30 rounded-lg'
                    >
                      <span className='text-sm text-white'>{name}</span>
                      <Badge className={isHealthy ? getStatusColor('healthy') : getStatusColor('down')}>
                        {isHealthy ? 'healthy' : 'unhealthy'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {health.warnings.length > 0 && (
              <div>
                <h4 className='text-sm font-semibold text-gray-300 mb-3 flex items-center'>
                  <EliteActivityIcon className='w-4 h-4 mr-2 text-yellow-400' />
                  Health Warnings
                </h4>
                <div className='space-y-2'>
                  {health.warnings.map((warning, index) => (
                    <div
                      key={`${warning}-${index}`}
                      className='p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-sm'
                    >
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className='text-xs text-gray-500 text-center'>
          Last checked: {lastCheck ? lastCheck.toLocaleString() : 'not available'}
        </div>
      </CardContent>
    </Card>
  );
};

export default EliteBackendConnectivityMonitor;

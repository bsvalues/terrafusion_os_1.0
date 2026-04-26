import { TerraSphere } from '@/components/brand/TerraSphere';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  Progress,
} from '@/components/terrafusion-design-system';
import { systemAPI } from '@/services/systemAPI';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface SystemHealthResponse {
  status: string;
  moduleCount: number;
  healthyModules: number;
  systemComponents: Record<string, boolean>;
  warnings: string[];
  intentFilter?: string | null;
  moduleCountTotal?: number | null;
  moduleCountActive?: number | null;
  moduleCountFilteredOut?: number | null;
}

function normalizeHealthResponse(raw: unknown): SystemHealthResponse {
  const data = raw as Partial<SystemHealthResponse> | null;

  if (!data || typeof data.status !== 'string') {
    throw new Error('System health response does not match /api/system/health contract.');
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
    intentFilter: data.intentFilter ?? null,
    moduleCountTotal: data.moduleCountTotal ?? null,
    moduleCountActive: data.moduleCountActive ?? null,
    moduleCountFilteredOut: data.moduleCountFilteredOut ?? null,
  };
}

function getStatusVariant(status: string): 'primary' | 'quantum' | 'glass' {
  const normalized = status.toLowerCase();
  if (normalized === 'healthy') return 'primary';
  if (normalized === 'degraded') return 'quantum';
  return 'glass';
}

function getComponentVariant(isHealthy: boolean): 'primary' | 'glass' {
  return isHealthy ? 'primary' : 'glass';
}

export const SystemHealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealthResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    try {
      setError(null);
      const data = normalizeHealthResponse(await systemAPI.getSystemHealth());
      setHealthData(data);
      setLastUpdated(new Date());
    } catch (err) {
      setHealthData(null);
      setError(err instanceof Error ? err.message : 'System health evidence is unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
    const interval = setInterval(() => {
      void loadHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadHealth]);

  const componentEntries = useMemo(
    () => Object.entries(healthData?.systemComponents ?? {}),
    [healthData?.systemComponents]
  );

  const unhealthyComponents = componentEntries.filter(([, healthy]) => !healthy);
  const totalModules = healthData?.moduleCountTotal ?? healthData?.moduleCount ?? 0;
  const activeModules = healthData?.moduleCountActive ?? healthData?.healthyModules ?? 0;
  const moduleProgress = totalModules > 0 ? Math.min(100, (activeModules / totalModules) * 100) : 0;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-terra-midnight flex items-center justify-center'>
        <Card variant='glass' glow className='max-w-md'>
          <CardBody>
            <div className='flex flex-col items-center space-y-4'>
              <TerraSphere size='lg' variant='quantum' />
              <p className='text-terra-cyan text-lg'>Loading governed system health...</p>
              <Progress value={50} variant='quantum' pulse />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-terra-midnight p-6'>
      <div className='mb-8'>
        <div className='flex items-center space-x-4 mb-4'>
          <TerraSphere size='md' variant='glow' />
          <h1 className='text-3xl font-bold text-terra-cyan'>System Health Dashboard</h1>
        </div>
        <p className='text-terra-slate text-lg'>
          Governed operational status from the backend `/api/system/health` evidence contract.
        </p>
      </div>

      {error && (
        <Card variant='glass' className='mb-6 border border-yellow-500/30'>
          <CardBody>
            <h2 className='text-xl font-semibold text-yellow-400 mb-2'>
              System health evidence unavailable
            </h2>
            <p className='text-terra-slate'>{error}</p>
          </CardBody>
        </Card>
      )}

      {healthData && (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
            <Card variant='glass' glow>
              <CardBody>
                <h3 className='text-lg font-semibold text-terra-cyan mb-2'>Overall Status</h3>
                <Badge variant={getStatusVariant(healthData.status)}>
                  {healthData.status.toUpperCase()}
                </Badge>
                <p className='text-terra-slate text-sm mt-3'>
                  {unhealthyComponents.length === 0
                    ? 'No unhealthy components reported.'
                    : `${unhealthyComponents.length} unhealthy component(s) reported.`}
                </p>
              </CardBody>
            </Card>

            <Card variant='glass' glow>
              <CardBody>
                <h3 className='text-lg font-semibold text-terra-cyan mb-2'>Modules</h3>
                <p className='text-4xl font-bold text-white mb-2'>
                  {activeModules}/{totalModules}
                </p>
                <Progress value={moduleProgress} variant='quantum' className='mb-2' />
                <p className='text-terra-slate text-sm'>Active modules / discovered modules</p>
              </CardBody>
            </Card>

            <Card variant='glass' glow>
              <CardBody>
                <h3 className='text-lg font-semibold text-terra-cyan mb-2'>Healthy Modules</h3>
                <p className='text-4xl font-bold text-white mb-2'>
                  {healthData.healthyModules}/{healthData.moduleCount}
                </p>
                <p className='text-terra-slate text-sm'>
                  Reported by orchestration health, not client-side inference.
                </p>
              </CardBody>
            </Card>

            <Card variant='glass' glow>
              <CardBody>
                <h3 className='text-lg font-semibold text-terra-cyan mb-2'>Intent Filter</h3>
                <p className='text-xl font-semibold text-white mb-2'>
                  {healthData.intentFilter || 'None'}
                </p>
                <p className='text-terra-slate text-sm'>
                  Filtered out: {healthData.moduleCountFilteredOut ?? 0}
                </p>
              </CardBody>
            </Card>
          </div>

          <Card variant='glass' glow className='mb-6'>
            <CardHeader>
              <h2 className='text-2xl font-semibold text-terra-cyan'>Component Health</h2>
            </CardHeader>
            <CardBody>
              {componentEntries.length === 0 ? (
                <p className='text-terra-slate'>No component-level health evidence returned.</p>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {componentEntries.map(([component, healthy]) => (
                    <div
                      key={component}
                      className='terra-glass p-4 rounded-lg border border-terra-cyan/20'
                    >
                      <div className='flex items-center justify-between gap-3'>
                        <h3 className='text-lg font-semibold text-white'>{component}</h3>
                        <Badge variant={getComponentVariant(healthy)}>
                          {healthy ? 'HEALTHY' : 'UNHEALTHY'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card variant='glass' glow>
            <CardHeader>
              <h2 className='text-2xl font-semibold text-terra-cyan'>Warnings</h2>
            </CardHeader>
            <CardBody>
              {healthData.warnings.length === 0 ? (
                <p className='text-terra-slate'>No warnings returned by the health endpoint.</p>
              ) : (
                <div className='space-y-3'>
                  {healthData.warnings.map((warning, index) => (
                    <div
                      key={`${warning}-${index}`}
                      className='terra-glass p-4 rounded-lg border border-yellow-500/20'
                    >
                      <p className='text-yellow-300'>{warning}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <div className='mt-8 text-center'>
            <p className='text-terra-slate text-sm'>
              Data refreshes every 5 seconds. Last updated:{' '}
              {lastUpdated ? lastUpdated.toLocaleTimeString() : 'not available'}.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default SystemHealthDashboard;

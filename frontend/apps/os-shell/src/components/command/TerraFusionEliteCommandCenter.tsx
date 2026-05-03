import { TerraSphere } from '@/components/brand/TerraSphere';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

interface CommandCenterProps {
  className?: string;
}

function normalizeHealth(raw: unknown): SystemHealthResponse {
  const data = raw as Partial<SystemHealthResponse> | null;
  if (!data || typeof data.status !== 'string') {
    throw new Error('System health response does not match /api/system/health.');
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

function statusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'healthy') return 'bg-green-500 text-white';
  if (normalized === 'degraded') return 'bg-yellow-500 text-terra-midnight';
  return 'bg-red-500 text-white';
}

export const TerraFusionEliteCommandCenter: React.FC<CommandCenterProps> = ({
  className = '',
}) => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    try {
      setError(null);
      const data = normalizeHealth(await systemAPI.getSystemHealth());
      setHealth(data);
      setLastUpdated(new Date());
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : 'System health evidence is unavailable.');
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
  const unhealthyComponents = componentEntries.filter(([, healthy]) => !healthy);
  const totalModules = health?.moduleCountTotal ?? health?.moduleCount ?? 0;
  const activeModules = health?.moduleCountActive ?? health?.healthyModules ?? 0;
  const moduleProgress = totalModules > 0 ? (activeModules / totalModules) * 100 : 0;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6 ${className}`}
    >
      <div className='text-center mb-8'>
        <div className='flex items-center justify-center gap-6 mb-4'>
          <TerraSphere size='lg' variant='quantum' />
          <div>
            <h1 className='text-5xl font-bold text-terra-cyan glow-text mb-2'>
              TerraFusion Command Center
            </h1>
            <p className='text-xl text-terra-blue/80'>
              Governed operating status from backend health evidence.
            </p>
          </div>
        </div>

        <div className='bg-terra-cyan/10 border border-terra-cyan/30 rounded-lg p-4 mb-6'>
          <div className='text-2xl font-bold text-terra-cyan mb-2'>Mission Status</div>
          <div className='text-terra-blue'>
            {loading
              ? 'Loading system health evidence...'
              : health
                ? `${health.status} • ${activeModules}/${totalModules} active modules`
                : 'System health evidence unavailable'}
          </div>
        </div>
      </div>

      {error && (
        <Card className='terra-glass border-yellow-500/30 mb-8'>
          <CardBody className='p-6'>
            <div className='text-yellow-300 font-semibold'>Command center evidence unavailable</div>
            <div className='text-sm text-gray-300 mt-2'>{error}</div>
          </CardBody>
        </Card>
      )}

      {health && (
        <>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
            <Card className='terra-glass border-terra-cyan/20 text-center'>
              <CardBody className='p-4'>
                <Badge className={statusClass(health.status)}>{health.status.toUpperCase()}</Badge>
                <div className='text-sm text-gray-400 mt-3'>System Status</div>
              </CardBody>
            </Card>

            <Card className='terra-glass border-terra-cyan/20 text-center'>
              <CardBody className='p-4'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {activeModules}/{totalModules}
                </div>
                <Progress value={moduleProgress} className='mt-3' />
                <div className='text-sm text-gray-400 mt-3'>Active Modules</div>
              </CardBody>
            </Card>

            <Card className='terra-glass border-terra-cyan/20 text-center'>
              <CardBody className='p-4'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {health.healthyModules}/{health.moduleCount}
                </div>
                <div className='text-sm text-gray-400 mt-3'>Healthy Modules</div>
              </CardBody>
            </Card>

            <Card className='terra-glass border-terra-cyan/20 text-center'>
              <CardBody className='p-4'>
                <div className='text-2xl font-bold text-terra-cyan'>
                  {unhealthyComponents.length}
                </div>
                <div className='text-sm text-gray-400 mt-3'>Unhealthy Components</div>
              </CardBody>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card className='terra-glass border-terra-cyan/20'>
              <CardHeader>
                <h2 className='text-2xl font-bold text-terra-cyan'>Component Health</h2>
              </CardHeader>
              <CardBody className='p-6'>
                {componentEntries.length === 0 ? (
                  <div className='text-gray-400'>No component-level evidence returned.</div>
                ) : (
                  <div className='space-y-3'>
                    {componentEntries.map(([component, isHealthy]) => (
                      <div
                        key={component}
                        className='flex items-center justify-between p-3 bg-terra-midnight/40 rounded-lg'
                      >
                        <span className='text-white'>{component}</span>
                        <Badge className={isHealthy ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                          {isHealthy ? 'Healthy' : 'Unhealthy'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className='terra-glass border-terra-cyan/20'>
              <CardHeader>
                <h2 className='text-2xl font-bold text-terra-cyan'>Warnings</h2>
              </CardHeader>
              <CardBody className='p-6'>
                {health.warnings.length === 0 ? (
                  <div className='text-gray-400'>No warnings returned by the health endpoint.</div>
                ) : (
                  <div className='space-y-3'>
                    {health.warnings.map((warning, index) => (
                      <div
                        key={`${warning}-${index}`}
                        className='p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-200'
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}

      <div className='mt-8 flex justify-center gap-3'>
        <Button onClick={() => void loadHealth()} variant='outline'>
          Refresh Evidence
        </Button>
        <div className='text-xs text-gray-500 self-center'>
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'not available'}
        </div>
      </div>
    </div>
  );
};

export default TerraFusionEliteCommandCenter;

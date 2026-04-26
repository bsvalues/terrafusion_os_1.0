import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Bot, Gauge, RefreshCw, ShieldAlert, Workflow } from 'lucide-react';

import { getToken } from '@/auth/authStorage';
import { getApiBase } from '@/lib/apiBase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ResearchSwarmStatus {
  countyId: string;
  activeAgents: number;
  swarmActivity: string;
  quantumOptimizationFactor: number;
  responseTime: number;
  accuracyScore: number;
  consciousnessLevel: number;
  lastUpdate: string;
  source: 'AIAssistant/swarm-status';
}

interface AISwarmManagementPanelProps {
  countyId: string;
  onStatusChange?: (status: ResearchSwarmStatus | null) => void;
}

export const AISwarmManagementPanel: React.FC<AISwarmManagementPanelProps> = ({
  countyId,
  onStatusChange,
}) => {
  const [status, setStatus] = useState<ResearchSwarmStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSwarmStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${getApiBase()}/AIAssistant/swarm-status/${encodeURIComponent(countyId)}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Swarm status request failed (${response.status})`);
      }

      const data = await response.json();
      const nextStatus: ResearchSwarmStatus = {
        countyId: String(data.countyId ?? countyId),
        activeAgents: Number(data.activeAgents ?? 0),
        swarmActivity: String(data.swarmActivity ?? 'Unknown'),
        quantumOptimizationFactor: Number(data.quantumOptimizationFactor ?? 0),
        responseTime: Number(data.responseTime ?? 0),
        accuracyScore: Number(data.accuracyScore ?? 0),
        consciousnessLevel: Number(data.consciousnessLevel ?? 0),
        lastUpdate: String(data.lastUpdate ?? new Date().toISOString()),
        source: 'AIAssistant/swarm-status',
      };

      setStatus(nextStatus);
      onStatusChange?.(nextStatus);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'County-scoped swarm status is unavailable.';
      setStatus(null);
      setError(message);
      onStatusChange?.(null);
    } finally {
      setIsLoading(false);
    }
  }, [countyId, onStatusChange]);

  useEffect(() => {
    void loadSwarmStatus();

    const interval = window.setInterval(() => {
      void loadSwarmStatus();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadSwarmStatus]);

  return (
    <div className='space-y-6 p-6' data-testid='research-swarm-management-panel'>
      <Card className='border-cyan-500/20 bg-slate-950/70'>
        <CardHeader className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='space-y-2'>
            <CardTitle className='flex items-center gap-2 text-cyan-100'>
              <Bot className='h-6 w-6 text-cyan-300' />
              County-Scoped AI Swarm Health
            </CardTitle>
            <CardDescription className='text-slate-300'>
              This panel now reads the governed assistant swarm status route for the selected county.
              Per-agent topology, optimization commands, and intelligence analysis remain unavailable
              until a governed execution plane exists.
            </CardDescription>
          </div>
          <div className='flex items-center gap-3'>
            <Badge
              className='border-cyan-400/30 bg-cyan-500/10 text-cyan-100'
              variant='outline'
            >
              Source: /api/AIAssistant/swarm-status/{countyId}
            </Badge>
            <Button
              className='gap-2'
              disabled={isLoading}
              onClick={() => {
                void loadSwarmStatus();
              }}
              size='sm'
              variant='outline'
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert className='border-cyan-500/30 bg-cyan-500/5'>
            <Gauge className='h-4 w-4 text-cyan-300' />
            <AlertDescription className='text-slate-200'>
              Authority decision: the assistant swarm status lane is the only repo-native route in
              this slice backed by persisted agent and performance records. Synthetic orchestration
              routes were not reused.
            </AlertDescription>
          </Alert>

          {error ? (
            <Alert className='border-yellow-500/40 bg-yellow-500/10' data-testid='research-swarm-unavailable'>
              <AlertTriangle className='h-4 w-4 text-yellow-400' />
              <AlertDescription className='text-yellow-50'>
                {error} No governed fallback is substituted.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
            <MetricCard
              label='Active Agents'
              value={status ? status.activeAgents.toLocaleString() : isLoading ? 'Loading...' : 'Unavailable'}
            />
            <MetricCard
              label='Swarm Activity'
              value={status ? status.swarmActivity : isLoading ? 'Loading...' : 'Unavailable'}
            />
            <MetricCard
              label='Response Time'
              value={
                status ? `${status.responseTime.toFixed(1)} ms` : isLoading ? 'Loading...' : 'Unavailable'
              }
            />
            <MetricCard
              label='Accuracy Score'
              value={
                status ? `${(status.accuracyScore * 100).toFixed(1)}%` : isLoading ? 'Loading...' : 'Unavailable'
              }
            />
          </div>

          <div className='grid gap-4 md:grid-cols-3'>
            <SecondaryCard
              icon={<Gauge className='h-5 w-5 text-cyan-200' />}
              title='Consciousness Level'
              detail={
                status ? `${status.consciousnessLevel.toFixed(2)}` : 'Unavailable until live status returns.'
              }
            />
            <SecondaryCard
              icon={<Bot className='h-5 w-5 text-cyan-200' />}
              title='Optimization Factor'
              detail={
                status
                  ? status.quantumOptimizationFactor > 0
                    ? String(status.quantumOptimizationFactor)
                    : 'Not reported on this route.'
                  : 'Unavailable until live status returns.'
              }
            />
            <SecondaryCard
              icon={<RefreshCw className='h-5 w-5 text-cyan-200' />}
              title='Last Update'
              detail={
                status
                  ? new Date(status.lastUpdate).toLocaleString()
                  : 'Unavailable until live status returns.'
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-4 md:grid-cols-3'>
        <UnavailableCard
          icon={<Workflow className='h-5 w-5 text-slate-300' />}
          title='Topology Unavailable'
          detail='The prior 3D agent field and connection graph were synthetic. No governed per-agent topology feed exists on this route.'
        />
        <UnavailableCard
          icon={<ShieldAlert className='h-5 w-5 text-slate-300' />}
          title='Optimization Blocked'
          detail='Coordination changes, deployment plans, and swarm optimization stay disabled until there is a governed execution boundary.'
        />
        <UnavailableCard
          icon={<AlertTriangle className='h-5 w-5 text-slate-300' />}
          title='Intelligence Analysis Unavailable'
          detail='Pattern analysis, bottleneck prediction, and deployment recommendations are not shown without a backed evidence stream.'
        />
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <Card className='border-white/10 bg-white/5'>
      <CardContent className='pt-6'>
        <p className='text-sm uppercase tracking-wide text-slate-400'>{label}</p>
        <p className='mt-2 text-2xl font-semibold text-white'>{value}</p>
      </CardContent>
    </Card>
  );
}

interface SecondaryCardProps {
  icon: React.ReactNode;
  title: string;
  detail: string;
}

function SecondaryCard({ icon, title, detail }: SecondaryCardProps) {
  return (
    <Card className='border-white/10 bg-white/5'>
      <CardContent className='flex items-start gap-3 pt-6'>
        {icon}
        <div>
          <p className='text-sm font-semibold text-white'>{title}</p>
          <p className='text-sm text-slate-300'>{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface UnavailableCardProps {
  icon: React.ReactNode;
  title: string;
  detail: string;
}

function UnavailableCard({ icon, title, detail }: UnavailableCardProps) {
  return (
    <Card className='border-white/10 bg-white/5'>
      <CardContent className='flex items-start gap-3 pt-6'>
        {icon}
        <div>
          <p className='text-sm font-semibold text-white'>{title}</p>
          <p className='text-sm text-slate-300'>{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AISwarmManagementPanel;

import React, { useEffect, useMemo, useState } from 'react';
import { useCountyStats } from '../../hooks/useCountyStats';
import { getApiBase } from '../../lib/apiBase';
import { useAuthContextOptional } from '../../auth/useAuthContext';

const SWARM_STATUS_SOURCE = 'AIAssistant/swarm-status';

interface FederationSwarmStatus {
  countyId: string;
  activeAgents: number;
  swarmActivity: string;
  quantumOptimizationFactor: number;
  responseTime: number;
  accuracyScore: number;
  consciousnessLevel: number;
  lastUpdate: string;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function parseFederationSwarmStatus(payload: unknown): FederationSwarmStatus {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Governed swarm status response was not an object.');
  }

  const data = payload as Record<string, unknown>;
  const countyId = typeof data.countyId === 'string' ? data.countyId : null;
  const swarmActivity = typeof data.swarmActivity === 'string' ? data.swarmActivity : null;
  const lastUpdate = typeof data.lastUpdate === 'string' ? data.lastUpdate : null;

  const activeAgents = asFiniteNumber(data.activeAgents);
  const quantumOptimizationFactor = asFiniteNumber(data.quantumOptimizationFactor);
  const responseTime = asFiniteNumber(data.responseTime);
  const accuracyScore = asFiniteNumber(data.accuracyScore);
  const consciousnessLevel = asFiniteNumber(data.consciousnessLevel);

  if (
    countyId == null ||
    swarmActivity == null ||
    lastUpdate == null ||
    activeAgents == null ||
    quantumOptimizationFactor == null ||
    responseTime == null ||
    accuracyScore == null ||
    consciousnessLevel == null
  ) {
    throw new Error('Governed swarm status response was missing required fields.');
  }

  return {
    countyId,
    activeAgents,
    swarmActivity,
    quantumOptimizationFactor,
    responseTime,
    accuracyScore,
    consciousnessLevel,
    lastUpdate,
  };
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatResponseTime(value: number): string {
  return value > 0 ? `${value.toFixed(1)} ms` : 'No recent latency samples';
}

function formatQuantumFactor(value: number): string {
  return value > 0 ? value.toString() : 'Not recorded';
}

export const FederationDashboard: React.FC = () => {
  const auth = useAuthContextOptional();
  const countyId = auth?.countyId ?? null;
  const token = auth?.token ?? null;
  const { stats, loading: statsLoading, error: statsError, sourceDisclosure } = useCountyStats();

  const [swarmStatus, setSwarmStatus] = useState<FederationSwarmStatus | null>(null);
  const [swarmLoading, setSwarmLoading] = useState(false);
  const [swarmError, setSwarmError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!countyId || !token) {
      setSwarmStatus(null);
      setSwarmLoading(false);
      setSwarmError('Governed county swarm status requires an authenticated county session.');
      return () => {
        cancelled = true;
      };
    }

    const loadSwarmStatus = async () => {
      try {
        setSwarmLoading(true);
        setSwarmError(null);

        const response = await fetch(
          `${getApiBase()}/AIAssistant/swarm-status/${encodeURIComponent(countyId)}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const detail = await response.text().catch(() => '');
          throw new Error(
            `Governed county swarm status returned HTTP ${response.status}${detail ? `: ${detail}` : ''}`
          );
        }

        const payload = await response.json();
        const nextStatus = parseFederationSwarmStatus(payload);

        if (cancelled) {
          return;
        }

        setSwarmStatus(nextStatus);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSwarmStatus(null);
        setSwarmError(
          error instanceof Error ? error.message : 'Failed to load governed county swarm status.'
        );
      } finally {
        if (!cancelled) {
          setSwarmLoading(false);
        }
      }
    };

    void loadSwarmStatus();

    return () => {
      cancelled = true;
    };
  }, [countyId, token]);

  const countyLabel = useMemo(() => {
    if (!countyId) {
      return 'No county context';
    }

    return countyId.charAt(0).toUpperCase() + countyId.slice(1);
  }, [countyId]);

  return (
    <div
      className='min-h-full bg-slate-950 text-white p-6 md:p-8'
      data-testid='federation-dashboard-guardrail'
    >
      <div className='mx-auto max-w-6xl space-y-6'>
        <header className='rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/50'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
            <div className='space-y-2'>
              <p className='text-sm font-medium uppercase tracking-[0.24em] text-cyan-300'>
                Federation Readiness Guardrail
              </p>
              <h1 className='text-3xl font-semibold tracking-tight text-white'>
                No governed multi-county federation registry is connected
              </h1>
              <p className='max-w-3xl text-sm text-slate-300'>
                This surface no longer invents county deployment topology, latency, or swarm
                missions. It shows only provider-backed county aggregates plus the authenticated
                county assistant status route when that route is available.
              </p>
            </div>

            <div className='rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100'>
              <div className='font-semibold'>Topology withheld</div>
              <div className='mt-1 text-amber-50/80'>
                County-to-county routing, readiness scoring, and deployment maps remain unavailable
                until a governed accreditation registry exists.
              </div>
            </div>
          </div>
        </header>

        <div className='grid gap-4 lg:grid-cols-3'>
          <section className='rounded-3xl border border-slate-800 bg-slate-900/70 p-5'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-xs uppercase tracking-[0.24em] text-slate-400'>
                  County Aggregate Source
                </p>
                <h2 className='mt-2 text-xl font-semibold text-white'>Provider-backed county stats</h2>
              </div>
              <span className='rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300'>
                {statsLoading ? 'Loading' : stats ? 'Loaded' : 'Unavailable'}
              </span>
            </div>

            {stats ? (
              <div className='mt-4 space-y-3 text-sm text-slate-200'>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>Parcels</span>
                  <span className='font-medium'>{stats.totalParcels.toLocaleString()}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>Average assessed value</span>
                  <span className='font-medium'>
                    ${stats.averageAssessedValue?.toLocaleString() ?? 'Unavailable'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>Assessment completion</span>
                  <span className='font-medium'>
                    {stats.assessmentCompletionPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ) : (
              <p className='mt-4 text-sm text-slate-400'>
                {statsError ?? 'County aggregate statistics are not available from the current provider.'}
              </p>
            )}

            {sourceDisclosure && (
              <div className='mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-amber-200'>
                {sourceDisclosure}
              </div>
            )}
          </section>

          <section className='rounded-3xl border border-slate-800 bg-slate-900/70 p-5'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='text-xs uppercase tracking-[0.24em] text-slate-400'>
                  Governed County Swarm Status
                </p>
                <h2 className='mt-2 text-xl font-semibold text-white'>{countyLabel}</h2>
              </div>
              <span className='rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300'>
                {swarmLoading ? 'Loading' : swarmStatus ? 'Live' : 'Unavailable'}
              </span>
            </div>

            {swarmStatus ? (
              <div className='mt-4 space-y-3 text-sm text-slate-200'>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>Source</span>
                  <span className='font-mono text-xs text-cyan-300'>{SWARM_STATUS_SOURCE}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>Active agents</span>
                  <span className='font-medium'>{swarmStatus.activeAgents.toLocaleString()}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>Swarm activity</span>
                  <span className='font-medium'>{swarmStatus.swarmActivity}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>Accuracy score</span>
                  <span className='font-medium'>{formatPercent(swarmStatus.accuracyScore)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>Consciousness level</span>
                  <span className='font-medium'>
                    {formatPercent(swarmStatus.consciousnessLevel)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>Average response time</span>
                  <span className='font-medium'>
                    {formatResponseTime(swarmStatus.responseTime)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-slate-400'>Quantum factor</span>
                  <span className='font-medium'>
                    {formatQuantumFactor(swarmStatus.quantumOptimizationFactor)}
                  </span>
                </div>
              </div>
            ) : (
              <div className='mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100'>
                {swarmError ?? 'Governed county swarm status is not available for this session.'}
              </div>
            )}
          </section>

          <section className='rounded-3xl border border-slate-800 bg-slate-900/70 p-5'>
            <p className='text-xs uppercase tracking-[0.24em] text-slate-400'>Blocked Claims</p>
            <h2 className='mt-2 text-xl font-semibold text-white'>What this page will not claim</h2>

            <ul className='mt-4 space-y-3 text-sm text-slate-300'>
              <li className='rounded-2xl border border-slate-800 bg-slate-950/70 p-3'>
                No city-to-county network map, no cross-county latency, and no “planned” node
                status without a governed deployment registry.
              </li>
              <li className='rounded-2xl border border-slate-800 bg-slate-950/70 p-3'>
                No swarm mission percentages or agent-type breakdowns from the retired
                Claude-Flow and Gauge Theory demo services.
              </li>
              <li className='rounded-2xl border border-slate-800 bg-slate-950/70 p-3'>
                No county readiness scoring until accreditation evidence, topology records, and
                governed rollout state are stored in one canonical control plane.
              </li>
            </ul>
          </section>
        </div>

        <section className='rounded-3xl border border-slate-800 bg-slate-900/70 p-5'>
          <p className='text-xs uppercase tracking-[0.24em] text-slate-400'>Evidence Required</p>
          <h2 className='mt-2 text-xl font-semibold text-white'>What finished federation should include</h2>
          <div className='mt-4 grid gap-3 md:grid-cols-3'>
            <div className='rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300'>
              County accreditation records tied to real deployment state, not seeded node objects.
            </div>
            <div className='rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300'>
              Governed topology evidence with county ownership, route health, and correlation-backed actions.
            </div>
            <div className='rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300'>
              A canonical statewide registry that can explain why a county is live, degraded, or unavailable.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FederationDashboard;

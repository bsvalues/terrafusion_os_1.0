/**
 * ═══════════════════════════════════════════════════════════════
 * SYSTEMGPT RAG FLEET READINESS PANEL
 * Phase 27: Multi-County RAG Fleet Readiness & Drift Detection
 * "Detect when one county's valuation knowledge falls behind another's."
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import type { RagFleetReadiness, RagCountyReadiness } from '../../../api/systemDiagnosticsApi';
import { fetchRagFleetReadiness } from '../../../api/systemDiagnosticsApi';

// ═══════════════════════════════════════════════════════════════
// DRIFT RISK BADGE COMPONENT
// ═══════════════════════════════════════════════════════════════

interface DriftRiskBadgeProps {
  risk: RagFleetReadiness['fleetDriftRisk'];
  size?: 'sm' | 'md';
}

function DriftRiskBadge({ risk, size = 'md' }: DriftRiskBadgeProps) {
  const config = {
    Low: {
      bgClass: 'bg-emerald-500/20 border-emerald-500/40',
      textClass: 'text-emerald-400',
      icon: '✅',
      label: 'FLEET ALIGNED',
    },
    Medium: {
      bgClass: 'bg-amber-500/20 border-amber-500/40',
      textClass: 'text-amber-400',
      icon: '⚡',
      label: 'DRIFT DETECTED',
    },
    High: {
      bgClass: 'bg-red-500/20 border-red-500/40',
      textClass: 'text-red-400',
      icon: '⚠️',
      label: 'HIGH DRIFT',
    },
  };

  const c = config[risk] ?? config.Low;
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[0.6rem]' 
    : 'px-3 py-1 text-xs';

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border ${c.bgClass} ${sizeClasses}`}>
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{c.icon}</span>
      <span className={`font-semibold tracking-wider ${c.textClass}`}>{c.label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COUNTY STATUS BADGE
// ═══════════════════════════════════════════════════════════════

interface CountyStatusBadgeProps {
  status: string;
}

function CountyStatusBadge({ status }: CountyStatusBadgeProps) {
  const config: Record<string, { bg: string; text: string }> = {
    Ready: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    Stale: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    Partial: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    Unindexed: { bg: 'bg-red-500/20', text: 'text-red-400' },
    Unknown: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  };

  const c = config[status] ?? config.Unknown;

  return (
    <span className={`rounded px-2 py-0.5 text-[0.65rem] font-medium ${c.bg} ${c.text}`}>
      {status}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// FLEET STATS SUMMARY
// ═══════════════════════════════════════════════════════════════

interface FleetStatProps {
  label: string;
  value: number | string;
  accent?: boolean;
}

function FleetStat({ label, value, accent }: FleetStatProps) {
  return (
    <div className='rounded-lg border border-cyan-500/20 bg-slate-900/60 px-3 py-2 text-center'>
      <div className='text-[0.55rem] uppercase tracking-wider text-slate-500'>{label}</div>
      <div className={`text-lg font-semibold mt-0.5 ${accent ? 'text-cyan-400' : 'text-slate-300'}`}>
        {value}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COUNTY COMPARISON TABLE
// ═══════════════════════════════════════════════════════════════

interface CountyTableProps {
  counties: RagCountyReadiness[];
}

function CountyComparisonTable({ counties }: CountyTableProps) {
  const configuredCounties = counties.filter((c) => c.configured);
  const unconfiguredCounties = counties.filter((c) => !c.configured);

  const formatIndexAge = (hours: number | null | undefined): string => {
    if (hours == null) return '—';
    if (hours < 1) return '<1h';
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className='mt-3 overflow-hidden rounded-lg border border-cyan-500/20'>
      <table className='w-full text-xs'>
        <thead>
          <tr className='bg-slate-800/60'>
            <th className='px-3 py-2 text-left font-medium text-slate-400'>County</th>
            <th className='px-3 py-2 text-center font-medium text-slate-400'>Status</th>
            <th className='px-3 py-2 text-right font-medium text-slate-400'>Docs</th>
            <th className='px-3 py-2 text-right font-medium text-slate-400'>Embeddings</th>
            <th className='px-3 py-2 text-right font-medium text-slate-400'>Index Age</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-cyan-500/10'>
          {configuredCounties.map((county) => (
            <tr key={county.countyId} className='bg-slate-900/40 hover:bg-slate-800/40'>
              <td className='px-3 py-2'>
                <div className='font-medium text-slate-200'>{county.countyName}</div>
                {county.note && (
                  <div className='text-[0.6rem] text-slate-500 mt-0.5'>{county.note}</div>
                )}
              </td>
              <td className='px-3 py-2 text-center'>
                <CountyStatusBadge status={county.ragStatus} />
              </td>
              <td className='px-3 py-2 text-right tabular-nums text-slate-300'>
                {county.documentCount?.toLocaleString() ?? '—'}
              </td>
              <td className='px-3 py-2 text-right tabular-nums text-slate-300'>
                {county.embeddingCount?.toLocaleString() ?? '—'}
              </td>
              <td className='px-3 py-2 text-right tabular-nums text-slate-300'>
                {formatIndexAge(county.indexAgeHours)}
              </td>
            </tr>
          ))}
          {unconfiguredCounties.length > 0 && (
            <tr className='bg-slate-900/20'>
              <td colSpan={5} className='px-3 py-2 text-center text-slate-500'>
                <details className='cursor-pointer'>
                  <summary className='text-[0.65rem]'>
                    {unconfiguredCounties.length} unconfigured counties
                  </summary>
                  <div className='mt-2 text-left'>
                    {unconfiguredCounties.map((c) => c.countyName).join(', ')}
                  </div>
                </details>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DRIFT CONDITIONS DISPLAY
// ═══════════════════════════════════════════════════════════════

interface DriftConditionsProps {
  conditions: readonly string[];
}

function DriftConditions({ conditions }: DriftConditionsProps) {
  if (!conditions || conditions.length === 0) return null;

  const conditionLabels: Record<string, string> = {
    IndexAgeDriftHigh: '🔴 Index Age Drift: Critical (>72h gap)',
    IndexAgeDriftMedium: '🟡 Index Age Drift: Moderate (>24h gap)',
    CoverageDriftHigh: '🔴 Coverage Drift: Critical (<20% of max)',
    CoverageDriftMedium: '🟡 Coverage Drift: Moderate (<50% of max)',
    StatusDriftSevere: '🔴 Status Drift: Severe (mixed Ready/Stale)',
    StatusDriftPartial: '🟡 Status Drift: Partial indexes detected',
    NoConfiguredCounties: '⚪ No counties configured for RAG',
    InsufficientData: '⚪ Insufficient data for drift analysis',
  };

  return (
    <div className='mt-2 flex flex-wrap gap-1'>
      {conditions.map((cond) => (
        <span
          key={cond}
          className='inline-block rounded bg-slate-800/60 border border-slate-700/50 px-2 py-0.5 text-[0.6rem] text-slate-400'
        >
          {conditionLabels[cond] ?? cond}
        </span>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN RAG FLEET PANEL
// ═══════════════════════════════════════════════════════════════

export interface SystemGptRagFleetPanelProps {
  fleetReadiness?: RagFleetReadiness | null;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
}

export function SystemGptRagFleetPanel({
  fleetReadiness: externalData,
  autoRefresh = false,
  refreshIntervalMs = 60000,
}: SystemGptRagFleetPanelProps) {
  const [data, setData] = useState<RagFleetReadiness | null>(externalData ?? null);
  const [loading, setLoading] = useState(!externalData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (externalData) {
      setData(externalData);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await fetchRagFleetReadiness();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load fleet readiness');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    if (autoRefresh) {
      const intervalId = setInterval(fetchData, refreshIntervalMs);
      return () => {
        cancelled = true;
        clearInterval(intervalId);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [externalData, autoRefresh, refreshIntervalMs]);

  // Loading state
  if (loading && !data) {
    return (
      <div className='rounded-xl border border-cyan-500/20 bg-slate-900/80 p-4'>
        <div className='flex items-center gap-2 text-cyan-400'>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent' />
          <span className='text-sm'>Loading RAG Fleet Readiness...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className='rounded-xl border border-red-500/30 bg-slate-900/80 p-4'>
        <div className='flex items-center gap-2 text-red-400'>
          <span>⚠️</span>
          <span className='text-sm'>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className='rounded-xl border border-cyan-500/20 bg-slate-900/80 p-4 shadow-lg shadow-cyan-500/5'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h3 className='flex items-center gap-2 text-sm font-semibold text-cyan-400'>
            <span className='text-lg'>🌐</span>
            RAG Fleet Readiness
          </h3>
          <p className='mt-1 text-[0.65rem] text-slate-500'>
            Phase 27 • Multi-County RAG Drift Detection
          </p>
        </div>
        <DriftRiskBadge risk={data.fleetDriftRisk} />
      </div>

      {/* Advisory */}
      <div className='mt-3 rounded-lg border border-cyan-500/10 bg-slate-800/40 p-3'>
        <div className='text-[0.6rem] uppercase tracking-wider text-slate-500 mb-1'>Advisory</div>
        <p className='text-xs text-slate-300 leading-relaxed'>{data.advisory}</p>
        <DriftConditions conditions={data.driftConditions} />
      </div>

      {/* Stats Grid */}
      <div className='mt-3 grid grid-cols-3 gap-2'>
        <FleetStat label='Total Counties' value={data.totalCounties} />
        <FleetStat label='Configured' value={data.configuredCounties} accent />
        <FleetStat label='Ready' value={data.readyCounties} accent />
      </div>

      {/* County Comparison Table */}
      {data.counties && data.counties.length > 0 && (
        <CountyComparisonTable counties={data.counties} />
      )}

      {/* Timestamp */}
      <div className='mt-3 text-right text-[0.55rem] text-slate-600'>
        Generated: {new Date(data.generatedAtUtc).toLocaleString()}
      </div>
    </div>
  );
}

export default SystemGptRagFleetPanel;

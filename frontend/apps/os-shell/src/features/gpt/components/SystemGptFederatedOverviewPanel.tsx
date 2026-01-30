/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION SYSTEMGPT FEDERATED OVERVIEW PANEL
 * Phase 23: Multi-County Dashboard
 * Displays all counties' SystemGPT status in a grid of clickable tiles.
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from 'react';
import {
  CountyId,
  getSystemGptFederatedOverview,
  SystemGptCountyOverview,
  SystemGptFederatedOverviewResponse,
} from '../../../api/systemDiagnosticsApi';

interface FederatedOverviewPanelProps {
  /** Callback when a county tile is clicked (to switch county selector) */
  onCountySelect?: (countyId: CountyId) => void;
  /** Refresh interval in milliseconds (default: 30000 = 30s) */
  refreshInterval?: number;
}

/**
 * Phase 23: Federated Overview Panel
 * Shows all counties' SystemGPT status in a grid of clickable tiles.
 * Clicking a tile switches the county selector to that county.
 */
export const SystemGptFederatedOverviewPanel: React.FC<FederatedOverviewPanelProps> = ({
  onCountySelect,
  refreshInterval = 30000,
}) => {
  const [overview, setOverview] = useState<SystemGptFederatedOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch federated overview on mount and at interval
  useEffect(() => {
    let mounted = true;

    const fetchOverview = async () => {
      try {
        const data = await getSystemGptFederatedOverview();
        if (mounted) {
          setOverview(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch overview');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOverview();

    const interval = setInterval(fetchOverview, refreshInterval);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [refreshInterval]);

  const handleTileClick = (countyId: string) => {
    if (onCountySelect) {
      onCountySelect(countyId as CountyId);
    }
  };

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='flex items-center gap-3 text-slate-400'>
          <div className='h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent' />
          <span>Loading federated overview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-lg border border-red-500/30 bg-red-500/10 p-4'>
        <div className='flex items-center gap-2 text-red-400'>
          <span>❌</span>
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className='rounded-lg border border-slate-600 bg-slate-800/50 p-4 text-slate-400'>
        No overview data available
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header with summary stats */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-slate-200'>🏛️ Federated Overview</h3>
        <div className='flex items-center gap-4 text-sm text-slate-400'>
          <span>
            {overview.configuredCounties} / {overview.totalCounties} configured
          </span>
          <span className='text-slate-600'>|</span>
          <span>Updated: {new Date(overview.generatedAtUtc).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* County tiles grid */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {overview.counties.map((county) => (
          <CountyTile
            key={county.countyId}
            county={county}
            onClick={() => handleTileClick(county.countyId)}
          />
        ))}
      </div>

      {/* Legend */}
      <div className='flex flex-wrap gap-4 border-t border-slate-700 pt-3 text-xs text-slate-500'>
        <span className='flex items-center gap-1'>
          <HealthBadge health='Healthy' size='sm' />
          Healthy
        </span>
        <span className='flex items-center gap-1'>
          <HealthBadge health='Degraded' size='sm' />
          Degraded
        </span>
        <span className='flex items-center gap-1'>
          <HealthBadge health='Unhealthy' size='sm' />
          Unhealthy
        </span>
        <span className='flex items-center gap-1'>
          <HealthBadge health='Unknown' size='sm' />
          Unknown
        </span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COUNTY TILE COMPONENT
// ═══════════════════════════════════════════════════════════════

interface CountyTileProps {
  county: SystemGptCountyOverview;
  onClick: () => void;
}

const CountyTile: React.FC<CountyTileProps> = ({ county, onClick }) => {
  const isConfigured = county.configured;

  return (
    <button
      type='button'
      onClick={onClick}
      className={`
        group relative rounded-lg border p-4 text-left transition-all duration-200
        ${
          isConfigured
            ? 'border-slate-600 bg-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-800'
            : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
        }
        focus:outline-none focus:ring-2 focus:ring-cyan-500/50
      `}
      title={`Click to view ${county.countyName} details`}
    >
      {/* Header row */}
      <div className='mb-3 flex items-center justify-between'>
        <h4 className='font-semibold text-slate-200'>{county.countyName}</h4>
        <HealthBadge health={county.health} />
      </div>

      {/* Metrics grid */}
      <div className='grid grid-cols-2 gap-2 text-sm'>
        {/* Capacity Risk */}
        <MetricItem label='Capacity' value={county.capacityRisk} type='capacity' />

        {/* RAG Status */}
        <MetricItem label='RAG' value={county.ragStatus} type='rag' />

        {/* Latency P95 */}
        <MetricItem
          label='P95 Latency'
          value={county.p95LatencyMs >= 0 ? `${county.p95LatencyMs.toFixed(0)}ms` : '—'}
          type='latency'
          numericValue={county.p95LatencyMs}
        />

        {/* Error Rate */}
        <MetricItem
          label='Errors'
          value={county.errorRatePercent >= 0 ? `${county.errorRatePercent.toFixed(1)}%` : '—'}
          type='error'
          numericValue={county.errorRatePercent}
        />

        {/* AI Mode */}
        <MetricItem label='Mode' value={county.aiMode} type='mode' />

        {/* Configured */}
        <MetricItem
          label='Status'
          value={county.configured ? 'Configured' : 'Not Configured'}
          type='configured'
          configured={county.configured}
        />
      </div>

      {/* Note if present */}
      {county.note && <div className='mt-2 text-xs text-slate-500 italic'>{county.note}</div>}

      {/* Hover indicator */}
      <div className='absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100'>
        <span className='text-xs text-cyan-400'>View →</span>
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════

interface HealthBadgeProps {
  health: string;
  size?: 'sm' | 'md';
}

const HealthBadge: React.FC<HealthBadgeProps> = ({ health, size = 'md' }) => {
  const baseClasses = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3';

  const colorClasses =
    {
      Healthy: 'bg-green-500',
      Degraded: 'bg-amber-500',
      Unhealthy: 'bg-red-500',
      Unknown: 'bg-slate-500',
    }[health] ?? 'bg-slate-500';

  return (
    <span
      className={`inline-block rounded-full ${baseClasses} ${colorClasses}`}
      title={`Health: ${health}`}
    />
  );
};

interface MetricItemProps {
  label: string;
  value: string;
  type: 'capacity' | 'rag' | 'latency' | 'error' | 'mode' | 'configured';
  numericValue?: number;
  configured?: boolean;
}

const MetricItem: React.FC<MetricItemProps> = ({
  label,
  value,
  type,
  numericValue = -1,
  configured = true,
}) => {
  // Determine value color based on type and value
  let valueColor = 'text-slate-300';

  switch (type) {
    case 'capacity':
      if (value === 'High') valueColor = 'text-red-400';
      else if (value === 'Medium') valueColor = 'text-amber-400';
      else if (value === 'Low') valueColor = 'text-green-400';
      break;
    case 'rag':
      if (value === 'Ready') valueColor = 'text-green-400';
      else if (value === 'Stale' || value === 'Partial') valueColor = 'text-amber-400';
      else if (value === 'Unindexed') valueColor = 'text-red-400';
      break;
    case 'latency':
      if (numericValue < 0) valueColor = 'text-slate-500';
      else if (numericValue < 500) valueColor = 'text-green-400';
      else if (numericValue < 1500) valueColor = 'text-amber-400';
      else valueColor = 'text-red-400';
      break;
    case 'error':
      if (numericValue < 0) valueColor = 'text-slate-500';
      else if (numericValue < 1) valueColor = 'text-green-400';
      else if (numericValue < 5) valueColor = 'text-amber-400';
      else valueColor = 'text-red-400';
      break;
    case 'mode':
      if (value === 'SafeMode') valueColor = 'text-amber-400';
      else if (value === 'Normal') valueColor = 'text-green-400';
      break;
    case 'configured':
      valueColor = configured ? 'text-green-400' : 'text-slate-500';
      break;
  }

  return (
    <div className='flex flex-col'>
      <span className='text-xs text-slate-500'>{label}</span>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  );
};

export default SystemGptFederatedOverviewPanel;

/**
 * ═══════════════════════════════════════════════════════════════
 * SYSTEMGPT ATLAS PANEL
 * Phase 28: Map-Based AI Health Visualization
 * "A geographic visualization of multi-county AI health status."
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from 'react';
import type {
  SystemGptAtlasNode,
  SystemGptAtlasResponse,
  SystemHealthStatus,
  RagFleetDriftRisk,
} from '../../../api/systemDiagnosticsApi';
import { fetchSystemGptAtlas } from '../../../api/systemDiagnosticsApi';

// ═══════════════════════════════════════════════════════════════
// HEALTH COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════

/** Get Tailwind color classes for health status */
function getHealthColorClasses(health: SystemHealthStatus): {
  bg: string;
  border: string;
  text: string;
  glow: string;
} {
  switch (health) {
    case 'Healthy':
      return {
        bg: 'bg-emerald-500/30',
        border: 'border-emerald-400',
        text: 'text-emerald-300',
        glow: 'shadow-emerald-500/50',
      };
    case 'Degraded':
      return {
        bg: 'bg-amber-500/30',
        border: 'border-amber-400',
        text: 'text-amber-300',
        glow: 'shadow-amber-500/50',
      };
    case 'Unhealthy':
      return {
        bg: 'bg-red-500/30',
        border: 'border-red-400',
        text: 'text-red-300',
        glow: 'shadow-red-500/50',
      };
    default:
      return {
        bg: 'bg-slate-500/30',
        border: 'border-slate-400',
        text: 'text-slate-300',
        glow: 'shadow-slate-500/50',
      };
  }
}

/** Get icon for health status */
function getHealthIcon(health: SystemHealthStatus): string {
  switch (health) {
    case 'Healthy':
      return '✅';
    case 'Degraded':
      return '⚡';
    case 'Unhealthy':
      return '🔴';
    default:
      return '❓';
  }
}

// ═══════════════════════════════════════════════════════════════
// DRIFT RISK INDICATOR
// ═══════════════════════════════════════════════════════════════

interface DriftIndicatorProps {
  risk: RagFleetDriftRisk;
}

function DriftIndicator({ risk }: DriftIndicatorProps) {
  if (risk === 'Low') return null;

  const config = {
    Medium: { icon: '⚡', text: 'text-amber-400', label: 'Drift' },
    High: { icon: '⚠️', text: 'text-red-400', label: 'High Drift' },
  };

  const c = config[risk] ?? config.Medium;

  return (
    <span className={`text-[0.55rem] ${c.text} uppercase tracking-wider`}>
      {c.icon} {c.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// ATLAS MAP NODE COMPONENT
// ═══════════════════════════════════════════════════════════════

interface AtlasNodeProps {
  node: SystemGptAtlasNode;
  onClick: (countyId: string) => void;
}

function AtlasNode({ node, onClick }: AtlasNodeProps) {
  const colors = getHealthColorClasses(node.health);
  const healthIcon = getHealthIcon(node.health);

  const hasWarnings = node.recentGuardrailDeny || node.recentSafeModeRecommended;

  return (
    <button
      onClick={() => onClick(node.countyId)}
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2
        flex flex-col items-center gap-1 p-3 rounded-xl
        border-2 ${colors.border} ${colors.bg}
        shadow-lg ${colors.glow}
        transition-all duration-200
        hover:scale-110 hover:shadow-xl hover:z-10
        cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400
      `}
      style={{
        left: `${node.mapX * 100}%`,
        top: `${node.mapY * 100}%`,
      }}
      title={`${node.countyName}: ${node.health} | RAG: ${node.ragStatus} | Click to view details`}
    >
      {/* Health Icon */}
      <div className='text-2xl'>{healthIcon}</div>

      {/* County Name */}
      <div className={`text-xs font-semibold ${colors.text} whitespace-nowrap`}>
        {node.countyName.replace(' County', '')}
      </div>

      {/* Status Row */}
      <div className='flex items-center gap-1'>
        {/* RAG Status Badge */}
        <span
          className={`
          text-[0.55rem] px-1.5 py-0.5 rounded
          ${node.ragStatus === 'Ready' ? 'bg-emerald-500/20 text-emerald-400' : ''}
          ${node.ragStatus === 'Stale' ? 'bg-amber-500/20 text-amber-400' : ''}
          ${node.ragStatus === 'Partial' ? 'bg-orange-500/20 text-orange-400' : ''}
          ${node.ragStatus === 'Unindexed' ? 'bg-red-500/20 text-red-400' : ''}
          ${node.ragStatus === 'Unknown' ? 'bg-slate-500/20 text-slate-400' : ''}
        `}
        >
          {node.ragStatus}
        </span>

        {/* Drift Indicator */}
        <DriftIndicator risk={node.fleetRagDriftRisk} />
      </div>

      {/* Warning Indicators */}
      {hasWarnings && (
        <div className='flex items-center gap-1 mt-1'>
          {node.recentGuardrailDeny && (
            <span className='text-[0.5rem] text-red-400' title='Recent guardrail denial'>
              🛡️ Denied
            </span>
          )}
          {node.recentSafeModeRecommended && (
            <span className='text-[0.5rem] text-amber-400' title='Safe mode recommended'>
              ⚙️ SafeMode
            </span>
          )}
        </div>
      )}

      {/* Configured indicator */}
      {!node.configured && (
        <span className='text-[0.5rem] text-slate-500 italic'>Not Configured</span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEGEND COMPONENT
// ═══════════════════════════════════════════════════════════════

function AtlasLegend() {
  return (
    <div className='absolute bottom-4 left-4 rounded-lg border border-slate-700/60 bg-slate-900/90 p-3'>
      <div className='text-[0.6rem] uppercase tracking-wider text-slate-500 mb-2'>Legend</div>
      <div className='flex flex-col gap-1.5'>
        <div className='flex items-center gap-2'>
          <span className='w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-400'></span>
          <span className='text-[0.65rem] text-emerald-400'>Healthy</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='w-3 h-3 rounded-full bg-amber-500/40 border border-amber-400'></span>
          <span className='text-[0.65rem] text-amber-400'>Degraded</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='w-3 h-3 rounded-full bg-red-500/40 border border-red-400'></span>
          <span className='text-[0.65rem] text-red-400'>Unhealthy</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='w-3 h-3 rounded-full bg-slate-500/40 border border-slate-400'></span>
          <span className='text-[0.65rem] text-slate-400'>Unknown</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATS SUMMARY COMPONENT
// ═══════════════════════════════════════════════════════════════

interface AtlasStatsProps {
  nodes: readonly SystemGptAtlasNode[];
  generatedAt: string;
}

function AtlasStats({ nodes, generatedAt }: AtlasStatsProps) {
  const healthyCount = nodes.filter((n) => n.health === 'Healthy').length;
  const degradedCount = nodes.filter((n) => n.health === 'Degraded').length;
  const unhealthyCount = nodes.filter((n) => n.health === 'Unhealthy').length;
  const configuredCount = nodes.filter((n) => n.configured).length;

  const timestamp = new Date(generatedAt).toLocaleTimeString();

  return (
    <div className='absolute top-4 right-4 rounded-lg border border-slate-700/60 bg-slate-900/90 p-3'>
      <div className='text-[0.6rem] uppercase tracking-wider text-slate-500 mb-2'>
        Fleet Status
      </div>
      <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-[0.7rem]'>
        <span className='text-slate-400'>Total:</span>
        <span className='text-cyan-400 font-semibold'>{nodes.length}</span>

        <span className='text-slate-400'>Healthy:</span>
        <span className='text-emerald-400 font-semibold'>{healthyCount}</span>

        <span className='text-slate-400'>Degraded:</span>
        <span className='text-amber-400 font-semibold'>{degradedCount}</span>

        <span className='text-slate-400'>Unhealthy:</span>
        <span className='text-red-400 font-semibold'>{unhealthyCount}</span>

        <span className='text-slate-400'>Configured:</span>
        <span className='text-slate-300 font-semibold'>{configuredCount}</span>
      </div>
      <div className='mt-2 text-[0.55rem] text-slate-500'>Updated: {timestamp}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN ATLAS PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════

interface SystemGptAtlasPanelProps {
  /** Callback when a county node is clicked */
  onCountySelect: (countyId: string) => void;
  /** Auto-refresh interval in ms (default: 30s) */
  refreshInterval?: number;
}

export function SystemGptAtlasPanel({
  onCountySelect,
  refreshInterval = 30000,
}: SystemGptAtlasPanelProps) {
  const [atlas, setAtlas] = useState<SystemGptAtlasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch atlas data
  const loadAtlas = async () => {
    try {
      const data = await fetchSystemGptAtlas();
      setAtlas(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load atlas';
      setError(message);
      console.error('[AtlasPanel] Failed to fetch atlas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    loadAtlas();

    if (refreshInterval > 0) {
      const interval = setInterval(loadAtlas, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Loading state
  if (loading && !atlas) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='flex items-center gap-3 text-slate-400'>
          <div className='h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent' />
          <span>Loading Atlas…</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !atlas) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='rounded-xl border border-rose-500/40 bg-rose-500/10 px-6 py-4 text-rose-200'>
          <div className='flex items-center gap-2 font-medium'>
            <span>⚠️</span>
            <span>Atlas Error</span>
          </div>
          <p className='mt-2 text-sm text-rose-300/80'>{error}</p>
          <button
            onClick={loadAtlas}
            className='mt-3 rounded bg-rose-500/20 px-3 py-1 text-sm hover:bg-rose-500/30'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!atlas || atlas.nodes.length === 0) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center text-slate-400'>
          <div className='text-4xl mb-2'>🗺️</div>
          <p>No county data available</p>
          <p className='text-sm text-slate-500 mt-1'>Configure counties to see the Atlas view</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h2 className='text-lg font-semibold text-cyan-300'>🗺️ SystemGPT Atlas</h2>
          <p className='text-[0.7rem] text-slate-500'>
            Phase 28: Map-based AI health visualization across all counties
          </p>
        </div>
        <button
          onClick={loadAtlas}
          disabled={loading}
          className='rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-50'
        >
          {loading ? '⟳ Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* Map Container */}
      <div className='relative flex-1 rounded-xl border border-slate-700/60 bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/80 overflow-hidden min-h-[400px]'>
        {/* Background grid pattern for map effect */}
        <div
          className='absolute inset-0 opacity-10'
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--tf-cyan-hs) 50% / 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--tf-cyan-hs) 50% / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Washington State silhouette hint (simplified) */}
        <div className='absolute inset-0 flex items-center justify-center opacity-5'>
          <div className='text-[15rem] text-cyan-500'>WA</div>
        </div>

        {/* County Nodes */}
        {atlas.nodes.map((node) => (
          <AtlasNode key={node.countyId} node={node} onClick={onCountySelect} />
        ))}

        {/* Legend */}
        <AtlasLegend />

        {/* Stats */}
        <AtlasStats nodes={atlas.nodes} generatedAt={atlas.generatedAtUtc} />

        {/* Error indicator (if refresh failed but we have stale data) */}
        {error && (
          <div className='absolute top-4 left-1/2 -translate-x-1/2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-400'>
            ⚠️ Refresh failed - showing cached data
          </div>
        )}
      </div>

      {/* Instruction hint */}
      <div className='mt-3 text-center text-[0.65rem] text-slate-500'>
        💡 Click a county node to view detailed diagnostics in the Overview tab
      </div>
    </div>
  );
}

export default SystemGptAtlasPanel;

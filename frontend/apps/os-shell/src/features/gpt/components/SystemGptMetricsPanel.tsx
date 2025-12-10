/**
 * ═══════════════════════════════════════════════════════════════
 * SYSTEMGPT METRICS PANEL
 * Phase 20: AI Metrics & Telemetry Console
 * "How fast is GPT right now?" "What's our error rate?" "How busy is the AI?"
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo } from 'react';
import {
  getSystemGptMetrics,
  type SystemGptMetricsSnapshot,
  type SystemGptMetricSeries,
} from '../../../api/systemDiagnosticsApi';

// ═══════════════════════════════════════════════════════════════
// SPARKLINE COMPONENT
// ═══════════════════════════════════════════════════════════════

interface SparklineProps {
  series: SystemGptMetricSeries;
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Simple SVG sparkline chart for metrics visualization.
 * No external charting library needed - just minimal SVG.
 */
function Sparkline({ series, width = 120, height = 32, color = '#00FFFF' }: SparklineProps) {
  const points = series.points;

  if (points.length === 0) {
    return (
      <svg width={width} height={height} className='opacity-30'>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeOpacity={0.3} />
      </svg>
    );
  }

  // Calculate min/max for scaling
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // Avoid division by zero

  // Map points to SVG coordinates
  const svgPoints = points
    .map((p, i) => {
      const x = (i / (points.length - 1 || 1)) * width;
      const y = height - ((p.value - min) / range) * (height - 4) - 2; // 2px padding
      return `${x},${y}`;
    })
    .join(' ');

  // Get last value for display
  const lastValue = points[points.length - 1]?.value ?? 0;

  return (
    <div className='flex items-center gap-2'>
      <svg width={width} height={height}>
        {/* Background grid line */}
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeOpacity={0.1} />
        {/* Sparkline */}
        <polyline fill='none' stroke={color} strokeWidth={1.5} strokeLinecap='round' strokeLinejoin='round' points={svgPoints} />
        {/* End dot */}
        {points.length > 0 && (
          <circle
            cx={(points.length - 1) / (points.length - 1 || 1) * width}
            cy={height - ((lastValue - min) / range) * (height - 4) - 2}
            r={2.5}
            fill={color}
          />
        )}
      </svg>
      <span className='text-xs text-slate-400'>
        {lastValue.toFixed(series.unit === '%' ? 1 : 0)}
        <span className='text-slate-500 ml-0.5'>{series.unit}</span>
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════════════════════════

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  color?: 'cyan' | 'green' | 'yellow' | 'red' | 'slate';
}

function StatCard({ label, value, unit, subtext, color = 'cyan' }: StatCardProps) {
  const colorClasses = {
    cyan: 'text-cyan-400 border-cyan-500/30',
    green: 'text-emerald-400 border-emerald-500/30',
    yellow: 'text-amber-400 border-amber-500/30',
    red: 'text-red-400 border-red-500/30',
    slate: 'text-slate-400 border-slate-500/30',
  };

  return (
    <div className={`rounded-lg border bg-slate-900/50 p-3 ${colorClasses[color]}`}>
      <div className='text-[0.65rem] uppercase tracking-wider text-slate-500 mb-1'>{label}</div>
      <div className='flex items-baseline gap-1'>
        <span className={`text-xl font-semibold ${colorClasses[color].split(' ')[0]}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className='text-xs text-slate-500'>{unit}</span>}
      </div>
      {subtext && <div className='text-[0.6rem] text-slate-600 mt-1'>{subtext}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN METRICS PANEL
// ═══════════════════════════════════════════════════════════════

interface SystemGptMetricsPanelProps {
  windowMinutes?: number;
  maxSeriesPoints?: number;
  refreshIntervalMs?: number;
}

type MetricsState =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: SystemGptMetricsSnapshot };

export function SystemGptMetricsPanel({
  windowMinutes = 15,
  maxSeriesPoints = 40,
  refreshIntervalMs = 30000, // 30 second refresh
}: SystemGptMetricsPanelProps) {
  const [state, setState] = useState<MetricsState>({ status: 'loading' });

  // Fetch metrics
  useEffect(() => {
    let cancelled = false;

    const fetchMetrics = async () => {
      try {
        const data = await getSystemGptMetrics(windowMinutes, maxSeriesPoints);
        if (!cancelled) {
          setState({ status: 'ready', data });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) });
        }
      }
    };

    fetchMetrics();

    // Set up auto-refresh
    const interval = setInterval(fetchMetrics, refreshIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [windowMinutes, maxSeriesPoints, refreshIntervalMs]);

  // Extract series by name
  const seriesByName = useMemo(() => {
    if (state.status !== 'ready') return {};
    return Object.fromEntries(state.data.series.map((s) => [s.name, s]));
  }, [state]);

  // Determine error rate color
  const getErrorRateColor = (rate: number): StatCardProps['color'] => {
    if (rate === 0) return 'green';
    if (rate < 1) return 'cyan';
    if (rate < 5) return 'yellow';
    return 'red';
  };

  // Determine latency color
  const getLatencyColor = (ms: number): StatCardProps['color'] => {
    if (ms === 0) return 'slate';
    if (ms < 500) return 'green';
    if (ms < 1500) return 'cyan';
    if (ms < 3000) return 'yellow';
    return 'red';
  };

  // Loading state
  if (state.status === 'loading') {
    return (
      <div className='rounded-lg border border-slate-800/60 bg-slate-900/40 p-4'>
        <div className='flex items-center gap-2 text-slate-500'>
          <svg className='h-4 w-4 animate-spin' fill='none' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z' />
          </svg>
          <span className='text-sm'>Loading AI metrics...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (state.status === 'error') {
    return (
      <div className='rounded-lg border border-red-500/30 bg-red-900/20 p-4'>
        <div className='flex items-center gap-2 text-red-400'>
          <span className='text-sm'>⚠️ Failed to load metrics: {state.error.message}</span>
        </div>
      </div>
    );
  }

  const { data } = state;

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-sm font-medium text-slate-300'>📈 AI Metrics & Telemetry</h3>
          <p className='text-[0.65rem] text-slate-500'>
            Last {data.windowMinutes} minutes · {data.totalRequests.toLocaleString()} requests
          </p>
        </div>
        <span className='text-[0.6rem] text-slate-600'>
          Updated: {new Date(data.generatedAtUtc).toLocaleTimeString()}
        </span>
      </div>

      {/* Stat Cards Grid */}
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
        <StatCard
          label='GPT p95 Latency'
          value={data.gptLatencyMsP95.toFixed(0)}
          unit='ms'
          subtext={`p50: ${data.gptLatencyMsP50.toFixed(0)}ms`}
          color={getLatencyColor(data.gptLatencyMsP95)}
        />
        <StatCard
          label='Requests/min'
          value={data.requestsPerMinute.toFixed(1)}
          unit='req/min'
          color={data.requestsPerMinute > 0 ? 'cyan' : 'slate'}
        />
        <StatCard
          label='Error Rate'
          value={data.errorRatePercent.toFixed(2)}
          unit='%'
          color={getErrorRateColor(data.errorRatePercent)}
        />
        <StatCard
          label='RAG p95 Latency'
          value={data.ragLatencyMsP95.toFixed(0)}
          unit='ms'
          color={getLatencyColor(data.ragLatencyMsP95)}
        />
        <StatCard
          label='Tokens'
          value={`${(data.totalTokensIn / 1000).toFixed(1)}k / ${(data.totalTokensOut / 1000).toFixed(1)}k`}
          subtext='in / out'
          color='slate'
        />
      </div>

      {/* Sparkline Charts */}
      {data.series.length > 0 && (
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          {/* Latency Sparkline */}
          {seriesByName['gpt_latency_ms_avg'] && (
            <div className='rounded-lg border border-slate-800/40 bg-slate-900/30 p-3'>
              <div className='text-[0.65rem] text-slate-500 mb-2'>GPT Latency (avg)</div>
              <Sparkline series={seriesByName['gpt_latency_ms_avg']} color='#00FFFF' width={140} height={36} />
            </div>
          )}

          {/* Throughput Sparkline */}
          {seriesByName['requests_per_minute'] && (
            <div className='rounded-lg border border-slate-800/40 bg-slate-900/30 p-3'>
              <div className='text-[0.65rem] text-slate-500 mb-2'>Throughput</div>
              <Sparkline series={seriesByName['requests_per_minute']} color='#00FF88' width={140} height={36} />
            </div>
          )}

          {/* Error Rate Sparkline */}
          {seriesByName['error_rate_percent'] && (
            <div className='rounded-lg border border-slate-800/40 bg-slate-900/30 p-3'>
              <div className='text-[0.65rem] text-slate-500 mb-2'>Error Rate</div>
              <Sparkline series={seriesByName['error_rate_percent']} color='#FF6B6B' width={140} height={36} />
            </div>
          )}
        </div>
      )}

      {/* Empty state for no data */}
      {data.totalRequests === 0 && (
        <div className='rounded-lg border border-slate-800/40 bg-slate-900/30 p-4 text-center'>
          <span className='text-sm text-slate-500'>No AI requests in the last {data.windowMinutes} minutes</span>
        </div>
      )}
    </div>
  );
}

export default SystemGptMetricsPanel;

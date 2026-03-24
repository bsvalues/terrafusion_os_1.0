/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION GOVERNANCE DASHBOARD
 * Phase 7.4: GovernanceLock Metrics & Monitoring
 *
 * Role-gated dashboard for elevated users:
 *   - admin, compliance_officer, auditor, supervisor
 *
 * Displays:
 *   - Invocations by risk level
 *   - Access denials
 *   - Top tools invoked
 *   - Recent high-risk activity feed
 *
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useEffect, useState } from 'react';
import { getRiskBadgeColor } from '../api/pilotApi';

// ═══════════════════════════════════════════════════════════════
// API TYPES (mirrors backend MetricsService types)
// ═══════════════════════════════════════════════════════════════

type TimeWindow = '1h' | '24h' | '7d' | '30d';

interface RiskBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface ModeBreakdown {
  pilot: number;
  muse: number;
}

interface ToolUsage {
  toolId: string;
  count: number;
  risk: string;
}

interface MetricsSummary {
  window: TimeWindow;
  countyId: string;
  timestamp: string;
  invocations: {
    total: number;
    byRisk: RiskBreakdown;
    byMode: ModeBreakdown;
  };
  accessDenials: {
    total: number;
    crossCounty: number;
    userMismatch: number;
  };
  topTools: ToolUsage[];
}

interface HighRiskEvent {
  eventId: string;
  toolId: string;
  risk: string;
  timestamp: string;
  userId: string;
  action: string;
  summary: string;
}

interface HighRiskFeed {
  countyId: string;
  timestamp: string;
  events: HighRiskEvent[];
}

// ═══════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════

const API_BASE = '/api/pilot';

async function getMetricsSummary(window: TimeWindow): Promise<MetricsSummary> {
  const response = await fetch(`${API_BASE}/metrics/summary?window=${window}`);
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('ACCESS_DENIED');
    }
    throw new Error(`Failed to fetch metrics: ${response.status}`);
  }
  return response.json();
}

async function getHighRiskFeed(limit: number = 50): Promise<HighRiskFeed> {
  const response = await fetch(`${API_BASE}/metrics/high-risk?limit=${limit}`);
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('ACCESS_DENIED');
    }
    throw new Error(`Failed to fetch high-risk feed: ${response.status}`);
  }
  return response.json();
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT TYPES
// ═══════════════════════════════════════════════════════════════

interface DashboardState {
  summary: MetricsSummary | null;
  highRiskFeed: HighRiskFeed | null;
  loading: boolean;
  error: string | null;
  accessDenied: boolean;
  window: TimeWindow;
  autoRefresh: boolean;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function GovernanceDashboard(): React.ReactElement {
  const [state, setState] = useState<DashboardState>({
    summary: null,
    highRiskFeed: null,
    loading: false,
    error: null,
    accessDenied: false,
    window: '24h',
    autoRefresh: true,
  });

  // ═════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═════════════════════════════════════════════════════════════

  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [summary, highRiskFeed] = await Promise.all([
        getMetricsSummary(state.window),
        getHighRiskFeed(50),
      ]);

      setState((prev) => ({
        ...prev,
        summary,
        highRiskFeed,
        loading: false,
        accessDenied: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message === 'ACCESS_DENIED') {
        setState((prev) => ({
          ...prev,
          loading: false,
          accessDenied: true,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
      }
    }
  }, [state.window]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [state.window]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!state.autoRefresh || state.accessDenied) return;

    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [state.autoRefresh, state.accessDenied, loadData]);

  // ═════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═════════════════════════════════════════════════════════════

  const renderAccessDenied = () => (
    <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
      <div className='text-center p-8 max-w-md'>
        <div className='text-6xl mb-4'>🔒</div>
        <h1 className='text-2xl font-bold text-red-400 mb-4'>Access Denied</h1>
        <p className='text-slate-400 mb-6'>
          The GovernanceLock Dashboard requires elevated permissions.
        </p>
        <div className='text-sm text-slate-500 bg-slate-900 rounded p-4'>
          <p className='font-semibold mb-2'>Required Roles:</p>
          <ul className='list-disc list-inside text-left'>
            <li>admin</li>
            <li>compliance_officer</li>
            <li>auditor</li>
            <li>supervisor</li>
          </ul>
        </div>
        <a
          href='/pilot'
          className='inline-block mt-6 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded hover:bg-cyan-500/30 transition-colors'
        >
          ← Return to Pilot Console
        </a>
      </div>
    </div>
  );

  const renderRiskBar = (label: string, value: number, total: number, colorClass: string) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className='mb-3'>
        <div className='flex justify-between text-sm mb-1'>
          <span className={colorClass}>{label}</span>
          <span className='text-slate-400'>
            {value} ({percentage.toFixed(1)}%)
          </span>
        </div>
        <div className='h-2 bg-slate-800 rounded-full overflow-hidden'>
          <div
            className={`h-full ${colorClass.replace('text-', 'bg-')}/60 transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderToolCard = (tool: ToolUsage, rank: number) => (
    <div
      key={tool.toolId}
      className='flex items-center gap-3 p-2 bg-slate-800/30 rounded border border-slate-700/50'
    >
      <div className='w-6 h-6 flex items-center justify-center bg-slate-700 rounded text-xs text-slate-400'>
        {rank}
      </div>
      <div className='flex-1 min-w-0'>
        <div className='font-mono text-sm text-white truncate'>{tool.toolId}</div>
      </div>
      <span className={`px-2 py-0.5 text-xs rounded border ${getRiskBadgeColor(tool.risk)}`}>
        {tool.risk}
      </span>
      <span className='text-cyan-400 font-semibold text-sm w-12 text-right'>{tool.count}</span>
    </div>
  );

  const renderHighRiskEvent = (event: HighRiskEvent) => (
    <div
      key={event.eventId}
      className='p-3 bg-slate-800/30 rounded border-l-2 border-red-500/50 hover:bg-slate-800/50 transition-colors'
    >
      <div className='flex justify-between items-start mb-1'>
        <span className='font-mono text-sm text-cyan-400 truncate flex-1'>{event.toolId}</span>
        <span className={`px-2 py-0.5 text-xs rounded border ${getRiskBadgeColor(event.risk)}`}>
          {event.risk}
        </span>
      </div>
      <p className='text-slate-300 text-sm mb-2'>{event.summary}</p>
      <div className='flex gap-3 text-xs text-slate-500'>
        <span>👤 {event.userId}</span>
        <span>⏱ {new Date(event.timestamp).toLocaleString()}</span>
      </div>
    </div>
  );

  // ═════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═════════════════════════════════════════════════════════════

  if (state.accessDenied) {
    return renderAccessDenied();
  }

  const { summary, highRiskFeed, loading, error, window: currentWindow, autoRefresh } = state;
  const invocations = summary?.invocations;
  const denials = summary?.accessDenials;

  return (
    <div className='min-h-screen bg-slate-950 text-white p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-2xl font-bold text-cyan-400 mb-1'>GovernanceLock Dashboard</h1>
            <p className='text-slate-400 text-sm'>Auto-refresh metrics (30s poll) • County-scoped • Phase 7.4</p>
          </div>
          <div className='flex gap-4 items-center'>
            {/* Time window selector */}
            <div className='flex gap-1 bg-slate-800 rounded p-1'>
              {(['1h', '24h', '7d', '30d'] as TimeWindow[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setState((prev) => ({ ...prev, window: w }))}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    currentWindow === w
                      ? 'bg-cyan-500/30 text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            {/* Auto-refresh toggle */}
            <label className='flex items-center gap-2 text-sm text-slate-400'>
              <input
                type='checkbox'
                checked={autoRefresh}
                onChange={(e) => setState((prev) => ({ ...prev, autoRefresh: e.target.checked }))}
                className='rounded'
              />
              Auto-refresh
            </label>

            {/* Refresh button */}
            <button
              onClick={loadData}
              disabled={loading}
              className='px-4 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-cyan-500/50 transition-colors disabled:opacity-50'
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className='p-4 bg-red-500/20 border border-red-500/30 rounded mb-6 text-red-400'>
            {error}
          </div>
        )}

        {/* Metrics grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
          {/* Invocations by Risk */}
          <div className='bg-slate-900/50 border border-slate-800 rounded-lg p-6'>
            <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <span className='text-cyan-400'>📊</span>
              Invocations by Risk
            </h2>
            {invocations ? (
              <>
                <div className='text-3xl font-bold text-white mb-4'>
                  {invocations.total.toLocaleString()}
                  <span className='text-sm text-slate-400 font-normal ml-2'>total</span>
                </div>
                {renderRiskBar(
                  'Critical',
                  invocations.byRisk.critical,
                  invocations.total,
                  'text-red-400'
                )}
                {renderRiskBar(
                  'High',
                  invocations.byRisk.high,
                  invocations.total,
                  'text-orange-400'
                )}
                {renderRiskBar(
                  'Medium',
                  invocations.byRisk.medium,
                  invocations.total,
                  'text-yellow-400'
                )}
                {renderRiskBar('Low', invocations.byRisk.low, invocations.total, 'text-green-400')}
              </>
            ) : (
              <div className='text-slate-500 text-center py-8'>No data</div>
            )}
          </div>

          {/* Access Denials */}
          <div className='bg-slate-900/50 border border-slate-800 rounded-lg p-6'>
            <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <span className='text-red-400'>🛡️</span>
              Access Denials
            </h2>
            {denials ? (
              <>
                <div className='text-3xl font-bold text-white mb-4'>
                  {denials.total.toLocaleString()}
                  <span className='text-sm text-slate-400 font-normal ml-2'>blocked</span>
                </div>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center p-2 bg-red-500/10 rounded'>
                    <span className='text-sm text-red-400'>Cross-County Attempts</span>
                    <span className='font-semibold text-red-300'>{denials.crossCounty}</span>
                  </div>
                  <div className='flex justify-between items-center p-2 bg-orange-500/10 rounded'>
                    <span className='text-sm text-orange-400'>User Mismatch</span>
                    <span className='font-semibold text-orange-300'>{denials.userMismatch}</span>
                  </div>
                </div>
                {denials.total > 0 && (
                  <div className='mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500'>
                    Zero cross-county leaks enforced by TraceAccessControl
                  </div>
                )}
              </>
            ) : (
              <div className='text-slate-500 text-center py-8'>No data</div>
            )}
          </div>

          {/* Mode Distribution */}
          <div className='bg-slate-900/50 border border-slate-800 rounded-lg p-6'>
            <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <span className='text-purple-400'>🎛️</span>
              Mode Distribution
            </h2>
            {invocations ? (
              <>
                <div className='flex gap-4 mb-4'>
                  <div className='flex-1 text-center p-4 bg-blue-500/10 rounded'>
                    <div className='text-2xl font-bold text-blue-400'>
                      {invocations.byMode.pilot}
                    </div>
                    <div className='text-sm text-slate-400'>Pilot</div>
                  </div>
                  <div className='flex-1 text-center p-4 bg-purple-500/10 rounded'>
                    <div className='text-2xl font-bold text-purple-400'>
                      {invocations.byMode.muse}
                    </div>
                    <div className='text-sm text-slate-400'>Muse</div>
                  </div>
                </div>
                <div className='text-xs text-slate-500'>
                  County: <span className='text-cyan-400'>{summary?.countyId}</span>
                </div>
              </>
            ) : (
              <div className='text-slate-500 text-center py-8'>No data</div>
            )}
          </div>
        </div>

        {/* Bottom section: Top Tools + High-Risk Feed */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Top Tools */}
          <div className='bg-slate-900/50 border border-slate-800 rounded-lg p-6'>
            <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <span className='text-yellow-400'>🔧</span>
              Top Tools Invoked
            </h2>
            {summary?.topTools && summary.topTools.length > 0 ? (
              <div className='space-y-2'>
                {summary.topTools.map((tool, index) => renderToolCard(tool, index + 1))}
              </div>
            ) : (
              <div className='text-slate-500 text-center py-8'>No tool invocations yet</div>
            )}
          </div>

          {/* High-Risk Activity Feed */}
          <div className='bg-slate-900/50 border border-slate-800 rounded-lg p-6'>
            <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
              <span className='text-red-400'>⚡</span>
              Recent High-Risk Activity
            </h2>
            {highRiskFeed?.events && highRiskFeed.events.length > 0 ? (
              <div className='space-y-3 max-h-96 overflow-y-auto'>
                {highRiskFeed.events.map(renderHighRiskEvent)}
              </div>
            ) : (
              <div className='text-slate-500 text-center py-8'>
                <div className='text-4xl mb-2'>✓</div>
                No high-risk activity in the selected window
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='mt-12 pt-6 border-t border-slate-800 text-center text-slate-500 text-xs'>
          <p>
            TerraFusion GovernanceLock • Phase 7.4 • Auto-Refresh Metrics (30s Poll)
            {summary && (
              <span className='ml-2'>
                • Last updated: {new Date(summary.timestamp).toLocaleString()}
              </span>
            )}
          </p>
          <p className='mt-1 text-cyan-500/50'>Government. Transcended.</p>
        </div>
      </div>
    </div>
  );
}

export default GovernanceDashboard;

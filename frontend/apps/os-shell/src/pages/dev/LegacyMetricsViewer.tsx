/**
 * LegacyMetricsViewer.tsx
 *
 * Phase 7: Dev-only legacy burn-down viewer panel.
 *
 * Features:
 * - Displays aggregated legacy usage metrics from sessionStorage
 * - Sort by count desc (default) or lastSeen desc
 * - Filter by prefix: modules.* or suites.*
 * - Copy JSON to clipboard
 * - Reset all metrics (with confirmation)
 *
 * DEV ONLY - Do not expose in production.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MetricsEntry,
  readAllLegacyMetrics,
  clearAllLegacyMetrics,
} from '../../telemetry/legacyUiTelemetry';

type SortKey = 'count' | 'lastSeen';
type FilterKey = 'all' | 'modules' | 'suites';

interface MetricRow {
  legacyAppId: string;
  entry: MetricsEntry;
}

const LegacyMetricsViewer: React.FC = () => {
  const [metrics, setMetrics] = useState<Record<string, MetricsEntry>>({});
  const [sortBy, setSortBy] = useState<SortKey>('count');
  const [filterBy, setFilterBy] = useState<FilterKey>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Load metrics from storage
  const loadMetrics = useCallback(() => {
    const loaded = readAllLegacyMetrics();
    setMetrics(loaded);
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  // Convert to array and apply sort + filter
  const getRows = (): MetricRow[] => {
    let rows: MetricRow[] = Object.entries(metrics).map(([legacyAppId, entry]) => ({
      legacyAppId,
      entry,
    }));

    // Apply filter
    if (filterBy !== 'all') {
      rows = rows.filter((row) => row.legacyAppId.startsWith(`${filterBy}.`));
    }

    // Apply sort
    rows.sort((a, b) => {
      if (sortBy === 'count') {
        return b.entry.count - a.entry.count;
      } else {
        // lastSeen descending
        return new Date(b.entry.lastSeen).getTime() - new Date(a.entry.lastSeen).getTime();
      }
    });

    return rows;
  };

  const rows = getRows();

  // Toggle row expansion
  const toggleExpand = (legacyAppId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(legacyAppId)) {
        next.delete(legacyAppId);
      } else {
        next.add(legacyAppId);
      }
      return next;
    });
  };

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    try {
      const json = JSON.stringify(metrics, null, 2);
      await navigator.clipboard.writeText(json);
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Copy failed');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  // Reset all metrics
  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    clearAllLegacyMetrics();
    setMetrics({});
    setShowResetConfirm(false);
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  // Format date for display
  const formatDate = (iso: string): string => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 text-gray-100 p-6'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-cyan-400 mb-2'>Legacy Burn-Down Viewer</h1>
        <p className='text-gray-400 text-sm'>
          Dev-only panel for monitoring legacy UI surface usage. Use this to prioritize removals.
        </p>
      </div>

      {/* Controls */}
      <div className='flex flex-wrap gap-4 mb-6 items-center'>
        {/* Sort */}
        <label className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>Sort by:</span>
          <select
            aria-label='Sort by'
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className='bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-500'
          >
            <option value='count'>Count (desc)</option>
            <option value='lastSeen'>Last Seen (desc)</option>
          </select>
        </label>

        {/* Filter */}
        <label className='flex items-center gap-2 text-sm'>
          <span className='text-gray-400'>Filter:</span>
          <select
            aria-label='Filter'
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterKey)}
            className='bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-cyan-500'
          >
            <option value='all'>All</option>
            <option value='modules'>modules.*</option>
            <option value='suites'>suites.*</option>
          </select>
        </label>

        {/* Actions */}
        <div className='flex gap-2 ml-auto'>
          <button
            onClick={handleCopyJson}
            className='px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium transition-colors'
          >
            {copyFeedback ?? 'Copy JSON'}
          </button>
          <button
            onClick={handleReset}
            className='px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded text-sm font-medium transition-colors'
          >
            Reset
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-gray-800 rounded-lg p-6 max-w-md shadow-xl'>
            <h2 className='text-lg font-semibold mb-2 text-yellow-400'>Confirm Reset</h2>
            <p className='text-gray-300 mb-4'>
              This will clear all legacy metrics and dismissed banner flags. This cannot be undone.
            </p>
            <div className='flex justify-end gap-3'>
              <button
                onClick={cancelReset}
                className='px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded font-medium transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className='px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-medium transition-colors'
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {rows.length === 0 && (
        <div className='text-center py-12 text-gray-500'>
          <p className='text-lg'>No legacy usage recorded</p>
          <p className='text-sm mt-2'>
            Visit legacy routes like <code>/modules/*</code> or{' '}
            <code>/suites/*</code> to start tracking.
          </p>
        </div>
      )}

      {/* Metrics Table */}
      {rows.length > 0 && (
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-gray-700 text-left'>
                <th className='py-2 px-3 text-gray-400 font-medium text-sm'>App ID</th>
                <th className='py-2 px-3 text-gray-400 font-medium text-sm text-right'>Count</th>
                <th className='py-2 px-3 text-gray-400 font-medium text-sm'>First Seen</th>
                <th className='py-2 px-3 text-gray-400 font-medium text-sm'>Last Seen</th>
                <th className='py-2 px-3 text-gray-400 font-medium text-sm'>Routes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ legacyAppId, entry }) => {
                const isExpanded = expandedRows.has(legacyAppId);
                return (
                  <React.Fragment key={legacyAppId}>
                    <tr className='border-b border-gray-800 hover:bg-gray-800/50'>
                      <td className='py-2 px-3 font-mono text-sm text-cyan-300'>{legacyAppId}</td>
                      <td className='py-2 px-3 text-right font-bold text-yellow-300'>
                        {entry.count}
                      </td>
                      <td className='py-2 px-3 text-sm text-gray-400'>
                        {formatDate(entry.firstSeen)}
                      </td>
                      <td className='py-2 px-3 text-sm text-gray-400'>
                        {formatDate(entry.lastSeen)}
                      </td>
                      <td className='py-2 px-3'>
                        <button
                          onClick={() => toggleExpand(legacyAppId)}
                          aria-label='Expand'
                          className='text-gray-400 hover:text-gray-200 text-sm underline'
                        >
                          {entry.routes.length} route{entry.routes.length !== 1 ? 's' : ''}{' '}
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className='bg-gray-800/30'>
                        <td colSpan={5} className='py-2 px-6'>
                          <ul className='list-disc list-inside text-sm text-gray-300'>
                            {entry.routes.map((route) => (
                              <li key={route} className='font-mono'>
                                {route}
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {rows.length > 0 && (
        <div className='mt-6 pt-4 border-t border-gray-700 text-sm text-gray-400'>
          <span>Total entries: {rows.length}</span>
          <span className='mx-3'>|</span>
          <span>
            Total hits: {rows.reduce((sum, r) => sum + r.entry.count, 0)}
          </span>
        </div>
      )}
    </div>
  );
};

export default LegacyMetricsViewer;

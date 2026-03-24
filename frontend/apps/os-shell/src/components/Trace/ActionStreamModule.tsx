/**
 * TerraFusion Action Stream Module
 *
 * Displays a real-time stream of OS action trace events.
 * Shows invoked and blocked actions with filtering capabilities.
 * Supports Live mode (real-time) and History mode (persisted events).
 * Slice 22: Added Jump-to-Surface affordances for navigable traces.
 *
 * @module components/Trace/ActionStreamModule
 * @see Slice 17: Action Observability Surface
 * @see Slice 20: Persisted Telemetry Backend
 * @see Slice 22: Trace-to-UI Correlation + Deep Link Replay
 */

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ACTION_STREAM_CAP,
    useActionStream,
    type ActionStreamEvent,
    type ActionStreamFilter,
    type StreamMode,
} from '../../hooks/useActionStream';
import { executeOsAction, type OsActionContext } from '../../services/osActions';
import { traceToOsAction } from './traceToOsAction';

// ============================================================================
// Types
// ============================================================================

export interface ActionStreamModuleProps {
  /** Maximum height (default: 100%) */
  maxHeight?: string;
  /** Show filter controls (default: true) */
  showFilters?: boolean;
  /** Optional class name */
  className?: string;
  /** Optional telemetry store for testing (defaults to singleton) */
  telemetryStore?: ReturnType<typeof import('../../services/telemetry/telemetryStore').getTelemetryStore>;
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ModeToggleProps {
  mode: StreamMode;
  onModeChange: (mode: StreamMode) => void;
  historyCount: number;
  isLoading: boolean;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange, historyCount, isLoading }) => (
  <div className='flex items-center gap-1 bg-slate-800 rounded-lg p-0.5'>
    <button
      type='button'
      role='button'
      aria-pressed={mode === 'live'}
      onClick={() => onModeChange('live')}
      className={`
        px-3 py-1 text-xs font-medium rounded-md transition-all
        ${
          mode === 'live'
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'text-slate-400 hover:text-slate-200'
        }
      `}
    >
      Live
    </button>
    <button
      type='button'
      role='button'
      aria-pressed={mode === 'history'}
      onClick={() => onModeChange('history')}
      className={`
        px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5
        ${
          mode === 'history'
            ? 'bg-blue-500/20 text-blue-400'
            : 'text-slate-400 hover:text-slate-200'
        }
      `}
    >
      History
      {mode === 'history' && !isLoading && historyCount > 0 && (
        <span className='bg-blue-500/30 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full'>
          {historyCount}
        </span>
      )}
      {isLoading && <span className='animate-pulse'>...</span>}
    </button>
  </div>
);

interface FilterControlsProps {
  filter: ActionStreamFilter;
  onFilterChange: (filter: ActionStreamFilter) => void;
  onClear: () => void;
  onWipe?: () => void;
  totalCount: number;
  mode: StreamMode;
  maxCount: number;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filter,
  onFilterChange,
  onClear,
  onWipe,
  totalCount,
  mode,
  maxCount,
}) => (
  <div className='flex flex-wrap items-center gap-3 p-3 bg-slate-800/50 border-b border-slate-700/50'>
    {/* Surface filter */}
    <div className='flex items-center gap-2'>
      <label htmlFor='filter-surface' className='text-xs text-slate-400'>
        Surface:
      </label>
      <select
        id='filter-surface'
        aria-label='Filter by surface'
        value={filter.surface || ''}
        onChange={(e) =>
          onFilterChange({
            ...filter,
            surface: (e.target.value as ActionStreamFilter['surface']) || undefined,
          })
        }
        className='px-2 py-1 text-xs rounded bg-slate-700 text-slate-200 border border-slate-600 focus:border-cyan-400 focus:outline-none'
      >
        <option value=''>All</option>
        <option value='launcher'>Launcher</option>
        <option value='standalone_home'>Standalone</option>
        <option value='desktop'>Desktop</option>
        <option value='module'>Module</option>
        <option value='workbench'>Workbench</option>
        <option value='trace'>Trace</option>
      </select>
    </div>

    {/* Suite filter */}
    <div className='flex items-center gap-2'>
      <label htmlFor='filter-suite' className='text-xs text-slate-400'>
        Suite:
      </label>
      <input
        id='filter-suite'
        type='text'
        aria-label='Filter by suite'
        placeholder='Filter...'
        value={filter.suiteId || ''}
        onChange={(e) =>
          onFilterChange({
            ...filter,
            suiteId: e.target.value || undefined,
          })
        }
        className='px-2 py-1 text-xs rounded bg-slate-700 text-slate-200 border border-slate-600 focus:border-cyan-400 focus:outline-none w-24'
      />
    </div>

    {/* Status filter */}
    <div className='flex items-center gap-2'>
      <label htmlFor='filter-status' className='text-xs text-slate-400'>
        Status:
      </label>
      <select
        id='filter-status'
        aria-label='Filter by status'
        value={filter.status || 'all'}
        onChange={(e) =>
          onFilterChange({
            ...filter,
            status: e.target.value as ActionStreamFilter['status'],
          })
        }
        className='px-2 py-1 text-xs rounded bg-slate-700 text-slate-200 border border-slate-600 focus:border-cyan-400 focus:outline-none'
      >
        <option value='all'>All</option>
        <option value='invoked'>Invoked</option>
        <option value='blocked'>Blocked</option>
        <option value='custom'>Custom</option>
      </select>
    </div>

    {/* Clear button (Live mode) */}
    {mode === 'live' && (
      <button
        type='button'
        onClick={onClear}
        className='ml-auto px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors'
      >
        Clear
      </button>
    )}

    {/* Wipe button (History mode) */}
    {mode === 'history' && onWipe && (
      <button
        type='button'
        onClick={onWipe}
        className='ml-auto px-3 py-1 text-xs rounded bg-red-900/30 text-red-400 hover:bg-red-800/40 hover:text-red-300 transition-colors'
      >
        Wipe
      </button>
    )}

    {/* Count indicator */}
    <div data-testid='action-stream-count' className='text-xs text-slate-500'>
      {totalCount} {mode === 'history' ? 'events' : `/ ${maxCount}`}
    </div>
  </div>
);

interface EventBadgeProps {
  type: 'invoked' | 'blocked' | 'custom';
  customType?: string;
}

const EventBadge: React.FC<EventBadgeProps> = ({ type, customType }) => {
  if (type === 'custom') {
    return (
      <span
        data-testid='event-badge-custom'
        className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400'
      >
        ⚡ {customType || 'Custom'}
      </span>
    );
  }

  return (
    <span
      data-testid={`event-badge-${type}`}
      className={`
      inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
      ${type === 'invoked' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}
    `}
    >
      {type === 'invoked' ? '✓ Invoked' : '✗ Blocked'}
    </span>
  );
};

interface EventItemProps {
  event: ActionStreamEvent;
  onJump?: (event: ActionStreamEvent) => void;
}

const EventItem: React.FC<EventItemProps> = ({ event, onJump }) => {
  const time = new Date(event.timestamp).toLocaleTimeString();

  // Check if event is navigable
  const jumpAction = traceToOsAction(event);
  const isNavigable = jumpAction !== null;

  const handleJumpClick = () => {
    if (onJump) {
      onJump(event);
    }
  };

  return (
    <div
      data-testid={`action-stream-item-${event.id}`}
      className='p-3 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors'
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1 min-w-0'>
          {/* Action ID and badge */}
          <div className='flex items-center gap-2 mb-1'>
            <code className='text-sm font-mono text-cyan-400 truncate'>{event.actionId}</code>
            <EventBadge type={event.type} customType={event.customType} />
          </div>

          {/* Details */}
          {event.type === 'custom' ? (
            <div className='flex flex-wrap items-center gap-2 text-xs text-slate-400'>
              <span className='bg-slate-700/50 px-1.5 py-0.5 rounded'>{event.surface}</span>
              <span>→</span>
              <span className='text-slate-500'>custom event</span>
              {event.customPayload && (
                <span className='text-slate-500'>
                  {Object.keys(event.customPayload).length} fields
                </span>
              )}
            </div>
          ) : (
            <div className='flex flex-wrap items-center gap-2 text-xs text-slate-400'>
              <span className='bg-slate-700/50 px-1.5 py-0.5 rounded'>{event.surface}</span>
              <span>→</span>
              <span className='text-slate-500'>
                {event.actionType === 'navigation' ? 'navigation' : 'handler'}
              </span>
              {event.href && (
                <span className='text-slate-500 truncate max-w-[200px]'>{event.href}</span>
              )}
              {event.handlerKey && <span className='text-slate-500'>@{event.handlerKey}</span>}
            </div>
          )}

          {/* Block reason if blocked */}
          {event.type === 'blocked' && (
            <div className='mt-1 text-xs text-red-400/80'>
              {event.blockReason === 'disabled' ? 'Disabled: ' : 'Policy: '}
              {event.blockReasonDetail || '(no reason provided)'}
            </div>
          )}

          {/* Custom payload display */}
          {event.type === 'custom' && event.customPayload && (
            <div className='mt-1 text-xs text-purple-400/80'>
              {JSON.stringify(event.customPayload, null, 2).split('\n').slice(0, 3).join('\n')}
            </div>
          )}

          {/* Jump button if navigable */}
          {isNavigable && jumpAction && (
            <div className='mt-2'>
              <button
                type='button'
                data-testid={`jump-button-${event.id}`}
                onClick={handleJumpClick}
                className='inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 hover:text-cyan-300 transition-colors'
              >
                <span>↗</span>
                <span>{jumpAction.label}</span>
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className='text-xs text-slate-500 whitespace-nowrap'>{time}</div>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ mode: StreamMode }> = ({ mode }) => (
  <div className='flex flex-col items-center justify-center h-48 text-slate-500'>
    <div className='text-3xl mb-2 opacity-50'>{mode === 'live' ? '📡' : '📂'}</div>
    <p className='text-sm'>No events {mode === 'history' ? 'in history' : 'recorded'}</p>
    <p className='text-xs mt-1 text-slate-600'>
      {mode === 'live'
        ? 'Action events will appear here in real-time'
        : 'Persisted events will appear here after navigation'}
    </p>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

/**
 * ActionStreamModule - Real-time action trace viewer
 *
 * Usage:
 * ```tsx
 * <ActionStreamModule showFilters />
 * ```
 */
export const ActionStreamModule: React.FC<ActionStreamModuleProps> = ({
  maxHeight = '100%',
  showFilters = true,
  className = '',
  telemetryStore,
}) => {
  const {
    filteredEvents,
    filter,
    setFilter,
    clear,
    totalCount,
    mode,
    setMode,
    wipeHistory,
    historyStats,
    isLoadingHistory,
  } = useActionStream({ telemetryStore });

  const navigate = useNavigate();

  const handleFilterChange = useCallback(
    (newFilter: ActionStreamFilter) => {
      setFilter(newFilter);
    },
    [setFilter]
  );

  const handleModeChange = useCallback(
    (newMode: StreamMode) => {
      setMode(newMode);
    },
    [setMode]
  );

  const handleWipe = useCallback(() => {
    void wipeHistory();
  }, [wipeHistory]);

  const handleJump = useCallback(
    (event: ActionStreamEvent) => {
      const action = traceToOsAction(event);
      if (!action) return;

      const context: OsActionContext = {
        navigate,
        suiteId: 'os', // Trace is an OS-level feature (OsFeatureId), not a suite
        surface: 'trace',
      };

      executeOsAction(action, context);
    },
    [navigate]
  );
  return (
    <div
      data-testid='action-stream-module'
      className={`flex flex-col bg-slate-900 border border-slate-700/50 rounded-lg overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      {/* Header */}
      <div className='flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50'>
        <span className='text-lg'>{mode === 'live' ? '📡' : '📂'}</span>
        <h3 className='text-sm font-medium text-slate-200'>Action Stream</h3>
        <span className='text-xs text-slate-500'>TerraTrace</span>
        <div className='ml-auto'>
          <ModeToggle
            mode={mode}
            onModeChange={handleModeChange}
            historyCount={historyStats.eventCount}
            isLoading={isLoadingHistory}
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <FilterControls
          filter={filter}
          onFilterChange={handleFilterChange}
          onClear={clear}
          onWipe={mode === 'history' ? handleWipe : undefined}
          totalCount={totalCount}
          mode={mode}
          maxCount={ACTION_STREAM_CAP}
        />
      )}

      {/* Event list */}
      <div className='flex-1 overflow-auto'>
        {isLoadingHistory && mode === 'history' ? (
          <div className='flex items-center justify-center h-48 text-slate-500'>
            <div className='animate-pulse'>Loading history...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState mode={mode} />
        ) : (
          filteredEvents.map((event) => (
            <EventItem key={event.id} event={event} onJump={handleJump} />
          ))
        )}
      </div>
    </div>
  );
};

export default ActionStreamModule;

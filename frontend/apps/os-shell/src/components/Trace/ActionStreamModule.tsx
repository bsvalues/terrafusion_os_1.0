/**
 * TerraFusion Action Stream Module
 *
 * Displays a real-time stream of OS action trace events.
 * Shows invoked and blocked actions with filtering capabilities.
 *
 * @module components/Trace/ActionStreamModule
 * @see Slice 17: Action Observability Surface
 */

import React, { useCallback } from 'react';
import {
  useActionStream,
  ACTION_STREAM_CAP,
  type ActionStreamEvent,
  type ActionStreamFilter,
} from '../../hooks/useActionStream';

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
}

// ============================================================================
// Sub-Components
// ============================================================================

interface FilterControlsProps {
  filter: ActionStreamFilter;
  onFilterChange: (filter: ActionStreamFilter) => void;
  onClear: () => void;
  totalCount: number;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filter,
  onFilterChange,
  onClear,
  totalCount,
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
            surface: e.target.value as ActionStreamFilter['surface'] || undefined,
          })
        }
        className='px-2 py-1 text-xs rounded bg-slate-700 text-slate-200 border border-slate-600 focus:border-cyan-400 focus:outline-none'
      >
        <option value=''>All</option>
        <option value='launcher'>Launcher</option>
        <option value='standalone_home'>Standalone</option>
        <option value='shellhome'>ShellHome</option>
        <option value='module'>Module</option>
        <option value='workbench'>Workbench</option>
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
      </select>
    </div>

    {/* Clear button */}
    <button
      type='button'
      onClick={onClear}
      className='ml-auto px-3 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors'
    >
      Clear
    </button>

    {/* Count indicator */}
    <div
      data-testid='action-stream-count'
      className='text-xs text-slate-500'
    >
      {totalCount} / {ACTION_STREAM_CAP}
    </div>
  </div>
);

interface EventBadgeProps {
  type: 'invoked' | 'blocked';
}

const EventBadge: React.FC<EventBadgeProps> = ({ type }) => (
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

interface EventItemProps {
  event: ActionStreamEvent;
}

const EventItem: React.FC<EventItemProps> = ({ event }) => {
  const time = new Date(event.timestamp).toLocaleTimeString();

  return (
    <div
      data-testid={`action-stream-item-${event.id}`}
      className='p-3 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors'
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='flex-1 min-w-0'>
          {/* Action ID and badge */}
          <div className='flex items-center gap-2 mb-1'>
            <code className='text-sm font-mono text-cyan-400 truncate'>
              {event.actionId}
            </code>
            <EventBadge type={event.type} />
          </div>

          {/* Details */}
          <div className='flex flex-wrap items-center gap-2 text-xs text-slate-400'>
            <span className='bg-slate-700/50 px-1.5 py-0.5 rounded'>
              {event.surface}
            </span>
            <span>→</span>
            <span className='text-slate-500'>
              {event.actionType === 'navigation' ? 'navigation' : 'handler'}
            </span>
            {event.href && (
              <span className='text-slate-500 truncate max-w-[200px]'>
                {event.href}
              </span>
            )}
            {event.handlerKey && (
              <span className='text-slate-500'>
                @{event.handlerKey}
              </span>
            )}
          </div>

          {/* Block reason if blocked */}
          {event.type === 'blocked' && (
            <div className='mt-1 text-xs text-red-400/80'>
              {event.blockReason === 'disabled' ? 'Disabled: ' : 'Policy: '}
              {event.blockReasonDetail || '(no reason provided)'}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className='text-xs text-slate-500 whitespace-nowrap'>
          {time}
        </div>
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className='flex flex-col items-center justify-center h-48 text-slate-500'>
    <div className='text-3xl mb-2 opacity-50'>📡</div>
    <p className='text-sm'>No actions recorded</p>
    <p className='text-xs mt-1 text-slate-600'>
      Action events will appear here in real-time
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
}) => {
  const {
    filteredEvents,
    filter,
    setFilter,
    clear,
    totalCount,
  } = useActionStream();

  const handleFilterChange = useCallback(
    (newFilter: ActionStreamFilter) => {
      setFilter(newFilter);
    },
    [setFilter]
  );

  return (
    <div
      data-testid='action-stream-module'
      className={`flex flex-col bg-slate-900 border border-slate-700/50 rounded-lg overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      {/* Header */}
      <div className='flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50'>
        <span className='text-lg'>📡</span>
        <h3 className='text-sm font-medium text-slate-200'>Action Stream</h3>
        <span className='text-xs text-slate-500'>TerraTrace</span>
      </div>

      {/* Filters */}
      {showFilters && (
        <FilterControls
          filter={filter}
          onFilterChange={handleFilterChange}
          onClear={clear}
          totalCount={totalCount}
        />
      )}

      {/* Event list */}
      <div className='flex-1 overflow-auto'>
        {filteredEvents.length === 0 ? (
          <EmptyState />
        ) : (
          filteredEvents.map((event) => (
            <EventItem key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
};

export default ActionStreamModule;

import React, { useMemo, useState } from 'react';
import type { WorkspaceActivityFilter, WorkspaceActivityItem } from '../core/activity/types';
import { useOmniIntent } from '../core/state/OmniIntentContext';

// Re-export for convenience (backwards compatibility)
export type {
  WorkspaceActivityFilter,
  WorkspaceActivityItem,
  WorkspaceActivityType,
} from '../core/activity/types';

export interface WorkspaceActivityFeedProps {
  workspaceId: string;
  items: WorkspaceActivityItem[];
  onItemClick?: (payload: {
    workspaceId: string;
    activityId: string;
    type: WorkspaceActivityItem['type'];
  }) => void;
  /** Optional initial filter (defaults to 'all') */
  initialFilter?: WorkspaceActivityFilter;
  /** Callback when filter changes */
  onFilterChange?: (filter: WorkspaceActivityFilter) => void;
}

/** Available filter options */
const FILTERS: WorkspaceActivityFilter[] = ['all', 'warning', 'incident'];

/** Date grouping keys */
type GroupKey = 'today' | 'yesterday' | 'older';

/**
 * Apply filter to activity items.
 */
function applyFilter(
  items: WorkspaceActivityItem[],
  filter: WorkspaceActivityFilter
): WorkspaceActivityItem[] {
  if (filter === 'all') return items;
  return items.filter((item) => item.type === filter);
}

/**
 * Get group key for a date.
 */
function getGroupKey(date: Date): GroupKey {
  const now = new Date();
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = (today - d) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return 'older';
}

/**
 * Get human-readable label for group key.
 */
function getGroupLabel(key: GroupKey): string {
  switch (key) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    default:
      return 'Earlier';
  }
}

/**
 * Group items by date.
 */
function groupByDate(items: WorkspaceActivityItem[]) {
  const groups: Record<GroupKey, WorkspaceActivityItem[]> = {
    today: [],
    yesterday: [],
    older: [],
  };

  items.forEach((item) => {
    const date = new Date(item.timestamp);
    const key = getGroupKey(date);
    groups[key].push(item);
  });

  return groups;
}

/**
 * WorkspaceActivityFeed – OS-level primitive for displaying
 * workspace activity in a domain-neutral way.
 *
 * Features:
 * - Inline filters: All / Warnings / Incidents
 * - Date grouping: Today / Yesterday / Earlier
 * - Emits `workspace_activity_selected` intent on item click
 *
 * Can be reused across any workspace without domain coupling.
 */
export const WorkspaceActivityFeed: React.FC<WorkspaceActivityFeedProps> = ({
  workspaceId,
  items,
  onItemClick,
  initialFilter = 'all',
  onFilterChange,
}) => {
  const { setIntent } = useOmniIntent();
  const [filter, setFilter] = useState<WorkspaceActivityFilter>(initialFilter);

  const handleFilterChange = (next: WorkspaceActivityFilter) => {
    setFilter(next);
    onFilterChange?.(next);
  };

  const filtered = useMemo(() => applyFilter(items, filter), [items, filter]);
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleClick = (item: WorkspaceActivityItem) => {
    const payload = {
      workspaceId,
      activityId: item.id,
      type: item.type,
    };

    setIntent('workspace_activity_selected', payload);
    onItemClick?.(payload);
  };

  const typeStyles: Record<WorkspaceActivityItem['type'], string> = {
    info: 'border-slate-700/50 hover:border-cyan-500/40',
    warning: 'border-amber-500/30 hover:border-amber-400/50',
    incident: 'border-red-500/40 hover:border-red-400/60',
  };

  const typeDotStyles: Record<WorkspaceActivityItem['type'], string> = {
    info: 'bg-cyan-400',
    warning: 'bg-amber-400',
    incident: 'bg-red-400',
  };

  const filterButtonStyles = (isActive: boolean) =>
    `px-3 py-1 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
        : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600/50'
    }`;

  // Empty state (no items at all)
  if (!items.length) {
    return (
      <div
        data-testid='workspace-activity-empty'
        className='text-xs text-slate-500 py-4 text-center'
      >
        No recent activity.
      </div>
    );
  }

  const hasFilteredItems = filtered.length > 0;

  return (
    <div data-testid='workspace-activity-container' className='space-y-3'>
      {/* Filter bar */}
      <div
        data-testid='workspace-activity-filters'
        className='flex gap-2'
        role='group'
        aria-label='Activity filters'
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            type='button'
            data-testid={`workspace-activity-filter-${f}`}
            onClick={() => handleFilterChange(f)}
            aria-pressed={filter === f}
            className={filterButtonStyles(filter === f)}
          >
            {f === 'all' ? 'All' : f === 'warning' ? 'Warnings' : 'Incidents'}
          </button>
        ))}
      </div>

      {/* Empty filtered state */}
      {!hasFilteredItems ? (
        <div
          data-testid='workspace-activity-empty-filtered'
          className='text-xs text-slate-500 py-4 text-center'
        >
          No activity for this filter.
        </div>
      ) : (
        <div data-testid='workspace-activity-groups' className='space-y-4'>
          {(['today', 'yesterday', 'older'] as GroupKey[])
            .filter((key) => grouped[key].length > 0)
            .map((key) => (
              <section key={key} data-testid={`workspace-activity-group-${key}`}>
                <div
                  data-testid='workspace-activity-group-label'
                  className='text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2'
                >
                  {getGroupLabel(key)}
                </div>
                <ul data-testid='workspace-activity-group-list' className='space-y-2'>
                  {grouped[key].map((item) => (
                    <li
                      key={item.id}
                      data-testid='workspace-activity-item'
                      data-type={item.type}
                      onClick={() => handleClick(item)}
                      className={`
                        cursor-pointer rounded-xl border px-4 py-3
                        bg-slate-900/50 backdrop-blur-sm transition-all
                        ${typeStyles[item.type]}
                      `}
                    >
                      <div className='flex items-start gap-3'>
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${typeDotStyles[item.type]}`}
                        />
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm text-slate-200 leading-snug'>{item.summary}</div>
                          <div className='flex items-center gap-2 mt-1'>
                            <span className='text-[10px] text-slate-500'>
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                            {item.source && (
                              <>
                                <span className='text-slate-600'>•</span>
                                <span className='text-[10px] text-slate-500'>{item.source}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </div>
  );
};

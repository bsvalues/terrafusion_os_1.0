import React, { useMemo } from 'react';
import type { WorkspaceActivityItem } from '../core/activity/types';
import { useWorkspaceActivity } from '../core/activity/useWorkspaceActivity';

export interface WorkspaceHealthTimelinePanelProps {
  workspaceId: string;
  /** Optional activity ID to highlight / scroll-to when opened from an incident */
  focusActivityId?: string;
}

/**
 * Check if an activity item represents a health-related event.
 * Health events: health_update kind, WorkspaceStatusChip source, or warning/incident type.
 */
const isHealthEvent = (item: WorkspaceActivityItem): boolean =>
  item.kind === 'health_update' ||
  item.source === 'WorkspaceStatusChip' ||
  item.type === 'warning' ||
  item.type === 'incident';

/**
 * Sort activity items by timestamp descending (most recent first).
 */
const sortByTimestampDesc = (a: WorkspaceActivityItem, b: WorkspaceActivityItem): number =>
  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();

/**
 * WorkspaceHealthTimelinePanel – Right-rail panel showing health timeline.
 *
 * Driven entirely by:
 * - useWorkspaceActivity(workspaceId)
 * - Intents: workspace_status_selected + workspace_status_changed
 *
 * No new backends. Just reading what we're already writing.
 */
export const WorkspaceHealthTimelinePanel: React.FC<WorkspaceHealthTimelinePanelProps> = ({
  workspaceId,
  focusActivityId,
}) => {
  const { items, loading, error } = useWorkspaceActivity(workspaceId, { limit: 100 });

  const events = useMemo(() => items.filter(isHealthEvent).sort(sortByTimestampDesc), [items]);

  if (loading) {
    return (
      <div data-testid='health-timeline-loading' className='p-4 text-slate-400'>
        Loading health timeline…
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid='health-timeline-error' className='p-4 text-rose-400'>
        Unable to load health timeline.
      </div>
    );
  }

  if (!events.length) {
    return (
      <div data-testid='health-timeline-empty' className='p-4 text-slate-500'>
        No health events recorded for this workspace yet.
      </div>
    );
  }

  return (
    <div data-testid='health-timeline-panel' className='p-3 overflow-y-auto max-h-full'>
      <h2 className='text-sm font-semibold text-slate-200 mb-3'>Workspace Health Timeline</h2>

      <ul data-testid='health-timeline-list' className='list-none p-0 m-0 space-y-2'>
        {events.map((event) => {
          const isFocused = event.id === focusActivityId;
          const typeColors: Record<string, string> = {
            incident: 'border-rose-500/50 bg-rose-500/10',
            warning: 'border-amber-500/50 bg-amber-500/10',
            info: 'border-slate-500/30 bg-slate-500/5',
          };

          return (
            <li
              key={event.id}
              data-testid='health-timeline-item'
              data-type={event.type}
              data-focused={isFocused || undefined}
              className={`
                p-2 rounded-lg border transition-colors
                ${typeColors[event.type] || typeColors.info}
                ${isFocused ? 'ring-2 ring-cyan-400/50' : ''}
                ${event.type === 'info' ? 'opacity-80' : ''}
              `}
            >
              <div className='text-[10px] text-slate-500 mb-0.5'>
                {new Date(event.timestamp).toLocaleString()}
              </div>
              <div className='text-xs font-medium text-slate-200'>{event.summary}</div>
              {event.source && (
                <div className='text-[10px] text-slate-500 mt-0.5'>Source: {event.source}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

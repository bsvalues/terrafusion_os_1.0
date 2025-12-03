import React, { useEffect, useRef } from 'react';
import { useWorkspaceActivity } from '../core/activity/useWorkspaceActivity';
import { useOmniIntent } from '../core/state/OmniIntentContext';

export type WorkspaceStatus = 'nominal' | 'warning' | 'critical';

export interface WorkspaceStatusChipProps {
  /** Domain-neutral workspace identifier */
  workspaceId: string;
  /** Human-readable label */
  label: string;
  /** Status variant */
  status?: WorkspaceStatus;
  /** Show the latest incident inline (optional) */
  showLatestIncident?: boolean;
}

const statusColors: Record<WorkspaceStatus, string> = {
  nominal: 'border-emerald-400/50 text-emerald-300 bg-emerald-500/10',
  warning: 'border-amber-400/50 text-amber-300 bg-amber-500/10',
  critical: 'border-rose-400/50 text-rose-300 bg-rose-500/10',
};

const statusDotColors: Record<WorkspaceStatus, string> = {
  nominal: 'bg-emerald-400',
  warning: 'bg-amber-400',
  critical: 'bg-rose-400',
};

/**
 * A neutral OS primitive indicating workspace health.
 * - Emits `workspace_status_selected` intent when clicked
 * - Emits `workspace_status_changed` intent on status transitions
 * - Optionally shows the latest incident for the workspace
 * - Includes "View full timeline" link to open health timeline panel
 */
export const WorkspaceStatusChip: React.FC<WorkspaceStatusChipProps> = ({
  workspaceId,
  label,
  status = 'nominal',
  showLatestIncident = false,
}) => {
  const { setIntent } = useOmniIntent();
  const previousStatusRef = useRef<WorkspaceStatus | null>(null);

  // Fetch activity for latest incident (only if enabled)
  const { items } = useWorkspaceActivity(workspaceId, { limit: 20 });
  const latestIncident = showLatestIncident ? items.find((i) => i.type === 'incident') : null;

  // Emit workspace_status_changed on status transitions
  useEffect(() => {
    const prev = previousStatusRef.current;

    // Only emit if we have a previous status AND it changed
    if (prev !== null && prev !== status) {
      setIntent('workspace_status_changed', {
        workspaceId,
        previousStatus: prev,
        currentStatus: status,
      });
    }

    previousStatusRef.current = status;
  }, [workspaceId, status, setIntent]);

  const handleClick = () => {
    setIntent('workspace_status_selected', { workspaceId, status });
  };

  const handleViewTimeline = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIntent('workspace_status_selected', { workspaceId, status });
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      data-testid='workspace-status-chip'
      data-status={status}
      className={`
        flex flex-col items-start gap-1 px-3 py-2 rounded-xl border text-left
        transition-colors hover:brightness-110
        ${statusColors[status]}
      `}
    >
      <div className='flex items-center gap-2'>
        <span
          data-testid='workspace-status-dot'
          className={`w-2 h-2 rounded-full ${statusDotColors[status]}`}
        />
        <span className='text-[11px] font-medium'>{label}</span>
      </div>

      {latestIncident && (
        <div
          data-testid='workspace-status-latest-incident'
          className='text-[10px] text-slate-400 truncate max-w-[200px] pl-4'
        >
          Last incident: {latestIncident.summary}
        </div>
      )}

      <span
        data-testid='workspace-status-view-timeline'
        className='text-[10px] text-slate-500 hover:text-cyan-400 underline cursor-pointer pl-4'
        onClick={handleViewTimeline}
      >
        View full timeline
      </span>
    </button>
  );
};

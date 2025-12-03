/**
 * WorkspaceActivityDetailPanel – Right-Rail Activity Details
 *
 * Displays details for a specific activity item in right-rail context.
 * Domain-neutral, spine-compliant.
 *
 * Features:
 * - Activity type and timestamp
 * - Summary text
 * - Source information
 * - Loading/error/missing states
 *
 * @see docs/WORKSPACE_EXPERIENCE_V1.md Section 9.2
 */
import React, { useMemo } from 'react';
import { useWorkspaceActivity } from '../core/activity/useWorkspaceActivity';

export interface WorkspaceActivityDetailPanelProps {
  /** Workspace the activity belongs to */
  workspaceId: string;
  /** ID of the activity to display */
  activityId: string;
}

/**
 * Right-rail panel showing details for a specific activity.
 */
export const WorkspaceActivityDetailPanel: React.FC<WorkspaceActivityDetailPanelProps> = ({
  workspaceId,
  activityId,
}) => {
  const { items, loading, error } = useWorkspaceActivity(workspaceId, {
    limit: 100,
  });

  const activity = useMemo(
    () => items.find((i) => i.id === activityId),
    [items, activityId]
  );

  if (loading) {
    return (
      <div data-testid="workspace-activity-detail-loading">
        Loading activity…
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="workspace-activity-detail-error">
        Unable to load activity details.
      </div>
    );
  }

  if (!activity) {
    return (
      <div data-testid="workspace-activity-detail-missing">
        Activity not found.
      </div>
    );
  }

  return (
    <div
      data-testid="workspace-activity-detail-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: '100%',
      }}
    >
      <header>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 500,
            color: 'rgba(241, 245, 249, 0.95)',
          }}
        >
          Activity Detail
        </h2>
        <div
          data-testid="workspace-activity-detail-timestamp"
          style={{ fontSize: 12, opacity: 0.75, color: 'rgba(148, 163, 184, 0.9)' }}
        >
          {new Date(activity.timestamp).toLocaleString()}
        </div>
      </header>

      <div style={{ marginTop: 8 }}>
        <div
          data-testid="workspace-activity-detail-type"
          style={{
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 4,
            color: 'rgba(148, 163, 184, 0.9)',
          }}
        >
          Type: {activity.type}
        </div>
        <div
          data-testid="workspace-activity-detail-summary"
          style={{ color: 'rgba(241, 245, 249, 0.9)' }}
        >
          {activity.summary}
        </div>
      </div>

      {activity.source && (
        <div
          data-testid="workspace-activity-detail-source"
          style={{
            marginTop: 12,
            fontSize: 12,
            opacity: 0.8,
            color: 'rgba(148, 163, 184, 0.9)',
          }}
        >
          Source: {activity.source}
        </div>
      )}
    </div>
  );
};

/**
 * WorkspaceHealthPanel – Right-Rail Health Details
 *
 * Displays workspace health summary and recent activity in right-rail context.
 * Domain-neutral, spine-compliant.
 *
 * Features:
 * - Health level summary (nominal/degraded/critical)
 * - Incident count (24h)
 * - Last incident details
 * - Recent events list
 *
 * @see docs/WORKSPACE_EXPERIENCE_V1.md Section 9.2
 */
import React from 'react';
import { computeWorkspaceHealthSummary } from '../core/activity/healthSummary';
import { useWorkspaceActivity } from '../core/activity/useWorkspaceActivity';

export interface WorkspaceHealthPanelProps {
  /** Workspace to show health for */
  workspaceId: string;
}

/**
 * Right-rail panel showing workspace health details.
 */
export const WorkspaceHealthPanel: React.FC<WorkspaceHealthPanelProps> = ({ workspaceId }) => {
  const { items, loading, error } = useWorkspaceActivity(workspaceId, {
    limit: 100,
  });

  if (loading) {
    return <div data-testid='workspace-health-panel-loading'>Loading health…</div>;
  }

  if (error) {
    return (
      <div data-testid='workspace-health-panel-error'>
        Unable to load health for this workspace.
      </div>
    );
  }

  const summary = computeWorkspaceHealthSummary(items);

  return (
    <div
      data-testid='workspace-health-panel'
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
          Workspace Health
        </h2>
        <div
          data-testid='workspace-health-panel-summary'
          style={{ fontSize: 12, opacity: 0.75, color: 'rgba(148, 163, 184, 0.9)' }}
        >
          Level: {summary.level} • Incidents (24h): {summary.incidents24h}
        </div>
      </header>

      <div
        style={{
          marginTop: 8,
          fontSize: 13,
          opacity: 0.85,
          color: 'rgba(241, 245, 249, 0.85)',
        }}
      >
        {summary.lastIncident ? (
          <>
            <div style={{ fontWeight: 500 }}>Last incident</div>
            <div>{summary.lastIncident.summary}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {new Date(summary.lastIncident.timestamp).toLocaleString()}
            </div>
          </>
        ) : (
          <div data-testid='workspace-health-panel-no-incidents'>
            No incidents recorded for this workspace.
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          opacity: 0.75,
          color: 'rgba(148, 163, 184, 0.8)',
        }}
      >
        Recent events
      </div>

      <div
        data-testid='workspace-health-panel-events'
        style={{
          marginTop: 4,
          overflow: 'auto',
          fontSize: 12,
          flex: 1,
          color: 'rgba(241, 245, 249, 0.8)',
        }}
      >
        {items.length === 0 ? (
          <div style={{ opacity: 0.6 }}>No recent events.</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '4px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ opacity: 0.7 }}>{new Date(item.timestamp).toLocaleString()}</div>
              <div>{item.summary}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

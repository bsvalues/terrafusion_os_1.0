/**
 * SystemActivityWorkspace – OS-wide activity console.
 *
 * Displays activity events from ALL workspaces in a unified table view.
 * Uses Tahoe Glass panels and TerraSphere health visualization.
 * Supports filtering by severity and workspace name.
 */
import React, { useMemo, useState } from 'react';
import type { HealthLevel } from '../core/activity/healthSummary';
import type { SystemWorkspaceActivityItem } from '../core/activity/types';
import { useSystemActivity } from '../core/activity/useSystemActivity';
import { useOmniIntent } from '../core/state/OmniIntentContext';
import { OSGlassPanel } from '../os/ui/OSGlassPanel';
import { TerraSphereStatus } from '../os/ui/TerraSphereStatus';

type SeverityFilter = 'all' | 'info' | 'warning' | 'incident';

export const SystemActivityWorkspace: React.FC = () => {
  const { items, loading, error } = useSystemActivity({
    limitPerWorkspace: 50,
  });
  const { emitIntent } = useOmniIntent();

  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [workspaceQuery, setWorkspaceQuery] = useState('');

  const filtered = useMemo(() => {
    return items.filter(({ workspaceId, item }) => {
      // Filter by severity
      if (severity !== 'all' && item.type !== severity) {
        return false;
      }
      // Filter by workspace name
      if (workspaceQuery && !workspaceId.toLowerCase().includes(workspaceQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [items, severity, workspaceQuery]);

  const handleRowClick = (entry: SystemWorkspaceActivityItem) => {
    const { workspaceId, item } = entry;

    emitIntent('workspace_activity_selected', {
      workspaceId,
      activityId: item.id,
      type: item.type,
    });
  };

  // Derive system-wide health from incidents in filtered view
  const totalIncidents = filtered.filter((e) => e.item.type === 'incident').length;
  const totalWarnings = filtered.filter((e) => e.item.type === 'warning').length;

  const healthLevel: HealthLevel =
    totalIncidents > 0 ? 'critical' : totalWarnings > 0 ? 'degraded' : 'nominal';

  if (loading) {
    return (
      <div data-testid='system-activity-loading' style={{ padding: 16 }}>
        Loading system activity…
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid='system-activity-error' style={{ padding: 16 }}>
        Unable to load system activity.
      </div>
    );
  }

  return (
    <div
      data-testid='system-activity-workspace'
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header row with large TerraSphere */}
      <OSGlassPanel
        padding={12}
        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        testId='system-activity-header'
      >
        <TerraSphereStatus
          level={healthLevel}
          incidents24h={totalIncidents}
          size='large'
          testId='system-terrasphere'
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>System Activity</h1>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Live view of recent events across all workspaces.
          </div>
        </div>

        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            opacity: 0.8,
          }}
        >
          <span data-testid='system-activity-total'>Total events: {filtered.length}</span>
          <span>|</span>
          <span data-testid='system-activity-incidents'>Incidents: {totalIncidents}</span>
        </div>
      </OSGlassPanel>

      {/* Filters + table in a glass panel */}
      <OSGlassPanel
        padding={12}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flex: 1,
          minHeight: 0,
        }}
        testId='system-activity-glass'
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <input
            type='text'
            placeholder='Filter by workspace…'
            value={workspaceQuery}
            onChange={(e) => setWorkspaceQuery(e.target.value)}
            data-testid='system-activity-workspace-filter'
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.25)',
              color: 'inherit',
            }}
          />

          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'info', 'warning', 'incident'] as SeverityFilter[]).map((f) => (
              <button
                key={f}
                type='button'
                data-testid={`system-activity-filter-${f}`}
                onClick={() => setSeverity(f)}
                aria-pressed={severity === f}
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  border:
                    severity === f
                      ? '1px solid rgba(255,255,255,0.6)'
                      : '1px solid rgba(255,255,255,0.15)',
                  background: severity === f ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.3)',
                  fontSize: 11,
                  cursor: 'pointer',
                  color: 'inherit',
                }}
              >
                {f === 'all'
                  ? 'All'
                  : f === 'info'
                    ? 'Info'
                    : f === 'warning'
                      ? 'Warnings'
                      : 'Incidents'}
              </button>
            ))}
          </div>
        </header>

        {filtered.length === 0 ? (
          <div data-testid='system-activity-empty' style={{ fontSize: 13, opacity: 0.8 }}>
            No activity for the current filters.
          </div>
        ) : (
          <div
            style={{
              overflow: 'auto',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <table
              data-testid='system-activity-table'
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                <tr>
                  <th align='left' style={{ padding: '6px 8px' }}>
                    Time
                  </th>
                  <th align='left' style={{ padding: '6px 8px' }}>
                    Workspace
                  </th>
                  <th align='left' style={{ padding: '6px 8px' }}>
                    Type
                  </th>
                  <th align='left' style={{ padding: '6px 8px' }}>
                    Summary
                  </th>
                  <th align='left' style={{ padding: '6px 8px' }}>
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={`${entry.workspaceId}-${entry.item.id}`}
                    data-testid='system-activity-row'
                    data-type={entry.item.type}
                    onClick={() => handleRowClick(entry)}
                    style={{
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                  >
                    <td
                      style={{
                        padding: '6px 8px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(entry.item.timestamp).toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '6px 8px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {entry.workspaceId}
                    </td>
                    <td
                      style={{
                        padding: '6px 8px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {entry.item.type}
                    </td>
                    <td
                      style={{
                        padding: '6px 8px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {entry.item.summary}
                    </td>
                    <td
                      style={{
                        padding: '6px 8px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      {entry.item.source ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OSGlassPanel>
    </div>
  );
};

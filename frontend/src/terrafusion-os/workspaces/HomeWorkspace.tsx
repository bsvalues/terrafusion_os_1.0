/**
 * HomeWorkspace – Mini Command Center
 *
 * Primary landing workspace for TerraFusion OS.
 * Features Glass + TerraSphere visual system with:
 * - OSHealthSummaryBar at top
 * - Command palette with WorkspaceTerraSphere
 * - Quick object list in left column
 * - Activity feed in right column
 * - Right-rail panel for health/activity details
 *
 * @see docs/WORKSPACE_EXPERIENCE_V1.md Section 3.1
 */
import React, { useMemo } from 'react';
import { resolveOSObjectComponent } from '../catalog/osObjects';
import { useWorkspaceActivity } from '../core/activity/useWorkspaceActivity';
import { OSGlassPanel } from '../os/ui/OSGlassPanel';
import { WorkspaceTerraSphere } from '../os/ui/WorkspaceTerraSphere';
import { OSHealthSummaryBar } from './OSHealthSummaryBar';
import { RightRailShell } from './RightRailShell';
import { WorkspaceHealthHUD } from './WorkspaceHealthHUD';

export const HomeWorkspace: React.FC = () => {
  const workspaceId = 'home';
  const isMac =
    typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  // Resolve OS object components from catalog
  const QuickListComponent = useMemo(() => resolveOSObjectComponent('object_quicklist'), []);
  const ActivityFeedComponent = useMemo(
    () => resolveOSObjectComponent('workspace_activity_feed'),
    []
  );
  const CommandPaletteComponent = useMemo(
    () => resolveOSObjectComponent('workspace_command_palette'),
    []
  );

  // Central OS activity provider
  const { items: activityItems, loading: activityLoading } = useWorkspaceActivity(workspaceId, {
    limit: 10,
  });

  return (
    <div
      data-testid='home-workspace'
      style={{
        width: '100%',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        padding: 20,
      }}
    >
      {/* Top Health Summary Bar */}
      <header style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <OSHealthSummaryBar
          workspaceId={workspaceId}
          label='Home Health'
          testId='home-health-bar'
        />
      </header>

      {/* Main Content + Right Rail */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* LEFT: Main workspace grid */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Command Palette Panel with TerraSphere */}
          <OSGlassPanel testId='home-command-panel' padding={16}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <WorkspaceTerraSphere
                workspaceId={workspaceId}
                size='medium'
                testId='home-terrasphere'
              />
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.35em',
                    color: 'rgba(148, 163, 184, 0.7)',
                    marginBottom: 6,
                  }}
                >
                  TerraCommand
                </p>
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 200,
                    letterSpacing: '0.25em',
                    color: 'rgba(241, 245, 249, 0.95)',
                    margin: 0,
                  }}
                >
                  OMNI–INTENT FIELD
                </h1>
                <p
                  style={{
                    fontSize: 12,
                    color: 'rgba(148, 163, 184, 0.8)',
                    marginTop: 6,
                  }}
                >
                  Press <span style={{ color: '#67E8F9' }}>{isMac ? '⌘K' : 'Ctrl+K'}</span> to issue
                  a system-level command.
                </p>
              </div>
            </div>
            {CommandPaletteComponent && (
              <div style={{ marginTop: 14 }}>
                <CommandPaletteComponent workspaceId={workspaceId} />
              </div>
            )}
          </OSGlassPanel>

          {/* Workspace-level Health HUD strip */}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <WorkspaceHealthHUD workspaceId={workspaceId} />
          </div>

          {/* Main Content Grid: Quick List + Activity */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: 16,
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Left Column: Quick Objects */}
            <OSGlassPanel testId='home-quick-panel' fullHeight>
              <h2
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3em',
                  color: 'rgba(148, 163, 184, 0.6)',
                  marginBottom: 12,
                }}
              >
                Quick Objects
              </h2>
              {QuickListComponent && <QuickListComponent />}
            </OSGlassPanel>

            {/* Right Column: Activity Feed */}
            <OSGlassPanel testId='home-activity-panel' fullHeight>
              <h2
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3em',
                  color: 'rgba(148, 163, 184, 0.6)',
                  marginBottom: 12,
                }}
              >
                Recent Activity
              </h2>
              {activityLoading ? (
                <div
                  data-testid='workspace-activity-loading'
                  style={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.5)', padding: '16px 0' }}
                >
                  Loading activity…
                </div>
              ) : (
                ActivityFeedComponent && (
                  <ActivityFeedComponent workspaceId={workspaceId} items={activityItems} />
                )
              )}
            </OSGlassPanel>
          </div>
        </div>

        {/* RIGHT: Right-rail shell (reads panel state from OmniIntentContext) */}
        <RightRailShell workspaceId={workspaceId} />
      </div>
    </div>
  );
};

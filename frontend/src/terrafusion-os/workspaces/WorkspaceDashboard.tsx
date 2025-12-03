/**
 * @file WorkspaceDashboard.tsx
 * @description Main workspace host with integrated RightRailShell.
 * Combines the primary workspace view with context-aware right-rail panels.
 *
 * @pattern Composition - Orchestrates HomeWorkspace + RightRailShell
 * @layer workspaces
 */

import React from 'react';
import { useOmniIntent } from '../core/state/OmniIntentContext';
import { HomeWorkspace } from './HomeWorkspace';
import { RightRailShell } from './RightRailShell';

/**
 * WorkspaceDashboard
 *
 * Top-level workspace container that:
 * 1. Renders the main HomeWorkspace as the primary content area
 * 2. Conditionally renders RightRailShell when a panel is active
 * 3. Manages layout distribution between main content and right rail
 *
 * The right rail is driven by `useOmniIntent().rightRail` state,
 * which is set by intent handlers (workspace_status_selected, workspace_activity_selected).
 */
export const WorkspaceDashboard: React.FC = () => {
  const { rightRail } = useOmniIntent();

  return (
    <div
      data-testid='workspace-dashboard'
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Main workspace area - takes remaining space */}
      <div
        data-testid='workspace-dashboard-main'
        style={{
          flex: 1,
          minWidth: 0, // Allows flex item to shrink below content size
          overflow: 'auto',
        }}
      >
        <HomeWorkspace />
      </div>

      {/* Right rail - conditionally rendered based on intent state */}
      <RightRailShell panelId={rightRail?.panel ?? null} props={rightRail?.props ?? {}} />
    </div>
  );
};

export default WorkspaceDashboard;

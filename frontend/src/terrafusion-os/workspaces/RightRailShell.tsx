/**
 * RightRailShell – Standard Right-Rail Panel Container
 *
 * Generic container that reads right-rail state from intent context
 * and renders the correct panel inside OSGlassPanelRightRail.
 *
 * Features:
 * - Routes panel ID to correct component
 * - Wraps content in OSGlassPanelRightRail
 * - Returns null when no panel active
 * - Reads state from OmniIntentContext via useOmniIntent
 *
 * Supported panels:
 * - 'workspace-health': WorkspaceHealthPanel
 * - 'workspace-activity-detail': WorkspaceActivityDetailPanel
 *
 * @see docs/WORKSPACE_EXPERIENCE_V1.md Section 9.3
 */
import React from 'react';
import { useOmniIntent } from '../core/state/OmniIntentContext';
import { OSGlassPanelRightRail } from '../os/ui/OSGlassPanelRightRail';
import { WorkspaceActivityDetailPanel } from './WorkspaceActivityDetailPanel';
import { WorkspaceHealthPanel } from './WorkspaceHealthPanel';

export type RightRailPanelId = 'workspace-health' | 'workspace-activity-detail';

export interface RightRailShellProps {
  /** Workspace ID for the right-rail panels (overrides context if provided) */
  workspaceId: string;
}

/**
 * Standard right-rail shell for workspace panels.
 * Reads panel state from OmniIntentContext and routes to appropriate component.
 *
 * @example
 * <RightRailShell workspaceId="home" />
 */
export const RightRailShell: React.FC<RightRailShellProps> = ({ workspaceId }) => {
  const { rightRail } = useOmniIntent();

  if (!rightRail || !rightRail.panel) return null;

  const effectiveWorkspaceId = rightRail.props?.workspaceId ?? workspaceId;

  let content: React.ReactNode = null;

  switch (rightRail.panel) {
    case 'workspace-health':
      content = <WorkspaceHealthPanel workspaceId={effectiveWorkspaceId} />;
      break;

    case 'workspace-activity-detail':
      content = (
        <WorkspaceActivityDetailPanel
          workspaceId={effectiveWorkspaceId}
          activityId={rightRail.props?.activityId ?? ''}
        />
      );
      break;

    default:
      return null;
  }

  return <OSGlassPanelRightRail testId='right-rail-shell'>{content}</OSGlassPanelRightRail>;
};

/**
 * Controlled RightRailShell for testing and explicit panel control.
 * Does not read from OmniIntentContext - receives panel state via props.
 */
export interface ControlledRightRailShellProps {
  /** Which panel to render (null = hidden) */
  panel: RightRailPanelId | null;
  /** Props to pass to the panel component */
  panelProps?: {
    workspaceId?: string;
    activityId?: string;
    [key: string]: unknown;
  };
}

export const ControlledRightRailShell: React.FC<ControlledRightRailShellProps> = ({
  panel,
  panelProps,
}) => {
  if (!panel) return null;

  let content: React.ReactNode = null;

  switch (panel) {
    case 'workspace-health':
      content = <WorkspaceHealthPanel workspaceId={panelProps?.workspaceId ?? 'home'} />;
      break;

    case 'workspace-activity-detail':
      content = (
        <WorkspaceActivityDetailPanel
          workspaceId={panelProps?.workspaceId ?? 'home'}
          activityId={panelProps?.activityId ?? ''}
        />
      );
      break;

    default:
      return null;
  }

  return <OSGlassPanelRightRail testId='right-rail-shell'>{content}</OSGlassPanelRightRail>;
};

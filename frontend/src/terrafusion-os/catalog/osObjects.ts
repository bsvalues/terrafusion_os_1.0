import type { ComponentType } from 'react';
import { ObjectQuickList } from '../workspaces/ObjectQuickList';
import { WorkspaceActivityFeed } from '../workspaces/WorkspaceActivityFeed';
import { WorkspaceCommandPalette } from '../workspaces/WorkspaceCommandPalette';
import { WorkspaceStatusChip } from '../workspaces/WorkspaceStatusChip';

export type OSObjectId =
  | 'object_quicklist'
  | 'workspace_status_chip'
  | 'workspace_activity_feed'
  | 'workspace_command_palette';

export interface OSObjectDescriptor {
  id: OSObjectId;
  label: string;
  description?: string;
  component: ComponentType<any>;
}

/**
 * Registry of TerraFusion OS (L3) domain-neutral primitives.
 * Keep this catalog free of parcel/levy/property semantics.
 */
export const OS_OBJECT_CATALOG: OSObjectDescriptor[] = [
  {
    id: 'object_quicklist',
    label: 'Object Quick List',
    description:
      'OS-level harness emitting object_selected intents and validating right-rail behavior.',
    component: ObjectQuickList,
  },
  {
    id: 'workspace_status_chip',
    label: 'Workspace Status Chip',
    description:
      'Indicates workspace health status (nominal/warning/critical) and emits workspace_status_selected intent.',
    component: WorkspaceStatusChip,
  },
  {
    id: 'workspace_activity_feed',
    label: 'Workspace Activity Feed',
    description:
      'Displays timestamped activity items and emits workspace_activity_selected intent on click.',
    component: WorkspaceActivityFeed,
  },
  {
    id: 'workspace_command_palette',
    label: 'Workspace Command Palette',
    description:
      'Searchable command list emitting workspace_command_invoked intents for OS-level actions.',
    component: WorkspaceCommandPalette,
  },
];

export const listOSObjects = (): OSObjectDescriptor[] => OS_OBJECT_CATALOG;

export const resolveOSObjectComponent = (id: OSObjectId): ComponentType<any> | null => {
  const descriptor = OS_OBJECT_CATALOG.find((entry) => entry.id === id);
  return descriptor ? descriptor.component : null;
};

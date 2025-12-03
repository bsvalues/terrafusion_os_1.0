/**
 * OS UI Primitives – Barrel Export
 *
 * Low-level UI components for TerraFusion OS.
 * These are NOT OS objects (not catalog-registered),
 * but are used inside OS objects and workspaces.
 */

// Glass panels (Tahoe aesthetic)
export { OSGlassPanel } from './OSGlassPanel';
export type { OSGlassPanelProps } from './OSGlassPanel';

export { OSGlassPanelRightRail } from './OSGlassPanelRightRail';
export type { OSGlassPanelRightRailProps } from './OSGlassPanelRightRail';

// TerraSphere status visualizer
export { TerraSphereStatus } from './TerraSphereStatus';
export type {
  TerraSphereLevel,
  TerraSphereSize,
  TerraSphereStatusProps,
} from './TerraSphereStatus';

export { WorkspaceTerraSphere } from './WorkspaceTerraSphere';
export type { WorkspaceTerraSphereProps } from './WorkspaceTerraSphere';

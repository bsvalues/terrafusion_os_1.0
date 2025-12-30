/**
 * TerraFusion OS Hooks Index
 * 
 * Re-exports all custom hooks for the OS Shell.
 * 
 * @module hooks
 */

// Hydration & Persistence
export {
  useHydration,
  useDesktopPersistence,
  useStartMenuPersistence,
  useRecentModules,
  type HydrationState,
  type HydrationResult,
} from './useHydration';

// Connection Hooks
export { useBackendConnection } from './useBackendConnection';
export { useOSConnection } from './useOSConnection';

// System Hooks
export { useSystemHealth } from './useSystemHealth';
export { useAgentSwarmStatus } from './useAgentSwarmStatus';

// Module Ecosystem
export { useModules } from './useModules';
export { useModuleEcosystem } from './useModuleEcosystem';

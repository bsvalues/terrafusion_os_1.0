/**
 * TerraFusion OS Hooks Index
 *
 * Re-exports all custom hooks for the OS Shell.
 *
 * @module hooks
 */

// Hydration & Persistence
export {
  useDesktopPersistence,
  useHydration,
  useRecentModules,
  useStartMenuPersistence,
  type HydrationResult,
  type HydrationState,
} from './useHydration';

// Connection Hooks
export { useBackendConnection } from './useBackendConnection';
export { useOSConnection } from './useOSConnection';

// System Hooks
export { useAgentSwarmStatus } from './useAgentSwarmStatus';
export { useSystemHealth } from './useSystemHealth';

// Module Ecosystem
export { useModuleEcosystem } from './useModuleEcosystem';
export { useModules } from './useModules';

// Error Handling
export {
  useErrorReporter,
  errorTracker,
  type ErrorContext,
  type ErrorReporter,
} from './useErrorReporter';

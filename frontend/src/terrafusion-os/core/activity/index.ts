/**
 * OS Activity module – barrel export.
 */

// Telemetry ingestion (new spec)
export { ingestWorkspaceTelemetry } from './ingestTelemetry';
export type {
  WorkspaceTelemetryEvent,
  WorkspaceTelemetryKind,
  WorkspaceTelemetrySeverity,
} from './telemetryTypes';
export {
  useWorkspaceTelemetrySocket,
  type WorkspaceTelemetrySocketOptions,
} from './useWorkspaceTelemetrySocket';

// Legacy telemetry (preserved for backwards compatibility)
export { ingestWorkspaceEvent } from './ingestWorkspaceEvent';
export {
  useWorkspacePollingTelemetry,
  useWorkspaceTelemetry,
  type RawTelemetryPayload,
  type UseWorkspacePollingTelemetryOptions,
  type UseWorkspaceTelemetryOptions,
} from './useWorkspaceTelemetry';

// Intent → Activity mapping
export {
  recordActivityFromIntent,
  recordWorkspaceActivityFromIntent,
  type IntentPayload,
} from './recordActivityFromIntent';

// Core types
export type {
  IncomingWorkspaceEvent,
  SystemWorkspaceActivityItem,
  WorkspaceActivityFilter,
  WorkspaceActivityItem,
  WorkspaceActivityKind,
  WorkspaceActivityType,
} from './types';

// Activity consumption hook
export {
  useWorkspaceActivity,
  type UseWorkspaceActivityOptions,
  type UseWorkspaceActivityResult,
} from './useWorkspaceActivity';

// OS-wide activity hook
export {
  useSystemActivity,
  type UseSystemActivityOptions,
  type UseSystemActivityResult,
} from './useSystemActivity';

// Health summary computation
export {
  computeWorkspaceHealthSummary,
  type HealthLevel,
  type WorkspaceHealthSummary,
} from './healthSummary';

export {
  useWorkspaceHealthSummary,
  type UseWorkspaceHealthSummaryResult,
} from './useWorkspaceHealthSummary';

// Provider
export {
  clearRuntimeActivity,
  defaultWorkspaceActivityProvider,
  getWorkspaceActivityProvider,
  resetWorkspaceActivityProvider,
  setWorkspaceActivityProvider,
  type WorkspaceActivityProvider,
} from './WorkspaceActivityProvider';

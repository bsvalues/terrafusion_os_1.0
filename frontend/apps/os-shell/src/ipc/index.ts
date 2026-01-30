/**
 * TerraFusion OS IPC Module
 * 
 * Inter-Process Communication bridge for app ↔ shell messaging.
 * 
 * @module ipc
 */

// Types
export {
  TF_PROTOCOL_VERSION,
  TF_MESSAGE_TYPES,
  isTfIpcEnvelope,
  isTfSystemLogPayload,
  isTfOpenAppPayload,
  isTfSetBadgePayload,
  type TfIpcEnvelope,
  type TfIpcSource,
  type TfLogLevel,
  type TfSystemLogPayload,
  type TfOpenAppPayload,
  type TfBadgeState,
  type TfSetBadgePayload,
  type TfSystemLogEnvelope,
  type TfOpenAppEnvelope,
  type TfSetBadgeEnvelope,
  type TfMessageType,
} from './ipcTypes';

// Origin validation
export {
  isOriginAllowed,
  getModuleIdByOrigin,
  validateOriginAndGetModuleId,
  getAllowedOrigins,
  getModuleOriginMap,
  buildModuleOriginMap,
  resetOriginMapCache,
} from './ipcOrigin';

// Router
export {
  routeIpcMessage,
  type IpcRouterDeps,
  type RouteResult,
  type TelemetryEvent,
} from './ipcRouter';

// React integration
export { useIpcListener, IpcBridgeProvider } from './useIpcListener';

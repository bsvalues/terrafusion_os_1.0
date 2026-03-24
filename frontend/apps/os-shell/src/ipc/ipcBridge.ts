/**
 * TerraFusion IPC Bridge
 *
 * Handles incoming postMessage events from child apps (iframes) and routes
 * them to the appropriate Shell subsystems (Neural Feed, Window Manager, etc.)
 *
 * Security: Only accepts messages from registered app origins.
 *
 * @module ipc/ipcBridge
 * @see SUCCESS CRITERIA SC-6.2: Shell Receiver
 */

import { GENERATED_MODULES, type ModuleManifest } from '../config/generatedModules';
import { getViteEnv } from '../shared/viteEnv';
import {
    isTfIpcEnvelope,
    isTfOpenApp,
    isTfSetBadge,
    isTfSystemLog,
    type TfOpenAppPayload,
    type TfSetBadgePayload,
    type TfSystemLogPayload,
} from './ipcTypes';

// ============================================================================
// Origin Validation
// ============================================================================

/**
 * Extract origin from a URL string.
 * Returns null if URL is invalid.
 */
function extractOrigin(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Build a lookup map of origin → module for fast validation.
 * Only includes modules with URL entries.
 */
function buildOriginMap(): Map<string, ModuleManifest> {
  const map = new Map<string, ModuleManifest>();

  for (const module of GENERATED_MODULES) {
    if (module.entry.type === 'url') {
      const origin = extractOrigin(module.entry.url);
      if (origin) {
        map.set(origin, module);
      }
    }
  }

  return map;
}

// Singleton origin map (built once on module load)
let originMap: Map<string, ModuleManifest> | null = null;

function getOriginMap(): Map<string, ModuleManifest> {
  if (!originMap) {
    originMap = buildOriginMap();
  }
  return originMap;
}

/**
 * Look up a module by its origin.
 * Returns the module manifest if found, null otherwise.
 *
 * @param origin - The origin from event.origin (e.g., "http://localhost:4201")
 * @returns Module manifest or null if not found/trusted
 */
export function getModuleByOrigin(origin: string): ModuleManifest | null {
  if (!origin || origin === 'null') return null;

  // Security: Only trust localhost origins in development
  // In production, this would check against deployed app domains
  if (!origin.startsWith('http://localhost:') && !origin.startsWith('https://localhost:')) {
    return null;
  }

  return getOriginMap().get(origin) ?? null;
}

/**
 * Reset the origin map (useful for testing)
 */
export function resetOriginMap(): void {
  originMap = null;
}

// ============================================================================
// IPC Bridge Dependencies
// ============================================================================

export interface IpcBridgeDeps {
  /**
   * Push a log entry to the Neural Feed
   */
  pushToNeuralFeed: (entry: {
    id: string;
    tsUtc: string;
    level: 'Info' | 'Warn' | 'Error' | 'Action' | 'Thinking';
    agent: string;
    topic: string;
    message: string;
    data?: Record<string, unknown>;
  }) => void;

  /**
   * Open an app window by module ID
   */
  openApp: (moduleId: string, focus?: boolean) => void;

  /**
   * Set app badge state (optional)
   */
  setAppBadge?: (appId: string, state: string, label?: string) => void;
}

// ============================================================================
// Message Handlers
// ============================================================================

function mapLogLevel(level: string): 'Info' | 'Warn' | 'Error' | 'Action' | 'Thinking' {
  switch (level) {
    case 'debug':
      return 'Thinking';
    case 'info':
      return 'Info';
    case 'warn':
      return 'Warn';
    case 'error':
      return 'Error';
    default:
      return 'Info';
  }
}

function generateEventId(): string {
  return `ipc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function handleSystemLog(payload: TfSystemLogPayload, appId: string, deps: IpcBridgeDeps): void {
  deps.pushToNeuralFeed({
    id: generateEventId(),
    tsUtc: new Date().toISOString(),
    level: mapLogLevel(payload.level),
    agent: appId,
    topic: payload.topic ?? 'app',
    message: payload.message,
    data: payload.data,
  });
}

function handleOpenApp(payload: TfOpenAppPayload, deps: IpcBridgeDeps): void {
  deps.openApp(payload.appId, payload.focus ?? true);
}

function handleSetBadge(payload: TfSetBadgePayload, appId: string, deps: IpcBridgeDeps): void {
  if (deps.setAppBadge) {
    deps.setAppBadge(appId, payload.state, payload.label);
  }
}

// ============================================================================
// Bridge Installation
// ============================================================================

/**
 * Install the IPC bridge listener.
 * Returns a cleanup function to remove the listener.
 *
 * @param deps - Dependencies for routing messages to subsystems
 * @returns Cleanup function
 */
export function installIpcBridge(deps: IpcBridgeDeps): () => void {
  const handler = (event: MessageEvent) => {
    // Step 1: Validate origin
    const senderModule = getModuleByOrigin(event.origin);
    if (!senderModule) {
      // Silently ignore messages from untrusted origins
      // This is intentional - we don't want to leak info about what we accept
      return;
    }

    const appId = senderModule.id;
    const msg = event.data;

    // Step 2: Validate envelope structure
    if (!isTfIpcEnvelope(msg)) {
      // Not a TerraFusion message, ignore
      return;
    }

    // Step 3: Route by message type
    try {
      if (isTfSystemLog(msg)) {
        handleSystemLog(msg.payload, appId, deps);
        return;
      }

      if (isTfOpenApp(msg)) {
        handleOpenApp(msg.payload, deps);
        return;
      }

      if (isTfSetBadge(msg)) {
        handleSetBadge(msg.payload, appId, deps);
        return;
      }

      // Unknown message type - log for debugging but don't crash
      if (getViteEnv().DEV) {
      }
    } catch (err) {
      // Error handling a message - log but don't crash the shell
      console.error(`[IPC] Error handling message from ${appId}:`, err);
    }
  };

  window.addEventListener('message', handler);

  // Return cleanup function
  return () => {
    window.removeEventListener('message', handler);
  };
}

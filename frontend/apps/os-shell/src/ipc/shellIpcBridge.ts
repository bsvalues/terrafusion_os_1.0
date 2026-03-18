/**
 * TerraFusion Shell IPC Bridge
 *
 * Global message listener that receives postMessage from child apps (iframes)
 * and routes them to the appropriate shell handlers.
 *
 * Security: Only messages from allowlisted origins are processed.
 *
 * @module ipc/shellIpcBridge
 * @see SUCCESS CRITERIA SC-6.3: Shell Receiver
 */

import { activateModule } from '../orchestration/moduleActivation';
import { useAgentStore } from '../sentinel/agentStore';
import {
    isTfIpcEnvelope,
    isTfOpenApp,
    isTfSetBadge,
    isTfSystemLog,
    TF_MESSAGE_TYPES,
    type TfBadgeState,
} from './ipcTypes';
import { getModuleIdByOrigin } from './originAllowlist';
import { createLogger } from '@/hooks/useLogger';

const logger = createLogger('shellIpcBridge');

// ============================================================================
// Boot Dedupe (HMR Spam Protection)
// ============================================================================

/** TTL for boot message deduplication (ms) */
const BOOT_DEDUPE_TTL_MS = 2000;

/** Tracks last boot timestamp per appId */
const lastBootTime: Record<string, number> = {};

/**
 * Check if a boot message should be dropped (dedupe).
 * @param appId - The app sending the boot message
 * @param topic - The message topic
 * @returns true if message should be dropped
 */
function shouldDedupeBootMessage(appId: string, topic: string | undefined): boolean {
  if (topic !== 'boot') return false;

  const now = Date.now();
  const last = lastBootTime[appId] ?? 0;

  if (now - last < BOOT_DEDUPE_TTL_MS) {
    return true; // Drop duplicate
  }

  lastBootTime[appId] = now;
  return false;
}

// ============================================================================
// Badge Store (simple in-memory for now)
// ============================================================================

type AppBadge = {
  state: TfBadgeState;
  label?: string;
  updatedAt: number;
};

const appBadges = new Map<string, AppBadge>();

/**
 * Get badge for an app (for taskbar/start menu rendering)
 */
export function getAppBadge(appId: string): AppBadge | undefined {
  return appBadges.get(appId);
}

/**
 * Get all app badges
 */
export function getAllAppBadges(): Map<string, AppBadge> {
  return new Map(appBadges);
}

// ============================================================================
// Log Level Mapping
// ============================================================================

/** Map IPC log levels to AgentEvent levels */
function mapLogLevel(level: string): 'Info' | 'Warn' | 'Error' {
  switch (level) {
    case 'debug':
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

// ============================================================================
// Message Handler
// ============================================================================

/**
 * Handle incoming IPC message from a child app.
 *
 * @param event - The MessageEvent from window.postMessage
 */
function handleMessage(event: MessageEvent): void {
  const msg = event.data;

  // -------------------------------------------------------------------------
  // Step 1: Validate envelope structure
  // -------------------------------------------------------------------------
  if (!isTfIpcEnvelope(msg)) {
    // Not a TerraFusion message - ignore silently
    return;
  }

  // -------------------------------------------------------------------------
  // Step 2: Validate origin (SECURITY CRITICAL)
  // -------------------------------------------------------------------------
  const appId = getModuleIdByOrigin(event.origin);
  if (!appId) {
    // Untrusted origin - reject silently
    if (import.meta.env.DEV) {
      logger.warn(`Rejected message from untrusted origin: ${event.origin}`);
    }
    return;
  }

  // -------------------------------------------------------------------------
  // Step 3: Route by message type
  // -------------------------------------------------------------------------
  switch (msg.type) {
    case TF_MESSAGE_TYPES.SYSTEM_LOG: {
      if (!isTfSystemLog(msg)) {
        logger.warn('Invalid TF_SYSTEM_LOG payload');
        return;
      }

      const { level, message, topic, data } = msg.payload;

      // ✅ BOOT DEDUPE: Drop HMR spam (topic === 'boot' within 2s window)
      if (shouldDedupeBootMessage(appId, topic)) {
        if (import.meta.env.DEV) {
          logger.debug(`[ipc] ${appId} → SYSTEM_LOG: [${level}] DEDUPED (boot within TTL)`);
        }
        return;
      }

      // Push to Neural Feed / Agent Store with audit stamps
      const { appendEvents } = useAgentStore.getState();
      appendEvents(
        [
          {
            id: `ipc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            tsUtc: new Date().toISOString(),
            level: mapLogLevel(level),
            agent: appId,
            topic: topic ?? 'app',
            message,
            data: data ?? undefined,
            // ✅ AUDIT STAMPS: Court-admissible provenance
            ipc: true,
            origin: event.origin,
            proto: 1,
          },
        ],
        null,
        []
      );

      if (import.meta.env.DEV) {
        logger.debug(`[ipc] ${appId} → SYSTEM_LOG: [${level}] ${message}`, data);
      }
      break;
    }

    case TF_MESSAGE_TYPES.OPEN_APP: {
      if (!isTfOpenApp(msg)) {
        logger.warn('Invalid TF_OPEN_APP payload');
        return;
      }

      const { appId: targetAppId, focus = true } = msg.payload;

      // ✅ AUDIT: Log orchestration request for compliance evidence
      const { appendEvents } = useAgentStore.getState();
      appendEvents(
        [
          {
            id: `ipc-orch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            tsUtc: new Date().toISOString(),
            level: 'Info',
            agent: appId,
            topic: 'orchestrate',
            message: `Requested openApp: ${targetAppId}`,
            data: { targetAppId, focus },
            ipc: true,
            origin: event.origin,
            proto: 1,
          },
        ],
        null,
        []
      );

      // Use the canonical module activation orchestrator
      activateModule(targetAppId, {
        source: 'system',
        focusIfOpen: focus,
      }).catch((err) => {
        logger.error(`Failed to open app: ${targetAppId}`, err);
      });

      if (import.meta.env.DEV) {
        logger.debug(`[ipc] ${appId} → OPEN_APP: ${targetAppId}`);
      }
      break;
    }

    case TF_MESSAGE_TYPES.SET_BADGE: {
      if (!isTfSetBadge(msg)) {
        logger.warn('Invalid TF_SET_BADGE payload');
        return;
      }

      const { state, label } = msg.payload;

      // Store badge state
      appBadges.set(appId, {
        state,
        label,
        updatedAt: Date.now(),
      });

      if (import.meta.env.DEV) {
        logger.debug(`[ipc] ${appId} → SET_BADGE: ${state}${label ? ` "${label}"` : ''}`);
      }
      break;
    }

    default:
      // Unknown message type - ignore
      if (import.meta.env.DEV) {
        logger.debug(`[ipc] ${appId} → Unknown message type: ${msg.type}`);
      }
      break;
  }
}

// ============================================================================
// Bridge Installation
// ============================================================================

let isInstalled = false;

/**
 * Install the shell IPC bridge.
 *
 * Adds a global message listener that routes IPC messages to handlers.
 * Safe to call multiple times (idempotent).
 *
 * @returns Cleanup function to remove the listener
 */
export function installShellIpcBridge(): () => void {
  if (isInstalled) {
    logger.warn('Bridge already installed');
    return () => {};
  }

  window.addEventListener('message', handleMessage);
  isInstalled = true;

  logger.info('IPC bridge installed');

  return () => {
    window.removeEventListener('message', handleMessage);
    isInstalled = false;
    logger.info('IPC bridge removed');
  };
}

/**
 * Check if the bridge is installed.
 */
export function isBridgeInstalled(): boolean {
  return isInstalled;
}

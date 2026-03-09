/**
 * TerraFusion OS IPC Listener Hook
 * 
 * React hook that installs the global message event listener and
 * routes validated IPC messages to the appropriate stores.
 * 
 * @module ipc/useIpcListener
 */

import { useEffect, useCallback } from 'react';
import logger from '../utils/logger';
import { validateOriginAndGetModuleId } from './ipcOrigin';
import { routeIpcMessage, type TelemetryEvent } from './ipcRouter';
import { useAgentStore } from '../sentinel/agentStore';
import { useDesktopStore } from '../stores/desktopStore';
import { MODULES } from '../config/modules';

// ============================================================================
// Helper: Find module by ID
// ============================================================================

function findModuleById(moduleId: string) {
  return MODULES.find((m) => m.id === moduleId);
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook that installs the IPC bridge listener.
 * Should be called once at the shell root level.
 * 
 * @returns Object with listener status info
 */
export function useIpcListener() {
  const appendEvents = useAgentStore((s) => s.appendEvents);
  const openWindow = useDesktopStore((s) => s.openWindow);

  /**
   * Push telemetry event to Neural Feed
   */
  const pushTelemetry = useCallback(
    (event: TelemetryEvent) => {
      // Convert to AgentEvent format expected by the store
      const agentEvent = {
        id: event.id,
        tsUtc: event.tsUtc,
        level: event.level,
        agent: event.agent,
        topic: event.topic,
        message: event.message,
        correlationId: event.correlationId,
        data: event.data,
      };

      // The store expects an array and a cursor
      appendEvents([agentEvent], null, []);
    },
    [appendEvents]
  );

  /**
   * Open an app by moduleId
   */
  const openApp = useCallback(
    (appId: string) => {
      const module = findModuleById(appId);
      if (!module) {
        console.warn(`[IPC] openApp: Unknown module "${appId}"`);
        return;
      }

      // Use the desktop store's openWindow action
      openWindow(module.id, module.displayName, module.icon ?? 'Box');
    },
    [openWindow]
  );

  /**
   * Message event handler
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Security: Validate origin against module registry
      const verifiedAppId = validateOriginAndGetModuleId(event.origin);
      if (!verifiedAppId) {
        // Origin not from a registered app - silently ignore
        // (Could be from browser extensions, devtools, etc.)
        return;
      }

      // Route the message
      const result = routeIpcMessage(event.data, verifiedAppId, {
        pushTelemetry,
        openApp,
        // setAppBadge not yet implemented
      });

      // Log routing failures for debugging (only in dev)
      if (!result.routed && import.meta.env.DEV) {
        console.debug(
          `[IPC] Message from "${verifiedAppId}" not routed:`,
          result.reason,
          event.data
        );
      }
    },
    [pushTelemetry, openApp]
  );

  // Install/uninstall listener
  useEffect(() => {
    window.addEventListener('message', handleMessage);

    logger.debug('[IPC] Shell IPC bridge installed');

    return () => {
      window.removeEventListener('message', handleMessage);
      logger.debug('[IPC] Shell IPC bridge removed');
    };
  }, [handleMessage]);

  return {
    isListening: true,
  };
}

/**
 * IPC Bridge Provider Component
 * 
 * Alternative to the hook - use as a component in your tree
 * if you prefer a component-based approach.
 */
export function IpcBridgeProvider({ children }: { children: React.ReactNode }) {
  useIpcListener();
  return <>{children}</>;
}

export default useIpcListener;

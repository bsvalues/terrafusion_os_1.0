/**
 * TerraFusion IPC Bridge Hook
 *
 * React hook that installs the IPC bridge and connects it to Shell stores.
 * Should be called once at the Shell root level.
 *
 * @module ipc/useIpcBridge
 * @see SUCCESS CRITERIA SC-6.2: Shell Receiver
 */

import { useEffect, useRef } from 'react';
import { GENERATED_MODULES } from '../config/generatedModules';
import { useAgentStore } from '../sentinel/agentStore';
import { getViteEnv } from '../shared/viteEnv';
import { useDesktopStore } from '../stores/desktopStore';
import { installIpcBridge, type IpcBridgeDeps } from './ipcBridge';
import { useLogger } from '@/hooks/useLogger';

/**
 * Install the IPC bridge and connect to Shell stores.
 *
 * This hook should be called ONCE at the Shell root (e.g., in Desktop.tsx or App.tsx).
 * It sets up the message listener and routes incoming IPC messages to:
 * - Neural Feed (TF_SYSTEM_LOG → AgentStore)
 * - Window Manager (TF_OPEN_APP → DesktopStore)
 */
export function useIpcBridge(): void {
  // Get store actions
  const appendEvents = useAgentStore((state) => state.appendEvents);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const logger = useLogger('useIpcBridge');

  const env = getViteEnv();

  // Track if bridge is installed (for strict mode double-mount)
  const installedRef = useRef(false);

  useEffect(() => {
    // Prevent double installation in React strict mode
    if (installedRef.current) return;
    installedRef.current = true;

    const deps: IpcBridgeDeps = {
      pushToNeuralFeed: (entry) => {
        // AgentStore expects array of events
        appendEvents([entry], null, []);
      },

      openApp: (moduleId, focus = true) => {
        // Find module in registry
        const module = GENERATED_MODULES.find((m) => m.id === moduleId);
        if (!module) {
          logger.warn(`Unknown app requested: ${moduleId}`);
          return;
        }

        // Open window via desktop store
        openWindow(moduleId, module.displayName, module.iconName);

        // Focus is handled by openWindow (it always sets activeWindowId)
      },

      setAppBadge: (appId, state, label) => {
        // Badge system not yet implemented - log for now
        if (env.DEV) {
          logger.debug(`Badge update: ${appId} → ${state}${label ? ` (${label})` : ''}`);
        }
      },
    };

    // Install the bridge
    const cleanup = installIpcBridge(deps);

    // Log installation in dev
    if (env.DEV) {
      logger.info('Bridge installed - listening for app messages');
    }

    return () => {
      cleanup();
      installedRef.current = false;
      if (env.DEV) {
        logger.info('Bridge uninstalled');
      }
    };
  }, [appendEvents, openWindow]);
}

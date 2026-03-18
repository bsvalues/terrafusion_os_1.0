/**
 * TerraFusion OS — Shell Event Bus
 *
 * Lightweight pub/sub for window lifecycle events.
 * The desktop store emits events here; tests and TerraTrace subscribe.
 *
 * @module stores/shellEventBus
 */

import type { ShellEvent, ShellEventType } from '../../../../os-platform/core/types';

export type ShellEventListener = (event: ShellEvent) => void;

const listeners: ShellEventListener[] = [];

export const shellEventBus = {
  /** Subscribe to all shell events. Returns unsubscribe function. */
  subscribe(listener: ShellEventListener): () => void {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },

  /** Emit a shell event to all subscribers. */
  emit(event: ShellEvent): void {
    for (const listener of listeners) {
      listener(event);
    }
  },

  /** Convenience: emit with auto-timestamp. */
  fire(type: ShellEventType, windowId: string | null, moduleId: string, detail?: Record<string, unknown>): void {
    shellEventBus.emit({
      type,
      windowId,
      moduleId,
      timestamp: new Date().toISOString(),
      detail,
    });
  },

  /** Remove all listeners (for test cleanup). */
  clear(): void {
    listeners.length = 0;
  },
};

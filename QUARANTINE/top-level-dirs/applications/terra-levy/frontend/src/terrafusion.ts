/**
 * TerraFusion IPC SDK
 *
 * Lightweight SDK for TerraFusion apps to communicate with the OS Shell.
 * Uses window.postMessage to send typed messages to the parent shell.
 *
 * @module terrafusion
 * @version 1.0.0
 */

// ============================================================================
// Protocol Constants (must match shell's ipcTypes.ts)
// ============================================================================

const TF_PROTOCOL_VERSION = 1;

const TF_MESSAGE_TYPES = {
  SYSTEM_LOG: 'TF_SYSTEM_LOG',
  OPEN_APP: 'TF_OPEN_APP',
  SET_BADGE: 'TF_SET_BADGE',
} as const;

// ============================================================================
// Types
// ============================================================================

export type TfLogLevel = 'debug' | 'info' | 'warn' | 'error';
export type TfBadgeState = 'idle' | 'busy' | 'warn' | 'error';

interface TfIpcEnvelope<T = unknown> {
  tf: number;
  type: string;
  ts: number;
  payload: T;
}

// ============================================================================
// Internal: Message Sender
// ============================================================================

function tfPost<T>(type: string, payload: T): void {
  const envelope: TfIpcEnvelope<T> = {
    tf: TF_PROTOCOL_VERSION,
    type,
    ts: Date.now(),
    payload,
  };

  const target = window.parent !== window ? window.parent : window;
  target.postMessage(envelope, '*');
}

// ============================================================================
// Boot Gate (HMR Spam Protection)
// ============================================================================

const BOOT_KEY_PREFIX = 'tf_boot_sent_';

/**
 * Execute a function exactly once per session (survives HMR, not page refresh).
 */
export function bootOnce(appId: string, fn: () => void): void {
  const key = `${BOOT_KEY_PREFIX}${appId}`;
  if (sessionStorage.getItem(key) === '1') return;
  sessionStorage.setItem(key, '1');
  fn();
}

// ============================================================================
// Public API
// ============================================================================

export const TF = {
  log(
    level: TfLogLevel,
    message: string,
    options?: { topic?: string; data?: Record<string, unknown> }
  ): void {
    tfPost(TF_MESSAGE_TYPES.SYSTEM_LOG, {
      level,
      message,
      topic: options?.topic,
      data: options?.data,
    });
  },

  openApp(appId: string, focus = true): void {
    tfPost(TF_MESSAGE_TYPES.OPEN_APP, { appId, focus });
  },

  badge(state: TfBadgeState, label?: string): void {
    tfPost(TF_MESSAGE_TYPES.SET_BADGE, { state, label });
  },

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, { data });
  },

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, { data });
  },

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, { data });
  },

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, { data });
  },
};

export default TF;

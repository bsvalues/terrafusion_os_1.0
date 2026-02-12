/**
 * TerraFusion IPC SDK
 *
 * Lightweight SDK for TerraFusion apps to communicate with the OS Shell.
 * Uses window.postMessage to send typed messages to the parent shell.
 *
 * Usage:
 * ```ts
 * import { TF } from './terrafusion';
 *
 * // Log to Neural Feed
 * TF.log('info', 'App initialized', { topic: 'boot' });
 *
 * // Open another app
 * TF.openApp('terra-levy');
 *
 * // Set taskbar badge
 * TF.badge('busy', 'Processing...');
 * ```
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

/**
 * Post a message to the parent shell.
 * Uses '*' as targetOrigin because the shell validates event.origin.
 */
function tfPost<T>(type: string, payload: T): void {
  const envelope: TfIpcEnvelope<T> = {
    tf: TF_PROTOCOL_VERSION,
    type,
    ts: Date.now(),
    payload,
  };

  // Post to parent (if in iframe) or self (for testing)
  const target = window.parent !== window ? window.parent : window;
  target.postMessage(envelope, '*');
}

// ============================================================================
// Boot Gate (HMR Spam Protection)
// ============================================================================

const BOOT_KEY_PREFIX = 'tf_boot_sent_';

/**
 * Execute a function exactly once per session (survives HMR, not page refresh).
 * Uses sessionStorage to track execution.
 *
 * @param appId - Unique app identifier (e.g., 'terra-dossier')
 * @param fn - Function to execute once
 *
 * @example
 * bootOnce('terra-dossier', () => {
 *   TF.log('info', 'TerraDossier boot', { topic: 'boot' });
 *   TF.badge('idle');
 * });
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

/**
 * TerraFusion SDK - Communication bridge to the OS Shell
 */
export const TF = {
  /**
   * Log a message to the Neural Feed.
   *
   * @param level - Severity level
   * @param message - Human-readable message
   * @param options - Optional topic and structured data
   *
   * @example
   * TF.log('info', 'Valuation complete', { topic: 'valuation', data: { parcelId: '123' } });
   */
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

  /**
   * Request the shell to open another app.
   *
   * @param appId - Module ID to open (e.g., 'terra-levy')
   * @param focus - Whether to focus the window (default: true)
   *
   * @example
   * TF.openApp('terra-levy');
   */
  openApp(appId: string, focus = true): void {
    tfPost(TF_MESSAGE_TYPES.OPEN_APP, { appId, focus });
  },

  /**
   * Set the app's badge state in the taskbar/start menu.
   *
   * @param state - Badge state (idle, busy, warn, error)
   * @param label - Optional label (e.g., "3 pending")
   *
   * @example
   * TF.badge('busy', 'Processing...');
   */
  badge(state: TfBadgeState, label?: string): void {
    tfPost(TF_MESSAGE_TYPES.SET_BADGE, { state, label });
  },

  /**
   * Convenience: Log debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, { data });
  },

  /**
   * Convenience: Log info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, { data });
  },

  /**
   * Convenience: Log warning message
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, { data });
  },

  /**
   * Convenience: Log error message
   */
  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, { data });
  },
};

export default TF;

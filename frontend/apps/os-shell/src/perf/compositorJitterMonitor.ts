/**
 * Compositor Jitter Monitor — D2: Continuous CLS monitoring
 * =================================================================
 * Lightweight persistent monitor that tracks Cumulative Layout Shift
 * in real-time and logs warnings when jitter exceeds thresholds.
 *
 * Design:
 * - Session-scoped: starts once, reports at intervals or on threshold breach
 * - No polling: event-driven via PerformanceObserver
 * - Reports via structured console.warn (Serilog-style)
 * - Window-based CLS (5-second session windows per Web Vitals v3)
 * - Safe in JSDOM: no-ops gracefully
 *
 * Usage:
 *   import { startJitterMonitor, stopJitterMonitor, getJitterReport } from './compositorJitterMonitor';
 *   startJitterMonitor(); // Call once at app boot
 *
 * @module perf/compositorJitterMonitor
 */

// ============================================================================
// Constants
// ============================================================================

/** CLS below this is "good" per Web Vitals */
const CLS_GOOD = 0.1;

/** CLS above this triggers a warning */
const CLS_WARN = 0.05;

/** Session window duration in ms (Web Vitals v3 windowing) */
const SESSION_WINDOW_MS = 5000;

/** Gap between session windows that starts a new session */
const SESSION_GAP_MS = 1000;

// ============================================================================
// Types
// ============================================================================

export interface JitterReport {
  /** Largest session window CLS (the metric Google uses) */
  maxSessionCls: number;
  /** Total accumulated CLS across all windows */
  totalCls: number;
  /** Number of individual shift events */
  shiftCount: number;
  /** Whether monitoring is active */
  active: boolean;
  /** Whether the current session is "good" (<0.1) */
  healthy: boolean;
  /** Monitoring start time */
  startedAt: number | null;
  /** Duration in seconds */
  durationSeconds: number;
}

interface SessionWindow {
  value: number;
  entries: number[];
  startTime: number;
  lastEntryTime: number;
}

// ============================================================================
// State
// ============================================================================

let observer: PerformanceObserver | null = null;
let active = false;
let startedAt: number | null = null;

let currentSession: SessionWindow | null = null;
let maxSessionCls = 0;
let totalCls = 0;
let shiftCount = 0;
let warningEmitted = false;

// ============================================================================
// Public API
// ============================================================================

/**
 * Start continuous jitter monitoring.
 * Idempotent — calling multiple times is safe.
 */
export function startJitterMonitor(): void {
  if (active) return;

  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    active = true;
    startedAt = Date.now();
    return;
  }

  try {
    const types = PerformanceObserver.supportedEntryTypes || [];
    if (!types.includes('layout-shift')) {
      active = true;
      startedAt = Date.now();
      return;
    }
  } catch {
    active = true;
    startedAt = Date.now();
    return;
  }

  // Reset state
  currentSession = null;
  maxSessionCls = 0;
  totalCls = 0;
  shiftCount = 0;
  warningEmitted = false;
  startedAt = Date.now();

  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shiftEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
        if (shiftEntry.hadRecentInput) continue;

        const value = shiftEntry.value;
        const time = shiftEntry.startTime;

        totalCls += value;
        shiftCount++;

        // Session windowing (Web Vitals v3 algorithm)
        if (
          currentSession &&
          time - currentSession.lastEntryTime < SESSION_GAP_MS &&
          time - currentSession.startTime < SESSION_WINDOW_MS
        ) {
          // Extend current session
          currentSession.value += value;
          currentSession.entries.push(value);
          currentSession.lastEntryTime = time;
        } else {
          // Start new session
          currentSession = {
            value,
            entries: [value],
            startTime: time,
            lastEntryTime: time,
          };
        }

        // Track max session CLS
        if (currentSession.value > maxSessionCls) {
          maxSessionCls = currentSession.value;
        }

        // Emit warning on threshold breach (once per session)
        if (maxSessionCls >= CLS_WARN && !warningEmitted) {
          warningEmitted = true;
          console.warn(
            '[TerraFusion:Compositor] CLS threshold breach detected',
            {
              maxSessionCls: Math.round(maxSessionCls * 1000) / 1000,
              threshold: CLS_WARN,
              shiftCount,
              healthy: maxSessionCls < CLS_GOOD,
            }
          );
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: false });
    active = true;
  } catch {
    active = true;
  }
}

/**
 * Stop jitter monitoring and disconnect observer.
 */
export function stopJitterMonitor(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  active = false;
}

/**
 * Get current jitter report without stopping the monitor.
 */
export function getJitterReport(): JitterReport {
  const now = Date.now();
  return {
    maxSessionCls: Math.round(maxSessionCls * 10000) / 10000,
    totalCls: Math.round(totalCls * 10000) / 10000,
    shiftCount,
    active,
    healthy: maxSessionCls < CLS_GOOD,
    startedAt,
    durationSeconds: startedAt ? Math.round((now - startedAt) / 1000) : 0,
  };
}

/**
 * Check if jitter is currently within acceptable limits.
 */
export function isCompositorStable(): boolean {
  return maxSessionCls < CLS_GOOD;
}

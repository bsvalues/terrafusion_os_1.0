/**
 * TerraFusion Trace Test Harness
 *
 * Utilities for deterministic trace testing:
 * - Mock clock injection for stable timestamps
 * - Trace collection during test execution
 * - Payload normalization for snapshot comparison
 *
 * @module testUtils/traceHarness
 * @see Slice 18: Deterministic Replay + Golden Trace Regression
 */

import {
    resetTraceClock,
    setTraceClock,
    subscribeToAllTraces,
    type OsActionAnyTraceEvent,
    type OsActionBlockedEvent,
    type OsActionTraceEvent,
} from '../services/osActions';

// ============================================================================
// Clock Injection (re-exports + utilities)
// ============================================================================

/**
 * Create a mock clock that starts at a fixed time and advances by `step` on each call
 * @param startTime - Starting timestamp (default: 1000000000000)
 * @param step - Increment per call (default: 100ms)
 */
export function createMockClock(
  startTime = 1000000000000,
  step = 100
): { now: () => number; reset: () => void } {
  let currentTime = startTime;
  return {
    now: () => {
      const ts = currentTime;
      currentTime += step;
      return ts;
    },
    reset: () => {
      currentTime = startTime;
    },
  };
}

/**
 * Higher-order function to run code with a mock clock
 * Injects clock into osActions trace emission for deterministic timestamps
 * @param fn - The function to execute with mock clock
 * @param options - Clock options (startTime, step)
 */
export async function withMockClock<T>(
  fn: () => T | Promise<T>,
  options: { startTime?: number; step?: number } = {}
): Promise<T> {
  const { startTime = 1000000000000, step = 100 } = options;
  const mockClock = createMockClock(startTime, step);
  const cleanup = setTraceClock(mockClock.now);
  try {
    return await fn();
  } finally {
    cleanup();
  }
}

/**
 * Run code synchronously with a mock clock
 */
export function withMockClockSync<T>(
  fn: () => T,
  options: { startTime?: number; step?: number } = {}
): T {
  const { startTime = 1000000000000, step = 100 } = options;
  const mockClock = createMockClock(startTime, step);
  const cleanup = setTraceClock(mockClock.now);
  try {
    return fn();
  } finally {
    cleanup();
  }
}

// Re-export clock management for direct usage
export { resetTraceClock, setTraceClock };

// ============================================================================
// Trace Collection
// ============================================================================

/**
 * Collected trace entry with normalized event data
 */
export interface CollectedTrace {
  event: OsActionAnyTraceEvent;
  index: number;
}

/**
 * Collect all trace events emitted during function execution
 * @param fn - The function to execute while collecting traces
 * @returns Array of collected trace events
 */
export async function collectTracesDuring<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; traces: OsActionAnyTraceEvent[] }> {
  const traces: OsActionAnyTraceEvent[] = [];
  const unsubscribe = subscribeToAllTraces((event) => {
    traces.push(event);
  });

  try {
    const result = await fn();
    return { result, traces };
  } finally {
    unsubscribe();
  }
}

/**
 * Collect traces synchronously (for non-async scenarios)
 */
export function collectTracesDuringSync<T>(fn: () => T): {
  result: T;
  traces: OsActionAnyTraceEvent[];
} {
  const traces: OsActionAnyTraceEvent[] = [];
  const unsubscribe = subscribeToAllTraces((event) => {
    traces.push(event);
  });

  try {
    const result = fn();
    return { result, traces };
  } finally {
    unsubscribe();
  }
}

// ============================================================================
// Payload Normalization
// ============================================================================

/**
 * Normalized trace event with volatile fields replaced
 */
export interface NormalizedTraceEvent {
  type: 'os_action_invoked' | 'os_action_blocked';
  timestamp: 'NORMALIZED'; // Replaced with constant marker
  payload: NormalizedPayload;
}

/**
 * Normalized payload with all stable fields preserved
 */
export type NormalizedPayload = NormalizedInvokedPayload | NormalizedBlockedPayload;

export interface NormalizedInvokedPayload {
  actionId: string;
  actionType: 'navigation' | 'handler';
  intent: string;
  surface: string;
  suiteId: string;
  moduleId?: string;
  parcelIdHash?: 'NORMALIZED' | undefined; // Replace hash with marker if present
  href?: string;
  handlerKey?: string;
  tabId?: string; // Optional workbench tab ID
  resultType?: string; // Optional privacy-safe result type (for ResultPanel traces)
}

export interface NormalizedBlockedPayload {
  actionId: string;
  actionType: 'navigation' | 'handler';
  intent: string;
  surface: string;
  suiteId: string;
  blockReason: 'disabled' | 'policy';
  disabledReason?: string;
  policyReason?: string;
}

/**
 * Normalize a trace event for deterministic comparison
 * - Replaces timestamp with constant marker
 * - Replaces parcelIdHash with marker (volatile hash)
 * - Preserves all other fields
 */
export function normalizeTraceEvent(event: OsActionAnyTraceEvent): NormalizedTraceEvent {
  if (event.type === 'os_action_invoked') {
    const invoked = event as OsActionTraceEvent;
    return {
      type: 'os_action_invoked',
      timestamp: 'NORMALIZED',
      payload: {
        actionId: invoked.payload.actionId,
        actionType: invoked.payload.actionType,
        intent: invoked.payload.intent,
        surface: invoked.payload.surface,
        suiteId: invoked.payload.suiteId,
        ...(invoked.payload.moduleId && { moduleId: invoked.payload.moduleId }),
        ...(invoked.payload.parcelIdHash && { parcelIdHash: 'NORMALIZED' }),
        ...(invoked.payload.href && { href: invoked.payload.href }),
        ...(invoked.payload.handlerKey && { handlerKey: invoked.payload.handlerKey }),
        ...(invoked.payload.tabId && { tabId: invoked.payload.tabId }),
        ...(invoked.payload.resultType && { resultType: invoked.payload.resultType }),
      },
    };
  } else {
    const blocked = event as OsActionBlockedEvent;
    return {
      type: 'os_action_blocked',
      timestamp: 'NORMALIZED',
      payload: {
        actionId: blocked.payload.actionId,
        actionType: blocked.payload.actionType,
        intent: blocked.payload.intent,
        surface: blocked.payload.surface,
        suiteId: blocked.payload.suiteId,
        blockReason: blocked.payload.blockReason,
        ...(blocked.payload.disabledReason && { disabledReason: blocked.payload.disabledReason }),
        ...(blocked.payload.policyReason && { policyReason: blocked.payload.policyReason }),
      },
    };
  }
}

/**
 * Normalize an array of trace events
 */
export function normalizeTraces(events: OsActionAnyTraceEvent[]): NormalizedTraceEvent[] {
  return events.map(normalizeTraceEvent);
}

// ============================================================================
// Golden Trace Comparison
// ============================================================================

/**
 * Create a stable JSON string with sorted keys (recursive)
 */
function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify((obj as Record<string, unknown>)[key])}`
  );
  return '{' + pairs.join(',') + '}';
}

/**
 * Compare normalized traces against expected golden sequence
 * @returns null if match, or description of first difference
 */
export function compareTraces(
  actual: NormalizedTraceEvent[],
  expected: NormalizedTraceEvent[]
): { match: true } | { match: false; error: string; index: number } {
  if (actual.length !== expected.length) {
    return {
      match: false,
      error: `Length mismatch: got ${actual.length}, expected ${expected.length}`,
      index: Math.min(actual.length, expected.length),
    };
  }

  for (let i = 0; i < expected.length; i++) {
    const actualJson = stableStringify(actual[i]);
    const expectedJson = stableStringify(expected[i]);

    if (actualJson !== expectedJson) {
      return {
        match: false,
        error: `Trace mismatch at index ${i}:\nActual: ${actualJson}\nExpected: ${expectedJson}`,
        index: i,
      };
    }
  }

  return { match: true };
}

/**
 * Assert traces match expected sequence (throws on mismatch)
 */
export function assertTracesMatch(
  actual: OsActionAnyTraceEvent[],
  expected: NormalizedTraceEvent[]
): void {
  const normalized = normalizeTraces(actual);
  const result = compareTraces(normalized, expected);

  if (!result.match) {
    throw new Error(result.error);
  }
}

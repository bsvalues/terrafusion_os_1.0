/**
 * TerraFusion Golden Journey Trace Tests
 *
 * Deterministic regression tests for core user journeys.
 * Captures and validates trace sequences for:
 * - Launcher navigation flow
 * - Disabled action blocking
 * - Policy denial scenarios
 * - Multi-action sequences
 *
 * @module __tests__/trace/trace.goldenJourneys.test
 * @see Slice 18: Deterministic Replay + Golden Trace Regression
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  executeOsAction,
  setActionPolicy,
  resetActionPolicy,
  setTraceClock,
  resetTraceClock,
  type OsAction,
  type OsActionContext,
} from '../../services/osActions';
import {
  collectTracesDuringSync,
  normalizeTraces,
  assertTracesMatch,
  createMockClock,
  type NormalizedTraceEvent,
} from '../../testUtils/traceHarness';

// ============================================================================
// Test Helpers
// ============================================================================

function createContext(
  surface: OsActionContext['surface'] = 'launcher',
  suiteId = 'pilot'
): OsActionContext {
  return {
    navigate: vi.fn(),
    suiteId,
    surface,
  };
}

// ============================================================================
// Golden Fixtures
// ============================================================================

/**
 * Golden trace sequence: Launcher → Standalone Suite navigation
 */
const GOLDEN_LAUNCHER_NAV: NormalizedTraceEvent[] = [
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'nav-pilot-home',
      actionType: 'navigation',
      intent: 'standalone',
      surface: 'launcher',
      suiteId: 'pilot',
      href: '/pilot/home',
    },
  },
];

/**
 * Golden trace sequence: Disabled action → blocked trace
 */
const GOLDEN_DISABLED_BLOCK: NormalizedTraceEvent[] = [
  {
    type: 'os_action_blocked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'disabled-feature',
      actionType: 'navigation',
      intent: 'standalone',
      surface: 'standalone_home',
      suiteId: 'pilot',
      blockReason: 'disabled',
      disabledReason: 'Feature requires license upgrade',
    },
  },
];

/**
 * Golden trace sequence: Policy denial → blocked with reason
 */
const GOLDEN_POLICY_DENIAL: NormalizedTraceEvent[] = [
  {
    type: 'os_action_blocked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'admin-only-action',
      actionType: 'handler',
      intent: 'system',
      surface: 'workbench',
      suiteId: 'trace',
      blockReason: 'policy',
      policyReason: 'Requires admin role',
    },
  },
];

/**
 * Golden trace sequence: Multi-step journey
 * Open Launcher → choose suite → navigate to parcel
 */
const GOLDEN_MULTI_STEP_JOURNEY: NormalizedTraceEvent[] = [
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'open-launcher',
      actionType: 'handler',
      intent: 'system',
      surface: 'shellhome',
      suiteId: 'os',
      handlerKey: 'system:openLauncher',
    },
  },
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'select-pilot',
      actionType: 'navigation',
      intent: 'standalone',
      surface: 'launcher',
      suiteId: 'pilot',
      href: '/pilot/dashboard',
    },
  },
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'open-workbench',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'standalone_home',
      suiteId: 'pilot',
      href: '/pilot/workbench/costforge',
    },
  },
];

/**
 * Golden trace sequence: Mixed success and failure
 */
const GOLDEN_MIXED_SEQUENCE: NormalizedTraceEvent[] = [
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'allowed-action',
      actionType: 'navigation',
      intent: 'standalone',
      surface: 'launcher',
      suiteId: 'pilot',
      href: '/pilot/allowed',
    },
  },
  {
    type: 'os_action_blocked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'disabled-action',
      actionType: 'navigation',
      intent: 'standalone',
      surface: 'launcher',
      suiteId: 'pilot',
      blockReason: 'disabled',
    },
  },
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'another-allowed',
      actionType: 'navigation',
      intent: 'standalone',
      surface: 'launcher',
      suiteId: 'pilot',
      href: '/pilot/another',
    },
  },
];

// ============================================================================
// Golden Journey Tests
// ============================================================================

describe('Golden Journey Trace Regression', () => {
  let clockCleanup: () => void;

  beforeEach(() => {
    // Install deterministic clock before each test
    const mockClock = createMockClock(1000000000000, 100);
    clockCleanup = setTraceClock(mockClock.now);
  });

  afterEach(() => {
    clockCleanup();
    resetTraceClock();
    resetActionPolicy();
  });

  describe('Journey 1: Launcher Navigation', () => {
    it('produces deterministic trace sequence for launcher → standalone nav', () => {
      const action: OsAction = {
        id: 'nav-pilot-home',
        label: 'Pilot Home',
        intent: 'standalone',
        href: '/pilot/home',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, createContext('launcher', 'pilot'));
      });

      assertTracesMatch(traces, GOLDEN_LAUNCHER_NAV);
    });

    it('normalized traces are timestamp-agnostic', () => {
      const action: OsAction = {
        id: 'nav-pilot-home',
        label: 'Pilot Home',
        intent: 'standalone',
        href: '/pilot/home',
      };

      const { traces: traces1 } = collectTracesDuringSync(() => {
        executeOsAction(action, createContext('launcher', 'pilot'));
      });

      // Run again with different clock
      clockCleanup();
      const newClock = createMockClock(9999999999999, 500);
      clockCleanup = setTraceClock(newClock.now);

      const { traces: traces2 } = collectTracesDuringSync(() => {
        executeOsAction(action, createContext('launcher', 'pilot'));
      });

      // Both should normalize to same golden
      const normalized1 = normalizeTraces(traces1);
      const normalized2 = normalizeTraces(traces2);

      expect(normalized1).toEqual(normalized2);
    });
  });

  describe('Journey 2: Disabled Action Blocking', () => {
    it('produces deterministic blocked trace for disabled action', () => {
      const action: OsAction = {
        id: 'disabled-feature',
        label: 'Disabled Feature',
        intent: 'standalone',
        href: '/pilot/disabled',
        disabled: true,
        disabledReason: 'Feature requires license upgrade',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, createContext('standalone_home', 'pilot'));
      });

      assertTracesMatch(traces, GOLDEN_DISABLED_BLOCK);
    });

    it('disabled action does not emit invoked trace', () => {
      const action: OsAction = {
        id: 'disabled-feature',
        label: 'Disabled Feature',
        intent: 'standalone',
        href: '/pilot/disabled',
        disabled: true,
        disabledReason: 'Feature requires license upgrade',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, createContext('standalone_home', 'pilot'));
      });

      expect(traces).toHaveLength(1);
      expect(traces[0].type).toBe('os_action_blocked');
    });
  });

  describe('Journey 3: Policy Denial', () => {
    it('produces deterministic blocked trace for policy denial', () => {
      // Set up policy that denies admin-only actions
      setActionPolicy({
        canExecute: (action) => {
          if (action.id === 'admin-only-action') {
            return { allowed: false, reason: 'Requires admin role' };
          }
          return { allowed: true };
        },
      });

      const action: OsAction = {
        id: 'admin-only-action',
        label: 'Admin Action',
        intent: 'system',
        handlerKey: 'system:adminAction',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, createContext('workbench', 'trace'));
      });

      assertTracesMatch(traces, GOLDEN_POLICY_DENIAL);
    });

    it('policy allowed action produces invoked trace', () => {
      setActionPolicy({
        canExecute: () => ({ allowed: true }),
      });

      const action: OsAction = {
        id: 'allowed-action',
        label: 'Allowed',
        intent: 'standalone',
        href: '/allowed',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, createContext('launcher', 'pilot'));
      });

      expect(traces).toHaveLength(1);
      expect(traces[0].type).toBe('os_action_invoked');
    });
  });

  describe('Journey 4: Multi-Step Flow', () => {
    it('produces deterministic trace sequence for multi-action journey', () => {
      const actions: Array<{ action: OsAction; context: OsActionContext }> = [
        {
          action: {
            id: 'open-launcher',
            label: 'Open Launcher',
            intent: 'system',
            handlerKey: 'system:openLauncher',
          },
          context: createContext('shellhome', 'os'),
        },
        {
          action: {
            id: 'select-pilot',
            label: 'Select Pilot',
            intent: 'standalone',
            href: '/pilot/dashboard',
          },
          context: createContext('launcher', 'pilot'),
        },
        {
          action: {
            id: 'open-workbench',
            label: 'Open Workbench',
            intent: 'workbench',
            href: '/pilot/workbench/costforge',
          },
          context: createContext('standalone_home', 'pilot'),
        },
      ];

      const { traces } = collectTracesDuringSync(() => {
        for (const { action, context } of actions) {
          executeOsAction(action, context);
        }
      });

      assertTracesMatch(traces, GOLDEN_MULTI_STEP_JOURNEY);
    });

    it('trace ordering is stable', () => {
      const actions = [
        { id: 'first', label: 'First', intent: 'standalone' as const, href: '/first' },
        { id: 'second', label: 'Second', intent: 'standalone' as const, href: '/second' },
        { id: 'third', label: 'Third', intent: 'standalone' as const, href: '/third' },
      ];

      const { traces } = collectTracesDuringSync(() => {
        for (const action of actions) {
          executeOsAction(action, createContext('launcher', 'pilot'));
        }
      });

      const actionIds = traces.map((t) => t.payload.actionId);
      expect(actionIds).toEqual(['first', 'second', 'third']);
    });
  });

  describe('Journey 5: Mixed Success and Failure', () => {
    it('produces correct sequence of invoked and blocked traces', () => {
      const actions: OsAction[] = [
        { id: 'allowed-action', label: 'Allowed', intent: 'standalone', href: '/pilot/allowed' },
        { id: 'disabled-action', label: 'Disabled', intent: 'standalone', href: '/pilot/disabled', disabled: true },
        { id: 'another-allowed', label: 'Another', intent: 'standalone', href: '/pilot/another' },
      ];

      const { traces } = collectTracesDuringSync(() => {
        for (const action of actions) {
          executeOsAction(action, createContext('launcher', 'pilot'));
        }
      });

      assertTracesMatch(traces, GOLDEN_MIXED_SEQUENCE);
    });

    it('blocked traces do not interrupt sequence', () => {
      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(
          { id: 'a', label: 'A', intent: 'standalone', href: '/a' },
          createContext('launcher', 'pilot')
        );
        executeOsAction(
          { id: 'b', label: 'B', intent: 'standalone', href: '/b', disabled: true },
          createContext('launcher', 'pilot')
        );
        executeOsAction(
          { id: 'c', label: 'C', intent: 'standalone', href: '/c' },
          createContext('launcher', 'pilot')
        );
      });

      expect(traces).toHaveLength(3);
      expect(traces.map((t) => t.type)).toEqual([
        'os_action_invoked',
        'os_action_blocked',
        'os_action_invoked',
      ]);
    });
  });

  describe('Stability guarantees', () => {
    it('deterministic clock produces consistent timestamps', () => {
      const action: OsAction = {
        id: 'test',
        label: 'Test',
        intent: 'standalone',
        href: '/test',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, createContext());
      });

      // With mock clock starting at 1000000000000, first event should have that timestamp
      expect(traces[0].timestamp).toBe(1000000000000);
    });

    it('multiple actions have incrementing timestamps', () => {
      const actions: OsAction[] = [
        { id: 'a', label: 'A', intent: 'standalone', href: '/a' },
        { id: 'b', label: 'B', intent: 'standalone', href: '/b' },
        { id: 'c', label: 'C', intent: 'standalone', href: '/c' },
      ];

      const { traces } = collectTracesDuringSync(() => {
        for (const action of actions) {
          executeOsAction(action, createContext());
        }
      });

      // Mock clock increments by 100 each call
      expect(traces[0].timestamp).toBe(1000000000000);
      expect(traces[1].timestamp).toBe(1000000000100);
      expect(traces[2].timestamp).toBe(1000000000200);
    });

    it('trace order matches execution order', () => {
      const ids = ['first', 'second', 'third', 'fourth', 'fifth'];

      const { traces } = collectTracesDuringSync(() => {
        for (const id of ids) {
          executeOsAction(
            { id, label: id, intent: 'standalone', href: `/${id}` },
            createContext()
          );
        }
      });

      const collectedIds = traces.map((t) => t.payload.actionId);
      expect(collectedIds).toEqual(ids);
    });
  });
});

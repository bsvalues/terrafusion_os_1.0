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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    emitTrace,
    executeOsAction,
    resetActionPolicy,
    resetTraceClock,
    setActionPolicy,
    setTraceClock,
    type OsAction,
    type OsActionContext,
} from '../../services/osActions';
import { compilePolicyRules } from '../../services/policyEngine';
import {
    assertTracesMatch,
    collectTracesDuringSync,
    createMockClock,
    normalizeTraces,
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

/**
 * Golden trace sequence: Standalone → Workbench → Tab Switch
 * Simulates: User navigates to parcel, then switches tabs within workbench
 */
const GOLDEN_STANDALONE_TO_WORKBENCH_TAB_SWITCH: NormalizedTraceEvent[] = [
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'open-parcel-workbench',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'standalone_home',
      suiteId: 'forge',
      parcelIdHash: 'NORMALIZED',
      href: '/property/12345-001',
    },
  },
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'workbench_tab_switch',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'workbench',
      suiteId: 'workbench',
      moduleId: 'workbench_tabs',
      parcelIdHash: 'NORMALIZED',
      tabId: 'atlas',
      href: '/property/12345-001/atlas',
    },
  },
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'workbench_tab_switch',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'workbench',
      suiteId: 'workbench',
      moduleId: 'workbench_tabs',
      parcelIdHash: 'NORMALIZED',
      tabId: 'dossier',
      href: '/property/12345-001/dossier',
    },
  },
];

/**
 * Golden trace sequence: Launcher → Workbench → Tab Interaction
 * Simulates: User opens workbench from launcher, then interacts with tabs
 */
const GOLDEN_LAUNCHER_TO_WORKBENCH_INTERACTION: NormalizedTraceEvent[] = [
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'launcher-to-workbench',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'launcher',
      suiteId: 'forge',
      href: '/property/99999-002/forge',
    },
  },
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'workbench_tab_switch',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'workbench',
      suiteId: 'workbench',
      moduleId: 'workbench_tabs',
      parcelIdHash: 'NORMALIZED',
      tabId: 'pilot',
      href: '/property/99999-002/pilot',
    },
  },
];

/**
 * Golden trace sequence: ResultPanel Interaction (Slice 21)
 * Simulates: User expands dev info, copies correlationId, dismisses error
 */
const GOLDEN_RESULT_PANEL_INTERACTION: NormalizedTraceEvent[] = [
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'result_panel_dev_info_expand',
      actionType: 'handler',
      intent: 'workbench',
      surface: 'workbench',
      suiteId: 'result_panel',
      moduleId: 'result_panel',
      handlerKey: 'result_panel:result_panel_dev_info_expand',
      resultType: 'valuation_result',
    },
  },
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'result_panel_copy_correlation_id',
      actionType: 'handler',
      intent: 'workbench',
      surface: 'workbench',
      suiteId: 'result_panel',
      moduleId: 'result_panel',
      handlerKey: 'result_panel:result_panel_copy_correlation_id',
      resultType: 'valuation_result',
    },
  },
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'result_panel_dev_info_collapse',
      actionType: 'handler',
      intent: 'workbench',
      surface: 'workbench',
      suiteId: 'result_panel',
      moduleId: 'result_panel',
      handlerKey: 'result_panel:result_panel_dev_info_collapse',
      resultType: 'valuation_result',
    },
  },
];

/**
 * Golden trace sequence: Trace Jump Navigation (Slice 22)
 * Simulates: User clicks Jump button from TerraTrace to navigate to workbench
 */
const GOLDEN_TRACE_JUMP_NAVIGATION: NormalizedTraceEvent[] = [
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'jump-workbench-forge',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'trace',
      suiteId: 'trace',
      href: '/property/12345-001/forge',
    },
  },
];

/**
 * Golden trace sequence: Policy block → reset → allow
 * Slice 24: Full policy control loop
 *
 * 1. Add deny rule
 * 2. Attempt action → blocked by policy
 * 3. Reset policy
 * 4. Retry action → now allowed
 */
const GOLDEN_POLICY_BLOCK_RESET: NormalizedTraceEvent[] = [
  {
    type: 'policy_updated',
    timestamp: 'NORMALIZED',
    payload: {
      ruleCount: 1,
      rulesHash: 'HASH_NORMALIZED',
      addedRuleId: 'RULE_ID_NORMALIZED',
    },
  },
  {
    type: 'os_action_blocked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'restricted-action',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'launcher',
      suiteId: 'forge',
      blockReason: 'policy',
      policyReason: 'Operator denied this action',
    },
  },
  {
    type: 'policy_reset',
    timestamp: 'NORMALIZED',
    payload: {
      previousRuleCount: 1,
    },
  },
  {
    type: 'os_action_invoked',
    timestamp: 'NORMALIZED',
    payload: {
      actionId: 'restricted-action',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'launcher',
      suiteId: 'forge',
      href: '/property/99999-001/forge',
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
        {
          id: 'disabled-action',
          label: 'Disabled',
          intent: 'standalone',
          href: '/pilot/disabled',
          disabled: true,
        },
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
          executeOsAction({ id, label: id, intent: 'standalone', href: `/${id}` }, createContext());
        }
      });

      const collectedIds = traces.map((t) => t.payload.actionId);
      expect(collectedIds).toEqual(ids);
    });
  });

  // ==========================================================================
  // Slice 19: Workbench Interaction Journeys
  // ==========================================================================

  describe('Journey 6: Standalone → Workbench → Tab Switch', () => {
    it('produces deterministic trace sequence for parcel navigation and tab switching', () => {
      // Simulated context with workbench surface and tabId
      function createWorkbenchContext(tabId: string): OsActionContext {
        return {
          navigate: vi.fn(),
          suiteId: 'workbench',
          surface: 'workbench',
          moduleId: 'workbench_tabs',
          parcelIdHash: 'hash_abc123',
          tabId,
        };
      }

      const actions: Array<{ action: OsAction; context: OsActionContext }> = [
        {
          action: {
            id: 'open-parcel-workbench',
            label: 'Open Property',
            intent: 'workbench',
            href: '/property/12345-001',
          },
          context: {
            navigate: vi.fn(),
            suiteId: 'forge',
            surface: 'standalone_home',
            parcelIdHash: 'hash_abc123',
          },
        },
        {
          action: {
            id: 'workbench_tab_switch',
            label: 'Switch to Atlas',
            intent: 'workbench',
            href: '/property/12345-001/atlas',
          },
          context: createWorkbenchContext('atlas'),
        },
        {
          action: {
            id: 'workbench_tab_switch',
            label: 'Switch to Dossier',
            intent: 'workbench',
            href: '/property/12345-001/dossier',
          },
          context: createWorkbenchContext('dossier'),
        },
      ];

      const { traces } = collectTracesDuringSync(() => {
        for (const { action, context } of actions) {
          executeOsAction(action, context);
        }
      });

      assertTracesMatch(traces, GOLDEN_STANDALONE_TO_WORKBENCH_TAB_SWITCH);
    });

    it('workbench tab switch includes tabId in payload', () => {
      const action: OsAction = {
        id: 'workbench_tab_switch',
        label: 'Switch Tab',
        intent: 'workbench',
        href: '/property/12345/forge',
      };

      const context: OsActionContext = {
        navigate: vi.fn(),
        suiteId: 'workbench',
        surface: 'workbench',
        moduleId: 'workbench_tabs',
        parcelIdHash: 'hash_test',
        tabId: 'forge',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, context);
      });

      expect(traces).toHaveLength(1);
      expect(traces[0].type).toBe('os_action_invoked');
      expect((traces[0].payload as Record<string, unknown>).tabId).toBe('forge');
      expect(traces[0].payload.moduleId).toBe('workbench_tabs');
    });
  });

  describe('Journey 7: Launcher → Workbench → Tab Interaction', () => {
    it('produces deterministic trace sequence for launcher to workbench workflow', () => {
      const actions: Array<{ action: OsAction; context: OsActionContext }> = [
        {
          action: {
            id: 'launcher-to-workbench',
            label: 'Open Forge',
            intent: 'workbench',
            href: '/property/99999-002/forge',
          },
          context: {
            navigate: vi.fn(),
            suiteId: 'forge',
            surface: 'launcher',
          },
        },
        {
          action: {
            id: 'workbench_tab_switch',
            label: 'Switch to Pilot',
            intent: 'workbench',
            href: '/property/99999-002/pilot',
          },
          context: {
            navigate: vi.fn(),
            suiteId: 'workbench',
            surface: 'workbench',
            moduleId: 'workbench_tabs',
            parcelIdHash: 'hash_99999002',
            tabId: 'pilot',
          },
        },
      ];

      const { traces } = collectTracesDuringSync(() => {
        for (const { action, context } of actions) {
          executeOsAction(action, context);
        }
      });

      assertTracesMatch(traces, GOLDEN_LAUNCHER_TO_WORKBENCH_INTERACTION);
    });

    it('parcelIdHash is normalized for deterministic comparison', () => {
      const actionsWithDifferentHashes = [
        {
          action: {
            id: 'workbench_tab_switch',
            label: 'Switch Tab',
            intent: 'workbench' as const,
            href: '/property/12345/forge',
          },
          context: {
            navigate: vi.fn(),
            suiteId: 'workbench',
            surface: 'workbench' as const,
            parcelIdHash: 'hash_different_parcel_1',
            tabId: 'forge',
          },
        },
        {
          action: {
            id: 'workbench_tab_switch',
            label: 'Switch Tab',
            intent: 'workbench' as const,
            href: '/property/54321/forge',
          },
          context: {
            navigate: vi.fn(),
            suiteId: 'workbench',
            surface: 'workbench' as const,
            parcelIdHash: 'hash_different_parcel_2',
            tabId: 'forge',
          },
        },
      ];

      const { traces: traces1 } = collectTracesDuringSync(() => {
        executeOsAction(
          actionsWithDifferentHashes[0].action,
          actionsWithDifferentHashes[0].context
        );
      });

      const { traces: traces2 } = collectTracesDuringSync(() => {
        executeOsAction(
          actionsWithDifferentHashes[1].action,
          actionsWithDifferentHashes[1].context
        );
      });

      const normalized1 = normalizeTraces(traces1);
      const normalized2 = normalizeTraces(traces2);

      // Both should normalize parcelIdHash to 'NORMALIZED'
      expect((normalized1[0].payload as Record<string, unknown>).parcelIdHash).toBe('NORMALIZED');
      expect((normalized2[0].payload as Record<string, unknown>).parcelIdHash).toBe('NORMALIZED');
    });
  });

  // ==========================================================================
  // Slice 21: ResultPanel Interaction Journey
  // ==========================================================================

  describe('Journey 8: ResultPanel Interactions', () => {
    it('produces deterministic trace sequence for ResultPanel expand/copy/collapse', () => {
      function createResultPanelContext(resultType: string): OsActionContext {
        const ctx: OsActionContext & { resultType?: string } = {
          navigate: vi.fn(),
          suiteId: 'result_panel',
          surface: 'workbench',
          moduleId: 'result_panel',
        };
        ctx.resultType = resultType;
        return ctx;
      }

      const actions: Array<{ action: OsAction; context: OsActionContext }> = [
        {
          action: {
            id: 'result_panel_dev_info_expand',
            label: 'Expand Dev Info',
            intent: 'workbench',
            handlerKey: 'result_panel:result_panel_dev_info_expand',
          },
          context: createResultPanelContext('valuation_result'),
        },
        {
          action: {
            id: 'result_panel_copy_correlation_id',
            label: 'Copy CorrelationId',
            intent: 'workbench',
            handlerKey: 'result_panel:result_panel_copy_correlation_id',
          },
          context: createResultPanelContext('valuation_result'),
        },
        {
          action: {
            id: 'result_panel_dev_info_collapse',
            label: 'Collapse Dev Info',
            intent: 'workbench',
            handlerKey: 'result_panel:result_panel_dev_info_collapse',
          },
          context: createResultPanelContext('valuation_result'),
        },
      ];

      const { traces } = collectTracesDuringSync(() => {
        for (const { action, context } of actions) {
          executeOsAction(action, context);
        }
      });

      assertTracesMatch(traces, GOLDEN_RESULT_PANEL_INTERACTION);
    });

    it('resultType is included in trace payload for ResultPanel actions', () => {
      const action: OsAction = {
        id: 'result_panel_copy_correlation_id',
        label: 'Copy',
        intent: 'workbench',
        handlerKey: 'result_panel:result_panel_copy_correlation_id',
      };

      const context: OsActionContext & { resultType?: string } = {
        navigate: vi.fn(),
        suiteId: 'result_panel',
        surface: 'workbench',
        moduleId: 'result_panel',
        resultType: 'explanation_result',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, context);
      });

      expect(traces).toHaveLength(1);
      expect(traces[0].type).toBe('os_action_invoked');
      expect((traces[0].payload as Record<string, unknown>).resultType).toBe('explanation_result');
    });

    it('ResultPanel traces without resultType work correctly', () => {
      const action: OsAction = {
        id: 'result_panel_dismiss_error',
        label: 'Dismiss',
        intent: 'workbench',
        handlerKey: 'result_panel:result_panel_dismiss_error',
      };

      const context: OsActionContext = {
        navigate: vi.fn(),
        suiteId: 'result_panel',
        surface: 'workbench',
        moduleId: 'result_panel',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, context);
      });

      expect(traces).toHaveLength(1);
      expect(traces[0].type).toBe('os_action_invoked');
      expect((traces[0].payload as Record<string, unknown>).resultType).toBeUndefined();
    });
  });

  // ==========================================================================
  // Slice 22: Trace Jump Navigation Journey
  // ==========================================================================

  describe('Journey 9: Trace → Jump to Workbench', () => {
    it('produces deterministic trace sequence for Jump action from TerraTrace', () => {
      // Simulates clicking Jump button from trace viewer
      const action: OsAction = {
        id: 'jump-workbench-forge',
        label: 'Open Workbench: Forge',
        intent: 'workbench',
        href: '/property/12345-001/forge',
      };

      const context: OsActionContext = {
        navigate: vi.fn(),
        suiteId: 'trace',
        surface: 'trace',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, context);
      });

      assertTracesMatch(traces, GOLDEN_TRACE_JUMP_NAVIGATION);
    });

    it('Jump action from trace surface emits os_action_invoked', () => {
      const action: OsAction = {
        id: 'jump-workbench-atlas',
        label: 'Open Workbench: Atlas',
        intent: 'workbench',
        href: '/property/99999-002/atlas',
      };

      const context: OsActionContext = {
        navigate: vi.fn(),
        suiteId: 'trace',
        surface: 'trace',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, context);
      });

      expect(traces).toHaveLength(1);
      expect(traces[0].type).toBe('os_action_invoked');
      expect(traces[0].payload.surface).toBe('trace');
      expect(traces[0].payload.actionId).toBe('jump-workbench-atlas');
    });

    it('Jump action with standalone intent emits correct trace', () => {
      const action: OsAction = {
        id: 'jump-standalone-pilot',
        label: 'Open Suite Home: Pilot',
        intent: 'standalone',
        href: '/pilot/home',
      };

      const context: OsActionContext = {
        navigate: vi.fn(),
        suiteId: 'trace',
        surface: 'trace',
      };

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, context);
      });

      expect(traces).toHaveLength(1);
      expect(traces[0].payload.intent).toBe('standalone');
      expect(traces[0].payload.href).toBe('/pilot/home');
    });
  });

  // ==========================================================================
  // Slice 24: Policy Block → Reset → Allow Journey
  // ==========================================================================

  describe('Journey 10: Policy Control Loop', () => {
    it('produces deterministic trace for policy block → reset → allow', () => {
      const action: OsAction = {
        id: 'restricted-action',
        label: 'Restricted Action',
        intent: 'workbench',
        href: '/property/99999-001/forge',
      };

      const context: OsActionContext = {
        navigate: vi.fn(),
        suiteId: 'forge',
        surface: 'launcher',
      };

      // Collect all traces from the full journey
      const { traces } = collectTracesDuringSync(() => {
        // Step 1: Add deny rule (simulates PolicyPanel.addRule)
        emitTrace({
          type: 'policy_updated',
          timestamp: Date.now(),
          payload: {
            ruleCount: 1,
            rulesHash: 'test-hash-123',
            addedRuleId: 'deny-rule-1',
          },
        });

        // Set policy to deny this action
        setActionPolicy(
          compilePolicyRules([
            {
              id: 'deny-rule-1',
              effect: 'deny',
              actionId: 'restricted-action',
              reason: 'Operator denied this action',
            },
          ])
        );

        // Step 2: Attempt action → should be blocked
        executeOsAction(action, context);

        // Step 3: Reset policy (simulates PolicyPanel.resetPolicy)
        emitTrace({
          type: 'policy_reset',
          timestamp: Date.now(),
          payload: {
            previousRuleCount: 1,
          },
        });
        resetActionPolicy();

        // Step 4: Retry action → should succeed
        executeOsAction(action, context);
      });

      // Match against golden fixture (normalized)
      assertTracesMatch(traces, GOLDEN_POLICY_BLOCK_RESET);
    });

    it('policy block trace includes policyReason from deny rule', () => {
      const action: OsAction = {
        id: 'admin-panel',
        label: 'Admin Panel',
        intent: 'standalone',
        href: '/admin',
      };

      const context: OsActionContext = {
        navigate: vi.fn(),
        suiteId: 'admin',
        surface: 'launcher',
      };

      // Set policy with custom reason
      setActionPolicy(
        compilePolicyRules([
          {
            id: 'deny-admin',
            effect: 'deny',
            actionId: 'admin-panel',
            reason: 'Requires admin role',
          },
        ])
      );

      const { traces } = collectTracesDuringSync(() => {
        executeOsAction(action, context);
      });

      expect(traces).toHaveLength(1);
      expect(traces[0].type).toBe('os_action_blocked');
      expect(traces[0].payload.blockReason).toBe('policy');
      expect(traces[0].payload.policyReason).toBe('Requires admin role');
    });

    it('reset policy allows previously blocked action', () => {
      const action: OsAction = {
        id: 'forge-launch',
        label: 'Launch Forge',
        intent: 'workbench',
        href: '/property/12345-001/forge',
      };

      const context: OsActionContext = {
        navigate: vi.fn(),
        suiteId: 'forge',
        surface: 'launcher',
      };

      // Block action with policy
      setActionPolicy(
        compilePolicyRules([
          {
            id: 'block-forge',
            effect: 'deny',
            actionId: 'forge-launch',
            reason: 'Maintenance mode',
          },
        ])
      );

      const { traces: blockedTraces } = collectTracesDuringSync(() => {
        executeOsAction(action, context);
      });

      expect(blockedTraces).toHaveLength(1);
      expect(blockedTraces[0].type).toBe('os_action_blocked');

      // Reset policy and retry
      resetActionPolicy();

      const { traces: allowedTraces } = collectTracesDuringSync(() => {
        executeOsAction(action, context);
      });

      expect(allowedTraces).toHaveLength(1);
      expect(allowedTraces[0].type).toBe('os_action_invoked');
      expect(allowedTraces[0].payload.actionId).toBe('forge-launch');
    });
  });
});

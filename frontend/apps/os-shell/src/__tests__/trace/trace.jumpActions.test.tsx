/**
 * TerraFusion Jump-to-Surface Action Tests
 *
 * Tests for trace-to-UI correlation: Jump button affordances that
 * convert trace events into navigable OS actions.
 *
 * @module __tests__/trace/trace.jumpActions.test
 * @see Slice 22: Trace-to-UI Correlation + Deep Link Replay
 */

import { describe, expect, it, vi } from 'vitest';
import { executeOsAction, type OsActionContext } from '../../services/osActions';
import { collectTracesDuringSync } from '../../testUtils/traceHarness';
import { traceToOsAction } from '../../components/Trace/traceToOsAction';
import type { ActionStreamEvent } from '../../hooks/useActionStream';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockNavigate() {
  return vi.fn();
}

function createTraceContext(suiteId = 'trace'): OsActionContext {
  return {
    navigate: createMockNavigate(),
    suiteId,
    surface: 'trace',
  };
}

// ============================================================================
// Mapper Tests
// ============================================================================

describe('traceToOsAction mapper', () => {
  describe('workbench traces', () => {
    it('converts workbench trace with tabId to navigation action', () => {
      const event: ActionStreamEvent = {
        id: 'event-1',
        type: 'invoked',
        timestamp: Date.now(),
        actionId: 'workbench_tab_switch',
        actionType: 'navigation',
        intent: 'workbench',
        surface: 'workbench',
        suiteId: 'workbench',
        moduleId: 'workbench_tabs',
        parcelIdHash: 'hash_abc123',
        tabId: 'forge',
        href: '/property/12345-001/forge',
      };

      const action = traceToOsAction(event);

      expect(action).toBeDefined();
      expect(action?.id).toBe('jump-workbench-forge');
      expect(action?.label).toContain('Workbench');
      expect(action?.intent).toBe('workbench');
      expect(action?.href).toBe('/property/12345-001/forge');
    });

    it('converts workbench trace without tabId to generic workbench action', () => {
      const event: ActionStreamEvent = {
        id: 'event-2',
        type: 'invoked',
        timestamp: Date.now(),
        actionId: 'open-parcel-workbench',
        actionType: 'navigation',
        intent: 'workbench',
        surface: 'standalone_home',
        suiteId: 'forge',
        parcelIdHash: 'hash_def456',
        href: '/property/99999-002',
      };

      const action = traceToOsAction(event);

      expect(action).toBeDefined();
      expect(action?.id).toContain('jump-workbench');
      expect(action?.intent).toBe('workbench');
      expect(action?.href).toBe('/property/99999-002');
    });

    it('returns null for workbench trace without href', () => {
      const event: ActionStreamEvent = {
        id: 'event-3',
        type: 'invoked',
        timestamp: Date.now(),
        actionId: 'workbench_handler',
        actionType: 'handler',
        intent: 'workbench',
        surface: 'workbench',
        suiteId: 'workbench',
        handlerKey: 'some:handler',
      };

      const action = traceToOsAction(event);

      // Handler-based workbench actions are not navigable
      expect(action).toBeNull();
    });
  });

  describe('standalone traces', () => {
    it('converts standalone trace to navigation action', () => {
      const event: ActionStreamEvent = {
        id: 'event-4',
        type: 'invoked',
        timestamp: Date.now(),
        actionId: 'nav-pilot-home',
        actionType: 'navigation',
        intent: 'standalone',
        surface: 'launcher',
        suiteId: 'pilot',
        href: '/pilot/home',
      };

      const action = traceToOsAction(event);

      expect(action).toBeDefined();
      expect(action?.id).toBe('jump-standalone-pilot');
      expect(action?.label).toContain('Suite Home');
      expect(action?.intent).toBe('standalone');
      expect(action?.href).toBe('/pilot/home');
    });

    it('returns null for standalone trace without href', () => {
      const event: ActionStreamEvent = {
        id: 'event-5',
        type: 'invoked',
        timestamp: Date.now(),
        actionId: 'handler-action',
        actionType: 'handler',
        intent: 'standalone',
        surface: 'standalone_home',
        suiteId: 'pilot',
        handlerKey: 'pilot:someHandler',
      };

      const action = traceToOsAction(event);

      expect(action).toBeNull();
    });
  });

  describe('blocked traces', () => {
    it('converts blocked workbench trace to action (disabled reason preserved)', () => {
      const event: ActionStreamEvent = {
        id: 'event-6',
        type: 'blocked',
        timestamp: Date.now(),
        actionId: 'disabled-workbench',
        actionType: 'navigation',
        intent: 'workbench',
        surface: 'workbench',
        suiteId: 'workbench',
        href: '/property/12345/forge',
        blockReason: 'disabled',
        blockReasonDetail: 'Feature requires license upgrade',
      };

      const action = traceToOsAction(event);

      expect(action).toBeDefined();
      expect(action?.disabled).toBe(true);
      expect(action?.disabledReason).toBe('Feature requires license upgrade');
      expect(action?.href).toBe('/property/12345/forge');
    });

    it('converts blocked standalone trace to action (policy reason preserved)', () => {
      const event: ActionStreamEvent = {
        id: 'event-7',
        type: 'blocked',
        timestamp: Date.now(),
        actionId: 'policy-denied',
        actionType: 'navigation',
        intent: 'standalone',
        surface: 'launcher',
        suiteId: 'pilot',
        href: '/pilot/admin',
        blockReason: 'policy',
        blockReasonDetail: 'Requires admin role',
      };

      const action = traceToOsAction(event);

      expect(action).toBeDefined();
      expect(action?.disabled).toBe(true);
      expect(action?.disabledReason).toBe('Blocked by policy: Requires admin role');
    });
  });

  describe('non-navigable traces', () => {
    it('returns null for handler-only actions', () => {
      const event: ActionStreamEvent = {
        id: 'event-8',
        type: 'invoked',
        timestamp: Date.now(),
        actionId: 'system-handler',
        actionType: 'handler',
        intent: 'system',
        surface: 'shellhome',
        suiteId: 'os',
        handlerKey: 'system:openLauncher',
      };

      const action = traceToOsAction(event);

      expect(action).toBeNull();
    });

    it('returns null for launcher surface without href', () => {
      const event: ActionStreamEvent = {
        id: 'event-9',
        type: 'invoked',
        timestamp: Date.now(),
        actionId: 'launcher-action',
        actionType: 'handler',
        intent: 'system',
        surface: 'launcher',
        suiteId: 'os',
        handlerKey: 'launcher:open',
      };

      const action = traceToOsAction(event);

      expect(action).toBeNull();
    });
  });

  describe('PII safety', () => {
    it('does not expose parcelIdHash in action label or description', () => {
      const event: ActionStreamEvent = {
        id: 'event-10',
        type: 'invoked',
        timestamp: Date.now(),
        actionId: 'workbench_tab_switch',
        actionType: 'navigation',
        intent: 'workbench',
        surface: 'workbench',
        suiteId: 'workbench',
        parcelIdHash: 'hash_sensitive_123',
        tabId: 'forge',
        href: '/property/12345-001/forge',
      };

      const action = traceToOsAction(event);

      expect(action).toBeDefined();
      expect(action?.label).not.toContain('hash_sensitive_123');
      expect(action?.description).not.toContain('hash_sensitive_123');
    });

    it('uses existing href without modification (no direct parcel ID exposure)', () => {
      const event: ActionStreamEvent = {
        id: 'event-11',
        type: 'invoked',
        timestamp: Date.now(),
        actionId: 'workbench_nav',
        actionType: 'navigation',
        intent: 'workbench',
        surface: 'workbench',
        suiteId: 'workbench',
        parcelIdHash: 'hash_abc',
        href: '/property/existing-route',
      };

      const action = traceToOsAction(event);

      expect(action).toBeDefined();
      expect(action?.href).toBe('/property/existing-route');
    });
  });
});

// ============================================================================
// Jump Action Execution Tests
// ============================================================================

describe('Jump action execution', () => {
  it('Jump from workbench trace emits trace with surface=trace', () => {
    const event: ActionStreamEvent = {
      id: 'event-12',
      type: 'invoked',
      timestamp: Date.now(),
      actionId: 'workbench_tab_switch',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'workbench',
      suiteId: 'workbench',
      tabId: 'forge',
      href: '/property/12345/forge',
    };

    const action = traceToOsAction(event);
    const context = createTraceContext();

    expect(action).toBeDefined();

    const { traces } = collectTracesDuringSync(() => {
      executeOsAction(action!, context);
    });

    expect(traces).toHaveLength(1);
    expect(traces[0].type).toBe('os_action_invoked');
    expect(traces[0].payload.surface).toBe('trace');
    expect(traces[0].payload.actionId).toContain('jump-workbench');
  });

  it('Jump from standalone trace emits trace with correct suiteId', () => {
    const event: ActionStreamEvent = {
      id: 'event-13',
      type: 'invoked',
      timestamp: Date.now(),
      actionId: 'nav-pilot-home',
      actionType: 'navigation',
      intent: 'standalone',
      surface: 'launcher',
      suiteId: 'pilot',
      href: '/pilot/home',
    };

    const action = traceToOsAction(event);
    const context = createTraceContext();

    expect(action).toBeDefined();

    const { traces } = collectTracesDuringSync(() => {
      executeOsAction(action!, context);
    });

    expect(traces).toHaveLength(1);
    expect(traces[0].payload.suiteId).toBe('trace');
  });

  it('Jump action navigates to correct href', () => {
    const event: ActionStreamEvent = {
      id: 'event-14',
      type: 'invoked',
      timestamp: Date.now(),
      actionId: 'workbench_nav',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'workbench',
      suiteId: 'workbench',
      href: '/property/99999/forge',
    };

    const action = traceToOsAction(event);
    const navigate = createMockNavigate();
    const context: OsActionContext = {
      navigate,
      suiteId: 'trace',
      surface: 'trace',
    };

    expect(action).toBeDefined();

    executeOsAction(action!, context);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/property/99999/forge');
  });
});

// ============================================================================
// History Mode Tests
// ============================================================================

describe('Jump actions in History mode', () => {
  it('converts stored workbench event to Jump action', () => {
    const event: ActionStreamEvent = {
      id: 'stored-event-1',
      type: 'invoked',
      timestamp: Date.now() - 3600000, // 1 hour ago
      actionId: 'workbench_tab_switch',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'workbench',
      suiteId: 'workbench',
      tabId: 'atlas',
      href: '/property/12345/atlas',
    };

    const action = traceToOsAction(event);

    expect(action).toBeDefined();
    expect(action?.href).toBe('/property/12345/atlas');
  });

  it('converts stored standalone event to Jump action', () => {
    const event: ActionStreamEvent = {
      id: 'stored-event-2',
      type: 'invoked',
      timestamp: Date.now() - 7200000, // 2 hours ago
      actionId: 'nav-pilot-dashboard',
      actionType: 'navigation',
      intent: 'standalone',
      surface: 'launcher',
      suiteId: 'pilot',
      href: '/pilot/dashboard',
    };

    const action = traceToOsAction(event);

    expect(action).toBeDefined();
    expect(action?.href).toBe('/pilot/dashboard');
  });
});

/**
 * TerraFusion OS Action Telemetry Tests
 *
 * Enforces that action execution emits proper TerraTrace events:
 * - Navigation actions emit trace on execution
 * - Handler actions emit trace on execution
 * - Trace includes suiteId, moduleId, actionId, intent, surface
 * - Trace includes parcelIdHash when parcel context exists
 *
 * Contract: Every action execution produces an audit trail event.
 *
 * @module __tests__/osActions/osActions.telemetry.test
 * @see Slice 15: Module Action Wiring + Telemetry Truth
 */

import { describe, expect, it, vi } from 'vitest';

import {
    executeOsAction,
    OS_ACTION_EVENT_NAME,
    type OsAction,
    type OsActionTraceEvent,
} from '../../services/osActions';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockNavigate() {
  return vi.fn();
}

function createMockActionContext(overrides: Partial<Parameters<typeof executeOsAction>[1]> = {}) {
  return {
    navigate: createMockNavigate(),
    suiteId: 'pilot',
    surface: 'standalone_home' as const,
    parcelIdHash: undefined,
    ...overrides,
  };
}

function captureTraceEvents(): { events: OsActionTraceEvent[]; cleanup: () => void } {
  const events: OsActionTraceEvent[] = [];
  const handler = (e: CustomEvent<OsActionTraceEvent>) => {
    events.push(e.detail);
  };

  window.addEventListener(OS_ACTION_EVENT_NAME, handler as EventListener);

  return {
    events,
    cleanup: () => window.removeEventListener(OS_ACTION_EVENT_NAME, handler as EventListener),
  };
}

// ============================================================================
// Telemetry Tests
// ============================================================================

describe('OS Actions Telemetry', () => {
  describe('navigation action trace emission', () => {
    it('emits trace event when navigation action is executed', () => {
      const { events, cleanup } = captureTraceEvents();

      const action: OsAction = {
        id: 'view-tools',
        label: 'View Tools',
        intent: 'standalone',
        href: '/pilot/api',
      };

      const ctx = createMockActionContext();
      executeOsAction(action, ctx);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('os_action_invoked');
      expect(events[0].payload.actionId).toBe('view-tools');
      expect(events[0].payload.actionType).toBe('navigation');

      cleanup();
    });

    it('trace includes correct intent and surface', () => {
      const { events, cleanup } = captureTraceEvents();

      const action: OsAction = {
        id: 'dashboard',
        label: 'Dashboard',
        intent: 'standalone',
        href: '/pilot/dashboard',
      };

      executeOsAction(
        action,
        createMockActionContext({
          surface: 'launcher',
          suiteId: 'pilot',
        })
      );

      expect(events[0].payload.intent).toBe('standalone');
      expect(events[0].payload.surface).toBe('launcher');
      expect(events[0].payload.suiteId).toBe('pilot');

      cleanup();
    });

    it('navigation action calls navigate with correct href', () => {
      const { cleanup } = captureTraceEvents();
      const navigate = createMockNavigate();

      const action: OsAction = {
        id: 'go-home',
        label: 'Go Home',
        intent: 'standalone',
        href: '/home',
      };

      executeOsAction(action, { ...createMockActionContext(), navigate });

      expect(navigate).toHaveBeenCalledWith('/home');

      cleanup();
    });
  });

  describe('handler action trace emission', () => {
    it('emits trace event when handler action is executed', () => {
      const { events, cleanup } = captureTraceEvents();

      const action: OsAction = {
        id: 'refresh',
        label: 'Refresh',
        intent: 'system',
        handlerKey: 'system:refresh',
      };

      executeOsAction(action, createMockActionContext());

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('os_action_invoked');
      expect(events[0].payload.actionId).toBe('refresh');
      expect(events[0].payload.actionType).toBe('handler');

      cleanup();
    });

    it('trace includes handler key for handler actions', () => {
      const { events, cleanup } = captureTraceEvents();

      const action: OsAction = {
        id: 'settings',
        label: 'Settings',
        intent: 'system',
        handlerKey: 'system:openSettings',
      };

      executeOsAction(action, createMockActionContext());

      expect(events[0].payload.handlerKey).toBe('system:openSettings');

      cleanup();
    });
  });

  describe('parcel context in trace', () => {
    it('includes parcelIdHash when parcel context exists', () => {
      const { events, cleanup } = captureTraceEvents();

      const action: OsAction = {
        id: 'view',
        label: 'View',
        intent: 'workbench',
        href: '/property/123/forge',
      };

      executeOsAction(
        action,
        createMockActionContext({
          parcelIdHash: 'h-abc123',
        })
      );

      expect(events[0].payload.parcelIdHash).toBe('h-abc123');

      cleanup();
    });

    it('omits parcelIdHash when no parcel context', () => {
      const { events, cleanup } = captureTraceEvents();

      const action: OsAction = {
        id: 'view',
        label: 'View',
        intent: 'standalone',
        href: '/pilot',
      };

      executeOsAction(
        action,
        createMockActionContext({
          parcelIdHash: undefined,
        })
      );

      expect(events[0].payload.parcelIdHash).toBeUndefined();

      cleanup();
    });
  });

  describe('trace event structure', () => {
    it('trace event has timestamp', () => {
      const { events, cleanup } = captureTraceEvents();
      const before = Date.now();

      const action: OsAction = {
        id: 'test',
        label: 'Test',
        intent: 'standalone',
        href: '/test',
      };

      executeOsAction(action, createMockActionContext());

      const after = Date.now();

      expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(events[0].timestamp).toBeLessThanOrEqual(after);

      cleanup();
    });

    it('trace payload includes moduleId when provided', () => {
      const { events, cleanup } = captureTraceEvents();

      const action: OsAction = {
        id: 'refresh-metrics',
        label: 'Refresh',
        intent: 'system',
        handlerKey: 'metrics:refresh',
      };

      executeOsAction(
        action,
        createMockActionContext({
          moduleId: 'metrics-panel',
        })
      );

      expect(events[0].payload.moduleId).toBe('metrics-panel');

      cleanup();
    });
  });

  describe('disabled actions', () => {
    it('does not execute disabled navigation actions', () => {
      const { events, cleanup } = captureTraceEvents();
      const navigate = createMockNavigate();

      const action: OsAction = {
        id: 'disabled',
        label: 'Disabled',
        intent: 'standalone',
        href: '/disabled',
        disabled: true,
      };

      executeOsAction(action, { ...createMockActionContext(), navigate });

      expect(navigate).not.toHaveBeenCalled();
      expect(events.length).toBe(0);

      cleanup();
    });
  });
});

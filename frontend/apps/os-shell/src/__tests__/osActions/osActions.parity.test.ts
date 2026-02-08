/**
 * TerraFusion OS Action Parity Tests
 *
 * Enforces that all surfaces (Standalone, Launcher, ShellHome) use the
 * same OS action dispatcher and emit consistent trace events.
 *
 * Contract: Every surface routes activations through executeOsAction().
 *
 * @module __tests__/osActions/osActions.parity.test
 * @see Slice 16: Cross-Surface Action Parity
 */

import { describe, expect, it, vi } from 'vitest';

import {
    executeOsAction,
    OS_ACTION_EVENT_NAME,
    type OsAction,
    type OsActionContext,
    type OsActionTraceEvent,
} from '../../services/osActions';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockNavigate() {
  return vi.fn();
}

function createActionContext(
  surface: OsActionContext['surface'],
  suiteId = 'pilot'
): OsActionContext {
  return {
    navigate: createMockNavigate(),
    suiteId,
    surface,
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
// Surface Parity Tests
// ============================================================================

describe('OS Actions Surface Parity', () => {
  describe('standalone_home surface', () => {
    it('emits os_action_invoked trace with correct surface tag', () => {
      const { events, cleanup } = captureTraceEvents();

      const action: OsAction = {
        id: 'view-tools',
        label: 'View Tools',
        intent: 'standalone',
        href: '/pilot/tools',
      };

      executeOsAction(action, createActionContext('standalone_home'));

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('os_action_invoked');
      expect(events[0].payload.surface).toBe('standalone_home');

      cleanup();
    });
  });

  describe('launcher surface', () => {
    it('emits os_action_invoked trace with correct surface tag', () => {
      const { events, cleanup } = captureTraceEvents();

      const action: OsAction = {
        id: 'open-pilot',
        label: 'TerraPilot',
        intent: 'standalone',
        href: '/pilot',
      };

      executeOsAction(action, createActionContext('launcher'));

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('os_action_invoked');
      expect(events[0].payload.surface).toBe('launcher');

      cleanup();
    });

    it('executes navigation for launcher nav actions', () => {
      const { cleanup } = captureTraceEvents();
      const navigate = createMockNavigate();

      const action: OsAction = {
        id: 'open-trace',
        label: 'TerraTrace',
        intent: 'standalone',
        href: '/trace',
      };

      executeOsAction(action, { ...createActionContext('launcher'), navigate });

      expect(navigate).toHaveBeenCalledWith('/trace');

      cleanup();
    });
  });

  describe('shellhome surface', () => {
    it('emits os_action_invoked trace with correct surface tag', () => {
      const { events, cleanup } = captureTraceEvents();

      const action: OsAction = {
        id: 'suite-primary',
        label: 'Open Suite',
        intent: 'standalone',
        href: '/pilot',
      };

      executeOsAction(action, createActionContext('shellhome', 'shell'));

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('os_action_invoked');
      expect(events[0].payload.surface).toBe('shellhome');

      cleanup();
    });
  });

  describe('trace payload consistency', () => {
    it('all surfaces include actionId, actionType, intent, surface, suiteId', () => {
      const surfaces: OsActionContext['surface'][] = [
        'standalone_home',
        'launcher',
        'shellhome',
        'module',
        'workbench',
      ];

      const action: OsAction = {
        id: 'consistent-action',
        label: 'Consistent',
        intent: 'standalone',
        href: '/test',
      };

      for (const surface of surfaces) {
        const { events, cleanup } = captureTraceEvents();

        executeOsAction(action, createActionContext(surface));

        expect(events[0].payload.actionId).toBe('consistent-action');
        expect(events[0].payload.actionType).toBe('navigation');
        expect(events[0].payload.intent).toBe('standalone');
        expect(events[0].payload.surface).toBe(surface);
        expect(events[0].payload.suiteId).toBeTruthy();

        cleanup();
      }
    });

    it('timestamp is always present and valid', () => {
      const { events, cleanup } = captureTraceEvents();
      const before = Date.now();

      const action: OsAction = {
        id: 'timed',
        label: 'Timed',
        intent: 'standalone',
        href: '/timed',
      };

      executeOsAction(action, createActionContext('launcher'));

      const after = Date.now();

      expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(events[0].timestamp).toBeLessThanOrEqual(after);

      cleanup();
    });
  });
});

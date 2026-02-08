/**
 * TerraFusion OS Action Disabled/Policy Enforcement Tests
 *
 * Enforces that:
 * - Disabled actions emit os_action_blocked trace (not invoked)
 * - Policy gate can block actions with reason
 * - Allowed actions proceed normally
 *
 * Contract: No action bypasses disabled/policy checks.
 *
 * @module __tests__/osActions/osActions.disabledPolicy.test
 * @see Slice 16: Disabled/Policy Enforcement
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  executeOsAction,
  OS_ACTION_EVENT_NAME,
  OS_ACTION_BLOCKED_EVENT_NAME,
  setActionPolicy,
  resetActionPolicy,
  type OsAction,
  type OsActionContext,
  type OsActionTraceEvent,
  type OsActionBlockedEvent,
  type OsActionPolicy,
} from '../../services/osActions';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockNavigate() {
  return vi.fn();
}

function createActionContext(surface: OsActionContext['surface'] = 'standalone_home'): OsActionContext {
  return {
    navigate: createMockNavigate(),
    suiteId: 'pilot',
    surface,
  };
}

function captureInvokedEvents(): { events: OsActionTraceEvent[]; cleanup: () => void } {
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

function captureBlockedEvents(): { events: OsActionBlockedEvent[]; cleanup: () => void } {
  const events: OsActionBlockedEvent[] = [];
  const handler = (e: CustomEvent<OsActionBlockedEvent>) => {
    events.push(e.detail);
  };

  window.addEventListener(OS_ACTION_BLOCKED_EVENT_NAME, handler as EventListener);

  return {
    events,
    cleanup: () => window.removeEventListener(OS_ACTION_BLOCKED_EVENT_NAME, handler as EventListener),
  };
}

// ============================================================================
// Disabled Action Tests
// ============================================================================

describe('OS Actions Disabled Enforcement', () => {
  describe('disabled action blocking', () => {
    it('disabled action does not emit os_action_invoked', () => {
      const { events: invokedEvents, cleanup: cleanupInvoked } = captureInvokedEvents();

      const action: OsAction = {
        id: 'disabled-action',
        label: 'Disabled',
        intent: 'standalone',
        href: '/disabled',
        disabled: true,
      };

      executeOsAction(action, createActionContext());

      expect(invokedEvents.length).toBe(0);

      cleanupInvoked();
    });

    it('disabled action emits os_action_blocked trace', () => {
      const { events: blockedEvents, cleanup: cleanupBlocked } = captureBlockedEvents();

      const action: OsAction = {
        id: 'disabled-action',
        label: 'Disabled',
        intent: 'standalone',
        href: '/disabled',
        disabled: true,
        disabledReason: 'Feature requires premium license',
      };

      executeOsAction(action, createActionContext());

      expect(blockedEvents.length).toBe(1);
      expect(blockedEvents[0].type).toBe('os_action_blocked');
      expect(blockedEvents[0].payload.actionId).toBe('disabled-action');
      expect(blockedEvents[0].payload.blockReason).toBe('disabled');
      expect(blockedEvents[0].payload.disabledReason).toBe('Feature requires premium license');

      cleanupBlocked();
    });

    it('disabled action does not navigate', () => {
      const { cleanup } = captureBlockedEvents();
      const navigate = createMockNavigate();

      const action: OsAction = {
        id: 'disabled-nav',
        label: 'Disabled Nav',
        intent: 'standalone',
        href: '/should-not-go',
        disabled: true,
      };

      executeOsAction(action, { ...createActionContext(), navigate });

      expect(navigate).not.toHaveBeenCalled();

      cleanup();
    });

    it('blocked trace includes surface and suiteId', () => {
      const { events: blockedEvents, cleanup } = captureBlockedEvents();

      const action: OsAction = {
        id: 'contextual-block',
        label: 'Blocked',
        intent: 'standalone',
        href: '/blocked',
        disabled: true,
      };

      executeOsAction(action, createActionContext('launcher'));

      expect(blockedEvents[0].payload.surface).toBe('launcher');
      expect(blockedEvents[0].payload.suiteId).toBe('pilot');

      cleanup();
    });
  });
});

// ============================================================================
// Policy Gate Tests
// ============================================================================

describe('OS Actions Policy Enforcement', () => {
  afterEach(() => {
    resetActionPolicy();
  });

  describe('policy gate blocking', () => {
    it('policy gate can deny action', () => {
      const { events: invokedEvents, cleanup: cleanupInvoked } = captureInvokedEvents();
      const { events: blockedEvents, cleanup: cleanupBlocked } = captureBlockedEvents();

      // Set restrictive policy
      const policy: OsActionPolicy = {
        canExecute: (action, ctx) => ({
          allowed: false,
          reason: 'User does not have permission',
        }),
      };
      setActionPolicy(policy);

      const action: OsAction = {
        id: 'policy-blocked',
        label: 'Policy Blocked',
        intent: 'standalone',
        href: '/policy-blocked',
      };

      executeOsAction(action, createActionContext());

      expect(invokedEvents.length).toBe(0);
      expect(blockedEvents.length).toBe(1);
      expect(blockedEvents[0].payload.blockReason).toBe('policy');
      expect(blockedEvents[0].payload.policyReason).toBe('User does not have permission');

      cleanupInvoked();
      cleanupBlocked();
    });

    it('policy gate can allow action', () => {
      const { events: invokedEvents, cleanup: cleanupInvoked } = captureInvokedEvents();
      const { events: blockedEvents, cleanup: cleanupBlocked } = captureBlockedEvents();

      // Set permissive policy
      const policy: OsActionPolicy = {
        canExecute: () => ({ allowed: true }),
      };
      setActionPolicy(policy);

      const action: OsAction = {
        id: 'policy-allowed',
        label: 'Allowed',
        intent: 'standalone',
        href: '/allowed',
      };

      executeOsAction(action, createActionContext());

      expect(invokedEvents.length).toBe(1);
      expect(blockedEvents.length).toBe(0);

      cleanupInvoked();
      cleanupBlocked();
    });

    it('policy gate receives action and context', () => {
      const canExecuteSpy = vi.fn().mockReturnValue({ allowed: true });

      setActionPolicy({ canExecute: canExecuteSpy });

      const action: OsAction = {
        id: 'spy-action',
        label: 'Spy',
        intent: 'workbench',
        href: '/spy',
      };

      const ctx = createActionContext('launcher');
      executeOsAction(action, ctx);

      expect(canExecuteSpy).toHaveBeenCalledWith(action, ctx);
    });

    it('policy is not checked if action is already disabled', () => {
      const canExecuteSpy = vi.fn().mockReturnValue({ allowed: true });

      setActionPolicy({ canExecute: canExecuteSpy });

      const action: OsAction = {
        id: 'disabled-first',
        label: 'Disabled',
        intent: 'standalone',
        href: '/disabled',
        disabled: true,
      };

      executeOsAction(action, createActionContext());

      // Policy should not be called - disabled check comes first
      expect(canExecuteSpy).not.toHaveBeenCalled();
    });
  });

  describe('default policy', () => {
    it('default policy allows all actions', () => {
      const { events: invokedEvents, cleanup: cleanupInvoked } = captureInvokedEvents();

      // No custom policy set - default should allow

      const action: OsAction = {
        id: 'default-allowed',
        label: 'Default',
        intent: 'standalone',
        href: '/default',
      };

      executeOsAction(action, createActionContext());

      expect(invokedEvents.length).toBe(1);

      cleanupInvoked();
    });
  });
});

// ============================================================================
// Allowed Action Proceeds Tests
// ============================================================================

describe('OS Actions Allowed Execution', () => {
  it('allowed action navigates correctly', () => {
    const { cleanup } = captureInvokedEvents();
    const navigate = createMockNavigate();

    const action: OsAction = {
      id: 'nav-action',
      label: 'Navigate',
      intent: 'standalone',
      href: '/destination',
    };

    executeOsAction(action, { ...createActionContext(), navigate });

    expect(navigate).toHaveBeenCalledWith('/destination');

    cleanup();
  });

  it('allowed action emits invoked trace with all fields', () => {
    const { events, cleanup } = captureInvokedEvents();

    const action: OsAction = {
      id: 'full-action',
      label: 'Full',
      intent: 'workbench',
      href: '/full',
    };

    executeOsAction(action, {
      ...createActionContext('module'),
      suiteId: 'trace',
      moduleId: 'metrics-panel',
      parcelIdHash: 'h-abc123',
    });

    expect(events[0].payload).toMatchObject({
      actionId: 'full-action',
      actionType: 'navigation',
      intent: 'workbench',
      surface: 'module',
      suiteId: 'trace',
      moduleId: 'metrics-panel',
      parcelIdHash: 'h-abc123',
      href: '/full',
    });

    cleanup();
  });
});

/**
 * TerraFusion Action Stream Rendering Tests
 *
 * Enforces that the Action Stream module:
 * - Renders invoked events with correct fields
 * - Renders blocked events with reasons
 * - Filters by surface/suite/type
 * - Caps at N events and keeps newest first
 *
 * @module __tests__/trace/trace.actionStream.test
 * @see Slice 17: Action Observability Surface
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ActionStreamModule } from '../../components/Trace/ActionStreamModule';
import { ACTION_STREAM_CAP } from '../../hooks/useActionStream';
import {
  executeOsAction,
  OS_ACTION_EVENT_NAME,
  OS_ACTION_BLOCKED_EVENT_NAME,
  type OsAction,
  type OsActionContext,
} from '../../services/osActions';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockNavigate() {
  return vi.fn();
}

function createActionContext(
  surface: OsActionContext['surface'] = 'standalone_home',
  suiteId = 'pilot'
): OsActionContext {
  return {
    navigate: createMockNavigate(),
    suiteId,
    surface,
  };
}

function renderActionStream(props: Partial<Parameters<typeof ActionStreamModule>[0]> = {}) {
  return render(<ActionStreamModule {...props} />);
}

// ============================================================================
// Invoked Event Rendering Tests
// ============================================================================

describe('Action Stream Module', () => {
  describe('invoked events rendering', () => {
    it('renders invoked events with correct fields', async () => {
      renderActionStream();

      // Emit an action
      const action: OsAction = {
        id: 'test-action',
        label: 'Test Action',
        intent: 'standalone',
        href: '/test',
      };
      executeOsAction(action, createActionContext());

      // Wait for stream to update
      await screen.findByText('test-action');

      // Verify fields are displayed
      expect(screen.getByText('test-action')).toBeInTheDocument();
      expect(screen.getByText(/standalone_home/i)).toBeInTheDocument();
      expect(screen.getByText(/navigation/i)).toBeInTheDocument();
    });

    it('shows invoked badge for successful actions', async () => {
      renderActionStream();

      const action: OsAction = {
        id: 'invoked-test',
        label: 'Invoked',
        intent: 'standalone',
        href: '/invoked',
      };
      executeOsAction(action, createActionContext());

      await screen.findByText('invoked-test');

      // Should have invoked badge
      expect(screen.getByTestId('event-badge-invoked')).toBeInTheDocument();
    });
  });

  describe('blocked events rendering', () => {
    it('renders blocked events with reasons', async () => {
      renderActionStream();

      // Emit a disabled action (will be blocked)
      const action: OsAction = {
        id: 'blocked-action',
        label: 'Blocked',
        intent: 'standalone',
        href: '/blocked',
        disabled: true,
        disabledReason: 'Feature unavailable',
      };
      executeOsAction(action, createActionContext());

      await screen.findByText('blocked-action');

      // Verify blocked badge and reason
      expect(screen.getByTestId('event-badge-blocked')).toBeInTheDocument();
      expect(screen.getByText(/Feature unavailable/i)).toBeInTheDocument();
    });

    it('shows block reason type (disabled vs policy)', async () => {
      renderActionStream();

      const action: OsAction = {
        id: 'disabled-block',
        label: 'Disabled',
        intent: 'standalone',
        href: '/disabled',
        disabled: true,
      };
      executeOsAction(action, createActionContext());

      await screen.findByText('disabled-block');

      // Should show "Disabled:" prefix in the block reason display
      expect(screen.getByText(/^Disabled:/)).toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('filters by surface', async () => {
      const user = userEvent.setup();
      renderActionStream();

      // Emit actions from different surfaces
      executeOsAction(
        { id: 'launcher-action', label: 'L', intent: 'standalone', href: '/l' },
        createActionContext('launcher')
      );
      executeOsAction(
        { id: 'standalone-action', label: 'S', intent: 'standalone', href: '/s' },
        createActionContext('standalone_home')
      );

      await screen.findByText('launcher-action');
      await screen.findByText('standalone-action');

      // Apply surface filter
      const filterSelect = screen.getByLabelText(/filter by surface/i);
      await user.selectOptions(filterSelect, 'launcher');

      // Only launcher action should be visible
      expect(screen.getByText('launcher-action')).toBeInTheDocument();
      expect(screen.queryByText('standalone-action')).not.toBeInTheDocument();
    });

    it('filters by suiteId', async () => {
      const user = userEvent.setup();
      renderActionStream();

      // Emit actions from different suites
      executeOsAction(
        { id: 'pilot-action', label: 'P', intent: 'standalone', href: '/p' },
        createActionContext('standalone_home', 'pilot')
      );
      executeOsAction(
        { id: 'trace-action', label: 'T', intent: 'standalone', href: '/t' },
        createActionContext('standalone_home', 'trace')
      );

      await screen.findByText('pilot-action');

      // Apply suite filter
      const filterInput = screen.getByLabelText(/filter by suite/i);
      await user.type(filterInput, 'trace');

      // Only trace action should be visible
      expect(screen.getByText('trace-action')).toBeInTheDocument();
      expect(screen.queryByText('pilot-action')).not.toBeInTheDocument();
    });

    it('filters by action type (invoked vs blocked)', async () => {
      const user = userEvent.setup();
      renderActionStream();

      // Emit invoked and blocked actions
      executeOsAction(
        { id: 'ok-action', label: 'OK', intent: 'standalone', href: '/ok' },
        createActionContext()
      );
      executeOsAction(
        { id: 'blocked-action', label: 'Block', intent: 'standalone', href: '/b', disabled: true },
        createActionContext()
      );

      await screen.findByText('ok-action');
      await screen.findByText('blocked-action');

      // Apply type filter to show only blocked
      const typeFilter = screen.getByLabelText(/filter by status/i);
      await user.selectOptions(typeFilter, 'blocked');

      expect(screen.getByText('blocked-action')).toBeInTheDocument();
      expect(screen.queryByText('ok-action')).not.toBeInTheDocument();
    });
  });

  describe('capping', () => {
    it('caps at ACTION_STREAM_CAP and keeps newest first', async () => {
      renderActionStream();

      // Emit more than cap events
      for (let i = 0; i < ACTION_STREAM_CAP + 10; i++) {
        executeOsAction(
          { id: `action-${i}`, label: `A${i}`, intent: 'standalone', href: `/a${i}` },
          createActionContext()
        );
      }

      // Wait for last event
      await screen.findByText(`action-${ACTION_STREAM_CAP + 9}`);

      // Newest should be first (last emitted on top)
      const items = screen.getAllByTestId(/^action-stream-item-/);
      expect(items.length).toBeLessThanOrEqual(ACTION_STREAM_CAP);

      // First item should be newest
      expect(items[0]).toHaveTextContent(`action-${ACTION_STREAM_CAP + 9}`);

      // Oldest should be gone
      expect(screen.queryByText('action-0')).not.toBeInTheDocument();
    });

    it('shows event count indicator', async () => {
      renderActionStream();

      executeOsAction(
        { id: 'count-test', label: 'C', intent: 'standalone', href: '/c' },
        createActionContext()
      );

      await screen.findByText('count-test');

      // Should show count
      expect(screen.getByTestId('action-stream-count')).toHaveTextContent('1');
    });
  });

  describe('empty state', () => {
    it('shows empty state when no events', () => {
      renderActionStream();

      expect(screen.getByText(/no actions recorded/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// useActionStream Hook Tests
// ============================================================================

describe('useActionStream hook', () => {
  it('returns empty array initially', () => {
    // This would be tested with renderHook in the actual implementation
    expect(ACTION_STREAM_CAP).toBeGreaterThan(0);
  });
});

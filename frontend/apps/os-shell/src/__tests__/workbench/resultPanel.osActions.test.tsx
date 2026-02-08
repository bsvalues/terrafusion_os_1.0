/**
 * resultPanel.osActions.test.tsx
 *
 * TDD: Tests for ResultPanel OS action trace emission
 *
 * Contract:
 * - User click on expand (details toggle) emits os_action_invoked trace
 * - User click on collapse emits os_action_invoked trace
 * - User click on copy correlationId emits os_action_invoked trace
 * - User click on dismiss emits os_action_invoked trace
 * - Initial render emits nothing
 * - Auto-expansion or state hydration emits nothing
 *
 * @see Slice 21: ResultPanel Interaction Traces
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResultPanel } from '../../components/workbench/ResultPanel';
import { OS_ACTION_EVENT_NAME, type OsActionTraceEvent } from '../../services/osActions';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Capture OS action trace events from dispatched custom events
 */
function captureOsActionEvents(): OsActionTraceEvent[] {
  const events: OsActionTraceEvent[] = [];

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<OsActionTraceEvent>;
    events.push(customEvent.detail);
  };

  window.addEventListener(OS_ACTION_EVENT_NAME, handler);

  // Return cleanup function and access to captured events
  return events;
}

// Mock runtime/env for dev mode detection
vi.mock('../../runtime/env', () => ({
  getEnv: vi.fn((key?: string) => {
    if (key === 'MODE') return 'development';
    if (key === 'DEV') return true;
    return { DEV: true, MODE: 'development' };
  }),
}));

// Mock ErrorDisplay
vi.mock('../../components/errors/ErrorDisplay', () => ({
  ErrorDisplay: ({ error }: { error: { message: string } }) => (
    <div data-testid='error-display'>{error.message}</div>
  ),
}));

// ============================================================================
// Tests
// ============================================================================

describe('ResultPanel OS Action Traces', () => {
  let events: OsActionTraceEvent[];
  let cleanup: () => void;

  beforeEach(() => {
    events = [];
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<OsActionTraceEvent>;
      events.push(customEvent.detail);
    };
    window.addEventListener(OS_ACTION_EVENT_NAME, handler);
    cleanup = () => window.removeEventListener(OS_ACTION_EVENT_NAME, handler);

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup?.();
  });

  describe('Initial Render', () => {
    it('emits nothing on initial render (idle state)', () => {
      render(
        <ResultPanel
          status='idle'
          idleContent={{ icon: '🔥', title: 'Ready', subtitle: 'Start a query' }}
        />
      );

      expect(events).toHaveLength(0);
    });

    it('emits nothing on initial render (success state)', () => {
      render(
        <ResultPanel status='success' correlationId='corr-test-123'>
          <div>Result content</div>
        </ResultPanel>
      );

      expect(events).toHaveLength(0);
    });

    it('emits nothing on initial render (error state)', () => {
      render(
        <ResultPanel
          status='error'
          error={{
            code: 'TEST_ERROR',
            message: 'Test error',
            correlationId: 'corr-err-123',
            severity: 'error',
          }}
        />
      );

      expect(events).toHaveLength(0);
    });

    it('emits nothing on initial render (loading state)', () => {
      render(<ResultPanel status='loading' loadingMessage='Loading...' />);

      expect(events).toHaveLength(0);
    });
  });

  describe('Developer Info Toggle (Expand/Collapse)', () => {
    it('emits trace when user expands developer info details', async () => {
      render(
        <ResultPanel status='success' correlationId='corr-expand-test'>
          <div>Result content</div>
        </ResultPanel>
      );

      // Find and click the details summary (Developer Info)
      const summary = screen.getByText(/developer info/i);
      fireEvent.click(summary);

      await waitFor(() => {
        expect(events).toHaveLength(1);
      });

      expect(events[0].type).toBe('os_action_invoked');
      expect(events[0].payload.actionId).toBe('result_panel_dev_info_expand');
      expect(events[0].payload.surface).toBe('workbench');
      expect(events[0].payload.moduleId).toBe('result_panel');
    });

    it('emits trace when user collapses developer info details', async () => {
      render(
        <ResultPanel status='success' correlationId='corr-collapse-test'>
          <div>Result content</div>
        </ResultPanel>
      );

      // Find the details element and open it first
      const details = screen.getByText(/developer info/i).closest('details');
      if (details) {
        (details as HTMLDetailsElement).open = true;
      }

      // Now click to collapse
      const summary = screen.getByText(/developer info/i);
      fireEvent.click(summary);

      await waitFor(() => {
        expect(events).toHaveLength(1);
      });

      expect(events[0].type).toBe('os_action_invoked');
      expect(events[0].payload.actionId).toBe('result_panel_dev_info_collapse');
      expect(events[0].payload.surface).toBe('workbench');
      expect(events[0].payload.moduleId).toBe('result_panel');
    });
  });

  describe('Copy CorrelationId', () => {
    it('emits trace when user clicks copy button', async () => {
      render(
        <ResultPanel status='success' correlationId='corr-copy-test-123'>
          <div>Result content</div>
        </ResultPanel>
      );

      // Find and click the copy button
      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(events).toHaveLength(1);
      });

      expect(events[0].type).toBe('os_action_invoked');
      expect(events[0].payload.actionId).toBe('result_panel_copy_correlation_id');
      expect(events[0].payload.surface).toBe('workbench');
      expect(events[0].payload.moduleId).toBe('result_panel');
    });
  });

  describe('Dismiss Error', () => {
    it('emits trace when user clicks dismiss button', async () => {
      const onDismiss = vi.fn();

      render(
        <ResultPanel
          status='error'
          error={{
            code: 'TEST_ERROR',
            message: 'Test error message',
            correlationId: 'corr-dismiss-123',
            severity: 'error',
          }}
          onDismiss={onDismiss}
        />
      );

      // Find and click the dismiss button
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(events).toHaveLength(1);
      });

      expect(events[0].type).toBe('os_action_invoked');
      expect(events[0].payload.actionId).toBe('result_panel_dismiss_error');
      expect(events[0].payload.surface).toBe('workbench');
      expect(events[0].payload.moduleId).toBe('result_panel');

      // Verify the dismiss callback was also called
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Trace Payload Structure', () => {
    it('includes required fields in trace payload', async () => {
      render(
        <ResultPanel status='success' correlationId='corr-payload-test'>
          <div>Result content</div>
        </ResultPanel>
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(events).toHaveLength(1);
      });

      const payload = events[0].payload;
      expect(payload).toHaveProperty('actionId');
      expect(payload).toHaveProperty('actionType', 'handler');
      expect(payload).toHaveProperty('intent', 'workbench');
      expect(payload).toHaveProperty('surface', 'workbench');
      expect(payload).toHaveProperty('suiteId', 'workbench');
      expect(payload).toHaveProperty('moduleId', 'result_panel');
    });

    it('includes privacy-safe resultType in trace if provided', async () => {
      render(
        <ResultPanel
          status='success'
          correlationId='corr-result-type'
          resultType='valuation_explanation'
        >
          <div>Result content</div>
        </ResultPanel>
      );

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(events).toHaveLength(1);
      });

      // resultType should be in payload if supported
      expect(events[0].payload.resultType).toBe('valuation_explanation');
    });
  });

  describe('No Double-Counting', () => {
    it('does not emit trace on status change (state update)', async () => {
      const { rerender } = render(<ResultPanel status='loading' loadingMessage='Loading...' />);

      expect(events).toHaveLength(0);

      // Rerender with success state
      rerender(
        <ResultPanel status='success' correlationId='corr-state-change'>
          <div>Result content</div>
        </ResultPanel>
      );

      // State change should not emit trace
      expect(events).toHaveLength(0);
    });

    it('does not emit trace on prop update without user interaction', async () => {
      const { rerender } = render(
        <ResultPanel status='success' correlationId='corr-v1'>
          <div>Result v1</div>
        </ResultPanel>
      );

      expect(events).toHaveLength(0);

      // Update correlationId
      rerender(
        <ResultPanel status='success' correlationId='corr-v2'>
          <div>Result v2</div>
        </ResultPanel>
      );

      // Prop update should not emit trace
      expect(events).toHaveLength(0);
    });
  });
});

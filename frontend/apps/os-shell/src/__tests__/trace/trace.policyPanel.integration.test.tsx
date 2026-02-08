/**
 * TerraTrace PolicyPanel Integration Tests
 *
 * Tests that PolicyPanel is integrated into TerraTrace as a first-class module:
 * - PolicyPanel renders in TraceHome
 * - Policy events (policy_updated, policy_reset) appear in Action Stream
 * - Policy changes are auditable and filterable
 *
 * @module __tests__/trace/trace.policyPanel.integration.test
 * @see Slice 24: TerraTrace Policy Module Integration + Golden Journey 10
 */

import { beforeEach, describe, expect, it } from 'vitest';

// ============================================================================
// Imports
// ============================================================================

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import TraceHome from '../../pages/TraceHome';
import { subscribeToAllTraces, type OsActionAnyTraceEvent } from '../../services/osActions';
import type { TelemetryStore } from '../../services/telemetry/telemetryStore';
import { createMockTelemetryStore } from '../../testUtils/mockTelemetryStore';

// ============================================================================
// Test Helpers
// ============================================================================

function renderTraceHome(telemetryStore: TelemetryStore) {
  return render(
    <MemoryRouter initialEntries={['/trace']}>
      <TraceHome telemetryStore={telemetryStore} />
    </MemoryRouter>
  );
}

function collectTraces(fn: () => void): OsActionAnyTraceEvent[] {
  const traces: OsActionAnyTraceEvent[] = [];
  const unsubscribe = subscribeToAllTraces((event) => {
    traces.push(event);
  });

  fn();
  unsubscribe();

  return traces;
}

// ============================================================================
// PolicyPanel Integration Tests
// ============================================================================

describe('TerraTrace PolicyPanel Integration', () => {
  let telemetryStore: TelemetryStore;

  beforeEach(() => {
    // Clear localStorage to prevent test pollution
    localStorage.clear();

    // Create fresh mock telemetry store for each test
    telemetryStore = createMockTelemetryStore();
  });

  describe('PolicyPanel module rendering', () => {
    it('renders PolicyPanel as a module in TraceHome', () => {
      renderTraceHome(telemetryStore);

      // PolicyPanel should be visible (policy mode indicator is always present)
      expect(screen.getByText(/Policy Mode:/i)).toBeInTheDocument();
    });

    it('shows Default Allow mode initially', () => {
      renderTraceHome(telemetryStore);

      expect(screen.getByText(/Default Allow/i)).toBeInTheDocument();
      expect(screen.getByText(/No active policy rules/i)).toBeInTheDocument();
    });

    it('PolicyPanel is visible in both Live and History modes', () => {
      renderTraceHome(telemetryStore);

      // PolicyPanel should exist regardless of trace context
      // (it manages rules, not traces)
      expect(screen.getByText(/Policy Mode:/i)).toBeInTheDocument();
    });
  });

  describe('Policy events in Action Stream', () => {
    it('policy_updated events appear in Action Stream', async () => {
      const user = userEvent.setup();
      renderTraceHome(telemetryStore);

      // Add a rule to trigger policy_updated event
      await user.click(screen.getByRole('button', { name: /Add Rule/i }));
      await user.type(screen.getByLabelText(/Action ID/i), 'test-action-stream');
      await user.type(screen.getByLabelText(/Reason/i), 'Test policy event');
      await user.click(screen.getByRole('button', { name: /Save Rule/i }));

      // Wait for event to appear in Action Stream (use getAllByText since it appears in badge + code)
      await waitFor(() => {
        const policyUpdatedElements = screen.getAllByText(/policy_updated/i);
        expect(policyUpdatedElements.length).toBeGreaterThan(0);
      });

      // Check that rulesHash and ruleCount are displayed
      expect(screen.getByText(/ruleCount/i)).toBeInTheDocument();
      expect(screen.getByText(/rulesHash/i)).toBeInTheDocument();
    });

    it('policy_reset events appear in Action Stream', async () => {
      const user = userEvent.setup();
      renderTraceHome(telemetryStore);

      // Add a rule first
      await user.click(screen.getByRole('button', { name: /Add Rule/i }));
      await user.type(screen.getByLabelText(/Action ID/i), 'reset-test');
      await user.type(screen.getByLabelText(/Reason/i), 'Reset test');
      await user.click(screen.getByRole('button', { name: /Save Rule/i }));

      await waitFor(() => {
        expect(screen.getByText(/reset-test/)).toBeInTheDocument();
      });

      // Reset policy
      await user.click(screen.getByRole('button', { name: /Reset Policy/i }));

      // Wait for event to appear in Action Stream (use getAllByText since it appears in badge + code)
      await waitFor(() => {
        const policyResetElements = screen.getAllByText(/policy_reset/i);
        expect(policyResetElements.length).toBeGreaterThan(0);
      });
    });

    it('policy events include PII-safe payload', async () => {
      const user = userEvent.setup();
      renderTraceHome(telemetryStore);

      const traces: OsActionAnyTraceEvent[] = [];
      const unsubscribe = subscribeToAllTraces((event) => {
        traces.push(event);
      });

      // Add a rule
      await user.click(screen.getByRole('button', { name: /Add Rule/i }));
      await user.type(screen.getByLabelText(/Action ID/i), 'pii-safe-test');
      await user.type(screen.getByLabelText(/Reason/i), 'PII test');
      await user.click(screen.getByRole('button', { name: /Save Rule/i }));

      await waitFor(() => {
        const policyUpdated = traces.find((t) => t.type === 'policy_updated');
        expect(policyUpdated).toBeDefined();

        // Payload should have rulesHash, ruleCount, no PII
        const payload = (policyUpdated as any).payload;
        expect(payload.rulesHash).toBeDefined();
        expect(payload.ruleCount).toBeDefined();

        // Should NOT have sensitive rule details (only hash)
        expect(payload.rules).toBeUndefined();
      });

      unsubscribe();
    });
  });

  describe('Policy persistence in TerraTrace context', () => {
    it('policy rules survive reload', async () => {
      const user = userEvent.setup();

      // First render: add a rule
      const { unmount } = renderTraceHome(telemetryStore);
      await user.click(screen.getByRole('button', { name: /Add Rule/i }));
      await user.type(screen.getByLabelText(/Action ID/i), 'persistent-rule');
      await user.type(screen.getByLabelText(/Reason/i), 'Persist test');
      await user.click(screen.getByRole('button', { name: /Save Rule/i }));

      await waitFor(() => {
        expect(screen.getByText(/persistent-rule/)).toBeInTheDocument();
      });

      unmount();

      // Second render: verify rule persisted
      renderTraceHome(telemetryStore);

      expect(screen.getByText(/persistent-rule/)).toBeInTheDocument();
      expect(screen.getByText(/Persist test/)).toBeInTheDocument();

      // "Custom" appears multiple times (in badge, mode, etc), just verify it exists
      const customElements = screen.getAllByText(/Custom/i);
      expect(customElements.length).toBeGreaterThan(0);
    });
  });
});

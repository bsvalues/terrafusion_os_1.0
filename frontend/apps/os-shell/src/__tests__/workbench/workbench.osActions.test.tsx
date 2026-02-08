/**
 * TerraFusion Workbench OS Action Instrumentation Tests (TDD)
 *
 * Tests that workbench tab switching emits proper OS action traces.
 * Only user-initiated tab switches should emit - not initial mount or auto-redirect.
 *
 * @module __tests__/workbench/workbench.osActions.test
 * @see Slice 19: Workbench Action Instrumentation + End-to-End Golden Journeys
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import {
  resetTraceClock,
  setTraceClock,
  subscribeToAllTraces,
  type OsActionAnyTraceEvent,
} from '../../services/osActions';
import {
  createMockClock,
  collectTracesDuringSync,
  normalizeTraces,
} from '../../testUtils/traceHarness';

// ============================================================================
// Mock Navigation and Test Context
// ============================================================================

/**
 * Test wrapper with router and trace collection
 */
function renderWithRouter(
  component: React.ReactNode,
  { initialEntries = ['/property/12345-001'] } = {}
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/property/:parcelId/*" element={component} />
        <Route path="/property/:parcelId" element={component} />
      </Routes>
    </MemoryRouter>
  );
}

// ============================================================================
// Import PropertyWorkbench (after mocking)
// ============================================================================

// Defer import to allow mocks to be set up - will import dynamically in tests
let PropertyWorkbench: React.ComponentType<{ className?: string }>;

// ============================================================================
// Tests
// ============================================================================

describe('Workbench OS Action Instrumentation', () => {
  let clockCleanup: () => void;
  let traces: OsActionAnyTraceEvent[];
  let unsubscribe: () => void;

  beforeEach(async () => {
    // Set up deterministic clock
    const mockClock = createMockClock(2000000000000, 100);
    clockCleanup = setTraceClock(mockClock.now);

    // Collect all traces during test
    traces = [];
    unsubscribe = subscribeToAllTraces((event) => {
      traces.push(event);
    });

    // Dynamic import to ensure mocks are in place
    const module = await import('../../pages/workbench/PropertyWorkbench');
    PropertyWorkbench = module.PropertyWorkbench;
  });

  afterEach(() => {
    clockCleanup();
    resetTraceClock();
    unsubscribe();
    traces = [];
    vi.clearAllMocks();
  });

  describe('Tab Switch Trace Emission', () => {
    it('user tab switch emits invoked trace with surface=workbench and tabId', async () => {
      const user = userEvent.setup();

      renderWithRouter(<PropertyWorkbench />, {
        initialEntries: ['/property/12345-001'],
      });

      // Wait for initial render
      expect(screen.getByText('Summary')).toBeInTheDocument();

      // Clear any initial mount traces
      traces.length = 0;

      // Click on Forge tab (user-initiated)
      const forgeTab = screen.getByRole('link', { name: /forge/i });
      await user.click(forgeTab);

      // Verify trace was emitted
      expect(traces.length).toBeGreaterThanOrEqual(1);

      const tabSwitchTrace = traces.find(
        (t) => t.type === 'os_action_invoked' && t.payload.actionId === 'workbench_tab_switch'
      );
      expect(tabSwitchTrace).toBeDefined();
      expect(tabSwitchTrace!.payload).toMatchObject({
        actionId: 'workbench_tab_switch',
        actionType: 'navigation',
        intent: 'workbench',
        surface: 'workbench',
        suiteId: 'workbench',
      });

      // Check for tabId in payload (extended field)
      expect((tabSwitchTrace!.payload as Record<string, unknown>).tabId).toBe('forge');
    });

    it('initial route resolve does NOT emit tab-switch trace', async () => {
      // Render workbench at /property/12345-001 (summary tab default)
      renderWithRouter(<PropertyWorkbench />, {
        initialEntries: ['/property/12345-001'],
      });

      // Wait for component to mount and any effects to run
      await screen.findByText('Summary');

      // No traces should be emitted on mount
      const tabSwitchTraces = traces.filter(
        (t) => t.payload.actionId === 'workbench_tab_switch'
      );
      expect(tabSwitchTraces).toHaveLength(0);
    });

    it('navigating to specific tab via URL does NOT emit trace (auto-redirect)', async () => {
      // Navigate directly to forge tab via URL
      renderWithRouter(<PropertyWorkbench />, {
        initialEntries: ['/property/12345-001/forge'],
      });

      await screen.findByText('Summary'); // Wait for render

      // No tab switch trace should be emitted for URL navigation
      const tabSwitchTraces = traces.filter(
        (t) => t.payload.actionId === 'workbench_tab_switch'
      );
      expect(tabSwitchTraces).toHaveLength(0);
    });

    it('clicking current tab does NOT emit duplicate trace', async () => {
      const user = userEvent.setup();

      renderWithRouter(<PropertyWorkbench />, {
        initialEntries: ['/property/12345-001'],
      });

      await screen.findByText('Summary');
      traces.length = 0;

      // Click Summary tab (already active)
      const summaryTab = screen.getByRole('link', { name: /summary/i });
      await user.click(summaryTab);

      // No trace should be emitted for clicking active tab
      const tabSwitchTraces = traces.filter(
        (t) => t.payload.actionId === 'workbench_tab_switch'
      );
      expect(tabSwitchTraces).toHaveLength(0);
    });
  });

  describe('Trace Payload Structure', () => {
    it('trace includes parcelIdHash when parcel context exists', async () => {
      const user = userEvent.setup();

      renderWithRouter(<PropertyWorkbench />, {
        initialEntries: ['/property/12345-001'],
      });

      await screen.findByText('Summary');
      traces.length = 0;

      const atlasTab = screen.getByRole('link', { name: /atlas/i });
      await user.click(atlasTab);

      const trace = traces.find(
        (t) => t.type === 'os_action_invoked' && t.payload.actionId === 'workbench_tab_switch'
      );

      // parcelIdHash should be present (hashed for PII safety)
      expect((trace?.payload as Record<string, unknown>).parcelIdHash).toBeDefined();
    });

    it('trace tabId matches target tab', async () => {
      const user = userEvent.setup();

      renderWithRouter(<PropertyWorkbench />, {
        initialEntries: ['/property/12345-001'],
      });

      await screen.findByText('Summary');
      traces.length = 0;

      // Click each tab and verify tabId in trace
      const tabsToTest = ['forge', 'atlas', 'dais', 'dossier', 'pilot'];

      for (const tabId of tabsToTest) {
        traces.length = 0;

        const tab = screen.getByRole('link', { name: new RegExp(tabId, 'i') });
        await user.click(tab);

        const trace = traces.find(
          (t) => t.type === 'os_action_invoked' && t.payload.actionId === 'workbench_tab_switch'
        );

        expect(trace).toBeDefined();
        expect((trace!.payload as Record<string, unknown>).tabId).toBe(tabId);
      }
    });

    it('moduleId is set to workbench_tabs for tab navigation', async () => {
      const user = userEvent.setup();

      renderWithRouter(<PropertyWorkbench />, {
        initialEntries: ['/property/12345-001'],
      });

      await screen.findByText('Summary');
      traces.length = 0;

      const daisTab = screen.getByRole('link', { name: /dais/i });
      await user.click(daisTab);

      const trace = traces.find(
        (t) => t.type === 'os_action_invoked' && t.payload.actionId === 'workbench_tab_switch'
      );

      expect(trace?.payload.moduleId).toBe('workbench_tabs');
    });
  });

  describe('Disabled Tab Handling', () => {
    it('clicking disabled tab emits blocked trace', async () => {
      const user = userEvent.setup();

      renderWithRouter(<PropertyWorkbench />, {
        initialEntries: ['/property/12345-001'],
      });

      await screen.findByText('Summary');
      traces.length = 0;

      // Find a disabled tab if any exist (check for opacity-50 or cursor-not-allowed)
      const allTabs = screen.getAllByRole('link');
      const disabledTab = allTabs.find((tab) =>
        tab.className.includes('cursor-not-allowed') || tab.className.includes('opacity-50')
      );

      // Skip test if no disabled tabs
      if (!disabledTab) {
        return;
      }

      await user.click(disabledTab);

      const blockedTrace = traces.find((t) => t.type === 'os_action_blocked');
      expect(blockedTrace).toBeDefined();
      expect(blockedTrace!.payload.blockReason).toBe('disabled');
    });
  });
});

describe('Workbench Action Schema Evolution', () => {
  let clockCleanup: () => void;

  beforeEach(() => {
    const mockClock = createMockClock(2000000000000, 100);
    clockCleanup = setTraceClock(mockClock.now);
  });

  afterEach(() => {
    clockCleanup();
    resetTraceClock();
  });

  it('tabId is optional additive field', () => {
    // Existing traces without tabId should still work
    const legacyTrace = {
      type: 'os_action_invoked' as const,
      timestamp: 2000000000000,
      payload: {
        actionId: 'nav-to-suite',
        actionType: 'navigation' as const,
        intent: 'workbench',
        surface: 'launcher',
        suiteId: 'pilot',
        href: '/pilot/home',
      },
    };

    const normalized = normalizeTraces([legacyTrace]);
    expect(normalized[0]).toBeDefined();
    expect((normalized[0].payload as Record<string, unknown>).tabId).toBeUndefined();
  });

  it('new traces with tabId are normalized correctly', () => {
    const newTrace = {
      type: 'os_action_invoked' as const,
      timestamp: 2000000000000,
      payload: {
        actionId: 'workbench_tab_switch',
        actionType: 'navigation' as const,
        intent: 'workbench',
        surface: 'workbench',
        suiteId: 'workbench',
        href: '/property/12345/forge',
        tabId: 'forge',
      },
    };

    const normalized = normalizeTraces([newTrace as OsActionAnyTraceEvent]);
    expect(normalized[0]).toBeDefined();
    // tabId should be preserved in normalization
    expect((normalized[0].payload as Record<string, unknown>).tabId).toBe('forge');
  });
});

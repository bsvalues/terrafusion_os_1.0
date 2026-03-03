/**
 * EvidenceRail-lane-i.test.tsx
 *
 * Lane I — Frontend contract tests for EvidenceRail UX + Diagnostics.
 *
 * Covers:
 *  - Empty-state context messaging (default vs filtered)
 *  - Error / failure state ("Feed unavailable")
 *  - Staleness indicator ("Last updated: X ago")
 *  - Admin diagnostics drawer (toggle, content, cap=0 rendering)
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceRail } from '../../components/pilot/EvidenceRail';
import type { EvidenceRailProps, EvidenceRailDiagnostics } from '../../components/pilot/EvidenceRail';
import type { PilotTraceEvent } from '../../api/pilotApi';

// ---------------------------------------------------------------------------
// Mock material components (same as existing tests)
// ---------------------------------------------------------------------------

jest.mock('../../ui/materials/LiquidPanel', () => ({
  LiquidPanel: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock('../../ui/materials/TactileButton', () => ({
  TactileButton: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
    <button {...props}>{children}</button>
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_EVENTS: PilotTraceEvent[] = [
  {
    eventId: 'evt-i-1',
    type: 'tool_invoked',
    toolId: 'property_lookup',
    correlationId: 'corr-lane-i-1',
    summary: 'Looked up parcel P-100',
    timestamp: '2026-03-10T14:00:00.000Z',
    context: { countyId: 'benton', userId: 'u-1', mode: 'pilot', parcelId: 'P-100' },
  },
  {
    eventId: 'evt-i-2',
    type: 'tool_completed',
    toolId: 'property_lookup',
    correlationId: 'corr-lane-i-1',
    summary: 'Parcel P-100 found — 2.5 acres',
    timestamp: '2026-03-10T14:00:01.000Z',
    context: { countyId: 'benton', userId: 'u-1', mode: 'pilot', parcelId: 'P-100' },
  },
];

const MOCK_DIAGNOSTICS: EvidenceRailDiagnostics = {
  perParcelCap: 2000,
  cappedParcelsCount: 3,
  maxEventsInParcel: 2000,
  oldestEventTimestamp: '2026-01-01T00:00:00.000Z',
  newestEventTimestamp: '2026-03-10T14:00:01.000Z',
};

function renderRail(overrides: Partial<EvidenceRailProps> = {}) {
  const defaults: EvidenceRailProps = {
    phase: 'ready',
    events: MOCK_EVENTS,
    error: null,
    onRetry: jest.fn(),
  };
  return render(<EvidenceRail {...defaults} {...overrides} />);
}

// =========================================================================
// 1. EMPTY-STATE MESSAGING
// =========================================================================

describe('Lane I — empty-state messaging', () => {
  it('shows default window message when not filtered', () => {
    renderRail({ phase: 'empty', events: [] });
    expect(screen.getByTestId('evidence-empty')).toBeInTheDocument();
    expect(screen.getByText(/no trace events in the last 30 days/i)).toBeInTheDocument();
  });

  it('shows default message when phase=ready + 0 events + not filtered', () => {
    renderRail({ phase: 'ready', events: [] });
    expect(screen.getByText(/no trace events in the last 30 days/i)).toBeInTheDocument();
  });

  it('shows filtered message when isFiltered=true', () => {
    renderRail({ phase: 'empty', events: [], isFiltered: true });
    expect(screen.getByText(/no matches for current filters/i)).toBeInTheDocument();
  });

  it('shows filtered message when phase=ready + 0 events + isFiltered', () => {
    renderRail({ phase: 'ready', events: [], isFiltered: true });
    expect(screen.getByText(/no matches for current filters/i)).toBeInTheDocument();
  });
});

// =========================================================================
// 2. FAILURE STATE
// =========================================================================

describe('Lane I — failure state', () => {
  it('shows "Feed unavailable" with error message and Retry button', () => {
    renderRail({ phase: 'error', events: [], error: 'Network timeout' });

    const errorEl = screen.getByTestId('evidence-error');
    expect(errorEl).toBeInTheDocument();
    expect(screen.getByText(/feed unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/network timeout/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
});

// =========================================================================
// 3. STALENESS INDICATOR (deterministic — uses `now` prop, no wall clock)
// =========================================================================

const FIXED_NOW = new Date('2026-03-10T15:00:00.000Z');

describe('Lane I — staleness indicator', () => {
  it('shows "Last updated: just now" when lastFetchedAt is < 10s old', () => {
    const fiveSecondsAgo = new Date(FIXED_NOW.getTime() - 5_000);
    renderRail({ lastFetchedAt: fiveSecondsAgo, now: FIXED_NOW });
    expect(screen.getByTestId('staleness-indicator')).toHaveTextContent(/last updated: just now/i);
  });

  it('shows "Last updated: 30s ago" for 30-second staleness', () => {
    const thirtySecondsAgo = new Date(FIXED_NOW.getTime() - 30_000);
    renderRail({ lastFetchedAt: thirtySecondsAgo, now: FIXED_NOW });
    expect(screen.getByTestId('staleness-indicator')).toHaveTextContent(/last updated: 30s ago/i);
  });

  it('shows "Last updated: 5m ago" for 5-minute staleness', () => {
    const fiveMinutesAgo = new Date(FIXED_NOW.getTime() - 5 * 60_000);
    renderRail({ lastFetchedAt: fiveMinutesAgo, now: FIXED_NOW });
    expect(screen.getByTestId('staleness-indicator')).toHaveTextContent(/last updated: 5m ago/i);
  });

  it('shows "Feed unavailable" when fetchFailed=true', () => {
    renderRail({ fetchFailed: true });
    expect(screen.getByTestId('staleness-unavailable')).toHaveTextContent(/feed unavailable/i);
  });

  it('fetchFailed takes precedence over lastFetchedAt', () => {
    renderRail({ fetchFailed: true, lastFetchedAt: new Date(), now: FIXED_NOW });
    expect(screen.getByTestId('staleness-unavailable')).toBeInTheDocument();
    expect(screen.queryByTestId('staleness-indicator')).not.toBeInTheDocument();
  });

  it('does not render staleness when neither prop is provided', () => {
    renderRail();
    expect(screen.queryByTestId('staleness-indicator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('staleness-unavailable')).not.toBeInTheDocument();
  });
});

// =========================================================================
// 4. ADMIN DIAGNOSTICS DRAWER
// =========================================================================

describe('Lane I — admin diagnostics drawer', () => {
  it('does not render diagnostics when showDiagnostics is false', () => {
    renderRail({ showDiagnostics: false, diagnostics: MOCK_DIAGNOSTICS });
    expect(screen.queryByTestId('diagnostics-drawer')).not.toBeInTheDocument();
  });

  it('does not render diagnostics when diagnostics is null', () => {
    renderRail({ showDiagnostics: true, diagnostics: null });
    expect(screen.queryByTestId('diagnostics-drawer')).not.toBeInTheDocument();
  });

  it('renders collapsed drawer when showDiagnostics + diagnostics provided', () => {
    renderRail({ showDiagnostics: true, diagnostics: MOCK_DIAGNOSTICS });
    const drawer = screen.getByTestId('diagnostics-drawer');
    expect(drawer).toBeInTheDocument();

    const toggle = screen.getByTestId('diagnostics-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveTextContent(/show diagnostics/i);

    // Content should NOT be visible yet
    expect(screen.queryByTestId('diagnostics-content')).not.toBeInTheDocument();
  });

  it('expands drawer on toggle click and shows all stats', async () => {
    renderRail({ showDiagnostics: true, diagnostics: MOCK_DIAGNOSTICS });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('diagnostics-toggle'));

    expect(screen.getByTestId('diagnostics-toggle')).toHaveAttribute('aria-expanded', 'true');

    const content = screen.getByTestId('diagnostics-content');
    expect(content).toBeInTheDocument();

    // Verify all stat values
    expect(screen.getByTestId('diag-per-parcel-cap')).toHaveTextContent('2000');
    expect(screen.getByTestId('diag-capped-parcels-count')).toHaveTextContent('3');
    expect(screen.getByTestId('diag-max-events-in-parcel')).toHaveTextContent('2000');
    expect(screen.getByTestId('diag-oldest-event')).not.toHaveTextContent('—');
    expect(screen.getByTestId('diag-newest-event')).not.toHaveTextContent('—');
  });

  it('collapses drawer on second toggle click', async () => {
    renderRail({ showDiagnostics: true, diagnostics: MOCK_DIAGNOSTICS });

    const user = userEvent.setup();
    const toggle = screen.getByTestId('diagnostics-toggle');

    await user.click(toggle); // Open
    expect(screen.getByTestId('diagnostics-content')).toBeInTheDocument();

    await user.click(toggle); // Close
    expect(screen.queryByTestId('diagnostics-content')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows "disabled" when perParcelCap is 0', async () => {
    const diagZeroCap: EvidenceRailDiagnostics = {
      ...MOCK_DIAGNOSTICS,
      perParcelCap: 0,
    };
    renderRail({ showDiagnostics: true, diagnostics: diagZeroCap });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('diagnostics-toggle'));

    expect(screen.getByTestId('diag-per-parcel-cap')).toHaveTextContent('disabled');
  });

  it('shows dashes when timestamps are null', async () => {
    const diagNoTimestamps: EvidenceRailDiagnostics = {
      ...MOCK_DIAGNOSTICS,
      oldestEventTimestamp: null,
      newestEventTimestamp: null,
    };
    renderRail({ showDiagnostics: true, diagnostics: diagNoTimestamps });

    const user = userEvent.setup();
    await user.click(screen.getByTestId('diagnostics-toggle'));

    expect(screen.getByTestId('diag-oldest-event')).toHaveTextContent('—');
    expect(screen.getByTestId('diag-newest-event')).toHaveTextContent('—');
  });
});

// =========================================================================
// 5. BACKWARD COMPATIBILITY
// =========================================================================

describe('Lane I — backward compatibility', () => {
  it('renders timeline normally when no Lane I props are provided', () => {
    renderRail(); // No Lane I props
    expect(screen.getByTestId('evidence-timeline')).toBeInTheDocument();
    expect(screen.getAllByTestId('timeline-event')).toHaveLength(2);

    // No staleness or diagnostics
    expect(screen.queryByTestId('staleness-indicator')).not.toBeInTheDocument();
    expect(screen.queryByTestId('staleness-unavailable')).not.toBeInTheDocument();
    expect(screen.queryByTestId('diagnostics-drawer')).not.toBeInTheDocument();
  });
});

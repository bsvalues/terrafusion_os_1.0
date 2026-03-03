/**
 * EvidenceRail.test.tsx
 *
 * PR-UI2 — Unit tests for presentational EvidenceRail component.
 * 13 tests across 6 describe blocks:
 *  - Empty state (phase='empty', phase='ready' + 0 events)
 *  - Loading / polling visual states
 *  - Error state with retry
 *  - Timeline display (header, events, badges, summaries)
 *  - Gate 6 compliance (payloadRef as ref, redactedFields notice, no links)
 *  - Summary-only rendering (no raw payload)
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvidenceRail } from '../../components/pilot/EvidenceRail';
import type { PilotTraceEvent } from '../../api/pilotApi';
import type { TracePhase } from '../../hooks/useTraceByCorrelationId';

// ---------------------------------------------------------------------------
// Mock material components to avoid framer-motion dependency
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
// Test data
// ---------------------------------------------------------------------------

const MOCK_EVENTS: PilotTraceEvent[] = [
  {
    eventId: 'evt-1',
    type: 'tool_invoked',
    toolId: 'explain_value_change',
    correlationId: 'corr-abc-123',
    summary: 'Invoked explain_value_change for parcel P-001',
    timestamp: '2026-03-01T12:00:00.000Z',
    context: { countyId: 'benton', userId: 'u-1', mode: 'pilot', parcelId: 'P-001' },
  },
  {
    eventId: 'evt-2',
    type: 'tool_completed',
    toolId: 'explain_value_change',
    correlationId: 'corr-abc-123',
    summary: 'Value change explained — market adjustment +4.2 %',
    timestamp: '2026-03-01T12:00:01.500Z',
    context: { countyId: 'benton', userId: 'u-1', mode: 'pilot', parcelId: 'P-001' },
    payloadRef: 'dossier://evidence/doc-42',
    redactedFields: ['ownerSSN', 'ownerPhone'],
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EvidenceRail — empty state', () => {
  it('renders empty message when phase is "empty"', () => {
    render(<EvidenceRail phase="empty" events={[]} error={null} onRetry={jest.fn()} />);
    expect(screen.getByTestId('evidence-empty')).toBeInTheDocument();
    expect(screen.getByText(/no trace events recorded/i)).toBeInTheDocument();
  });

  it('renders empty message when phase is "ready" but events array is empty', () => {
    render(<EvidenceRail phase="ready" events={[]} error={null} onRetry={jest.fn()} />);
    expect(screen.getByTestId('evidence-empty')).toBeInTheDocument();
  });
});

describe('EvidenceRail — loading / polling', () => {
  it('renders loading indicator when phase is "loading"', () => {
    render(<EvidenceRail phase="loading" events={[]} error={null} onRetry={jest.fn()} />);
    expect(screen.getByTestId('evidence-loading')).toBeInTheDocument();
    expect(screen.getByText(/loading trace/i)).toBeInTheDocument();
  });

  it('renders polling indicator when phase is "polling"', () => {
    render(<EvidenceRail phase="polling" events={[]} error={null} onRetry={jest.fn()} />);
    expect(screen.getByTestId('evidence-loading')).toBeInTheDocument();
    expect(screen.getByText(/waiting for trace events/i)).toBeInTheDocument();
  });
});

describe('EvidenceRail — error state', () => {
  it('renders error message with retry button', async () => {
    const onRetry = jest.fn();
    render(<EvidenceRail phase="error" events={[]} error="Network failure" onRetry={onRetry} />);

    expect(screen.getByTestId('evidence-error')).toBeInTheDocument();
    expect(screen.getByText(/network failure/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('EvidenceRail — timeline display', () => {
  it('renders correlation header with metadata', () => {
    render(<EvidenceRail phase="ready" events={MOCK_EVENTS} error={null} onRetry={jest.fn()} />);

    const header = screen.getByTestId('evidence-header');
    expect(header).toBeInTheDocument();
    // Header should contain correlationId and event count
    expect(header.textContent).toContain('corr-abc-123');
    expect(header.textContent).toContain('2 events');
  });

  it('renders all timeline events', () => {
    render(<EvidenceRail phase="ready" events={MOCK_EVENTS} error={null} onRetry={jest.fn()} />);

    const events = screen.getAllByTestId('timeline-event');
    expect(events).toHaveLength(2);
  });

  it('renders type badges for each event', () => {
    render(<EvidenceRail phase="ready" events={MOCK_EVENTS} error={null} onRetry={jest.fn()} />);

    const badges = screen.getAllByTestId('event-type-badge');
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveTextContent('tool_invoked');
    expect(badges[1]).toHaveTextContent('tool_completed');
  });

  it('renders event summaries', () => {
    render(<EvidenceRail phase="ready" events={MOCK_EVENTS} error={null} onRetry={jest.fn()} />);

    const summaries = screen.getAllByTestId('event-summary');
    expect(summaries[0]).toHaveTextContent('Invoked explain_value_change for parcel P-001');
    expect(summaries[1]).toHaveTextContent('Value change explained');
  });
});

describe('EvidenceRail — Gate 6 compliance', () => {
  it('shows payloadRef as reference text, not as a link', () => {
    render(<EvidenceRail phase="ready" events={MOCK_EVENTS} error={null} onRetry={jest.fn()} />);

    const payloadRef = screen.getByTestId('payload-ref');
    expect(payloadRef).toHaveTextContent('Payload stored: dossier://evidence/doc-42');
    // Must NOT be a link — Gate 6
    expect(payloadRef.tagName.toLowerCase()).not.toBe('a');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows redacted-fields notice with count', () => {
    render(<EvidenceRail phase="ready" events={MOCK_EVENTS} error={null} onRetry={jest.fn()} />);

    const notice = screen.getByTestId('redacted-notice');
    expect(notice).toHaveTextContent('2 fields redacted');
  });

  it('does not render raw field names in redacted notice', () => {
    render(<EvidenceRail phase="ready" events={MOCK_EVENTS} error={null} onRetry={jest.fn()} />);

    const notice = screen.getByTestId('redacted-notice');
    expect(notice.textContent).not.toContain('ownerSSN');
    expect(notice.textContent).not.toContain('ownerPhone');
  });
});

describe('EvidenceRail — summary-only rendering', () => {
  it('renders only summary text, no raw JSON or payload body', () => {
    render(<EvidenceRail phase="ready" events={MOCK_EVENTS} error={null} onRetry={jest.fn()} />);

    const timeline = screen.getByTestId('evidence-timeline');
    const text = timeline.textContent ?? '';
    // Should contain summary text
    expect(text).toContain('Value change explained');
    // Should NOT contain raw JSON or payload body indicators
    expect(text).not.toContain('"result"');
    expect(text).not.toContain('"payload"');
  });
});

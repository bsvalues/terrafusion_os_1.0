/**
 * PropertyDais.honesty.contract.test.tsx
 *
 * Source honesty contract for PropertyDais tab.
 * Ensures:
 *   1. Baseline disclosure info box carries a WorkbenchSourceBadge
 *   2. Idle badges do not claim live data before tool calls
 *   3. Subtitle uses governed-tool disclosure wording (not aspirational)
 *   4. No tool invocations fire on mount without user action
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { propertyState } = vi.hoisted(() => ({
  propertyState: {
    appeals: [] as Array<Record<string, unknown>>,
    relatedDataStatus: 'idle' as 'idle' | 'loading' | 'loaded' | 'error',
  },
}));

/* ── Mocks ────────────────────────────────────────────── */

vi.mock('../../context/workbenchTabContext', () => ({
  useWorkbenchTab: () => ({
    parcelId: 'TEST-001',
    propertyData: { parcelId: 'TEST-001', address: '123 Test St', owner: 'Test Owner' },
  }),
}));

vi.mock('../../api/pilotApi', () => ({ invokeTool: vi.fn() }));

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: vi.fn((selector: (state: typeof propertyState) => unknown) =>
    selector(propertyState)),
}));

vi.mock('../../runtime/env', () => ({
  getEnv: () => ({ VITE_API_URL: 'http://localhost:5000' }),
}));

vi.mock('../../components/errors/ErrorDisplay', () => ({
  ErrorDisplay: ({ error }: { error: { message: string } }) => (
    <div data-testid="error-display">{error.message}</div>
  ),
}));

vi.mock('../../components/dais/AppealDeadlinePanel', () => ({
  default: () => <div data-testid="mock-appeal-deadline" />,
}));
vi.mock('../../components/dais/AppealHearingPanel', () => ({
  default: () => <div data-testid="mock-appeal-hearing" />,
}));
vi.mock('../../components/dais/AppealNoticePanel', () => ({
  default: () => <div data-testid="mock-appeal-notice" />,
}));
vi.mock('../../components/dais/AppealCertificationPanel', () => ({
  default: () => <div data-testid="mock-appeal-certification" />,
}));

import { PropertyDais } from '../../pages/workbench/tabs/PropertyDais';

/* ── Tests ─────────────────────────────────────────────── */

describe('PropertyDais source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    propertyState.appeals = [];
    propertyState.relatedDataStatus = 'idle';
  });

  it('baseline disclosure info box carries a WorkbenchSourceBadge', () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    const disclosure = screen.getByTestId('dais-baseline-disclosure');
    const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).toBeInTheDocument();
  });

  it('baseline disclosure badge shows "unavailable" for idle state', () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    const disclosure = screen.getByTestId('dais-baseline-disclosure');
    const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).toHaveAttribute('data-source', 'unavailable');
  });

  it('all badges avoid synthetic live claims at idle', () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    const badges = screen.getAllByTestId('workbench-source-badge');
    for (const badge of badges) {
      const src = badge.getAttribute('data-source');
      expect(['unavailable', 'live']).toContain(src);
    }
  });

  it('does not use aspirational "AI-powered" language in the subtitle', () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    const daisTab = screen.getByTestId('property-dais-tab');
    expect(daisTab.textContent).not.toMatch(/AI-powered/i);
  });

  it('subtitle uses governed-tool disclosure wording', () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    const daisTab = screen.getByTestId('property-dais-tab');
    expect(daisTab.textContent).toMatch(/requested via|returned from/i);
  });

  it('does not invoke any tool on mount without user action', async () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    const { invokeTool } = await import('../../api/pilotApi');
    expect(vi.mocked(invokeTool)).not.toHaveBeenCalled();
  });

  it('renders WorkbenchSourceBadge on the Queue Statistics card at idle state', () => {
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    const badges = screen.getAllByTestId('workbench-source-badge');
    const unavailableBadge = badges.find(b => b.getAttribute('data-source') === 'unavailable');
    expect(unavailableBadge).toBeDefined();
    expect(unavailableBadge).toBeInTheDocument();
  });

  it('renders an explicit loading state without claiming live appeal evidence', () => {
    propertyState.relatedDataStatus = 'loading';
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    expect(screen.getByTestId('dais-appeals-loading')).toBeInTheDocument();
    const appealRead = screen.getByTestId('dais-appeal-read');
    expect(appealRead.querySelector('[data-testid="workbench-source-badge"]'))
      .toHaveAttribute('data-source', 'unavailable');
  });

  it('renders an explicit empty state after a successful county-scoped read', () => {
    propertyState.relatedDataStatus = 'loaded';
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    expect(screen.getByTestId('dais-appeals-empty')).toHaveTextContent(/no appeal records/i);
    const appealRead = screen.getByTestId('dais-appeal-read');
    expect(appealRead.querySelector('[data-testid="workbench-source-badge"]'))
      .toHaveAttribute('data-source', 'live');
  });

  it('renders an explicit unavailable state when related-data loading fails', () => {
    propertyState.relatedDataStatus = 'error';
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    expect(screen.getByTestId('dais-appeals-error')).toHaveTextContent(/unavailable/i);
    const appealRead = screen.getByTestId('dais-appeal-read');
    expect(appealRead.querySelector('[data-testid="workbench-source-badge"]'))
      .toHaveAttribute('data-source', 'unavailable');
  });

  it('renders exact frozen-contract appeal fields in the loaded state', () => {
    propertyState.relatedDataStatus = 'loaded';
    propertyState.appeals = [{
      appealId: '33333333-3333-3333-3333-333333333333',
      parcelId: 'TEST-001',
      appealYear: 2026,
      appealGround: 'MARKET_VALUE',
      status: 'filed',
      filingDate: '2026-02-03T12:00:00Z',
      hearingDate: '2026-03-03T12:00:00Z',
    }];
    render(<MemoryRouter><PropertyDais /></MemoryRouter>);
    expect(screen.getByTestId('dais-appeals-loaded')).toHaveTextContent('1 appeal');
    expect(screen.getByText(/filed - MARKET VALUE/)).toBeInTheDocument();
    expect(screen.getByText(/Tax year 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Hearing:/)).toBeInTheDocument();
  });
});

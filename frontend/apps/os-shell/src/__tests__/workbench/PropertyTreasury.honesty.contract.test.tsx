/**
 * PropertyTreasury.honesty.contract.test.tsx
 *
 * Source honesty contract for the PropertyTreasury tab (WO-WB-INSTR-004).
 * Mirrors the Clerk/Pilot/Dossier/Dais honesty contracts. Ensures:
 *   1. Baseline disclosure box carries a WorkbenchSourceBadge
 *   2. That badge shows "unavailable" before/while the parcel evidence loads and on error
 *   3. It reflects "live" once the parcel evidence bundle loads successfully —
 *      including a successful load that returns zero tax statements (load-success
 *      provenance, NOT statement row count), and it flips on the empty -> loaded
 *      transition (not memoized at mount)
 *   4. No aspirational "AI-powered" language
 *   5. Baseline disclosure uses governed / live-evidence / never-inferred wording
 *   6. No tool is invoked on mount (the tab only lists tools)
 *
 * Reuses the mock setup from PropertyTreasury.test.tsx.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import * as pilotApi from '../../api/pilotApi';
import PropertyTreasury from '../../pages/workbench/tabs/PropertyTreasury';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/pilotApi');

interface StoreView {
  taxStatements: Array<{
    statementId: string;
    taxYear: number;
    totalTaxDue: number;
    totalPaid: number;
    delinquent: boolean;
  }>;
  activeParcel: { parcelId: string } | null;
  activeParcelLoading: boolean;
  activeParcelError: { message: string } | null;
}

let storeView: StoreView = {
  taxStatements: [],
  activeParcel: null,
  activeParcelLoading: false,
  activeParcelError: null,
};

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (s: StoreView) => unknown) =>
    typeof selector === 'function' ? selector(storeView) : storeView,
}));

vi.mock('../../components/workbench', () => ({
  ParcelContextHeader: ({ title, parcelId, subtitle }: { title: string; parcelId: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      <span>{parcelId}</span>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
  InvocationHistory: () => <div data-testid='invocation-history' />,
  WorkbenchSourceBadge: ({ source }: { source: string }) => (
    <span data-testid='workbench-source-badge' data-source={source} />
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockInvokeTool = pilotApi.invokeTool as ReturnType<typeof vi.fn>;

const PARCEL_ID = 'BC-2026-001';

const TestWrapper: React.FC<{ parcelId?: string }> = ({ parcelId = PARCEL_ID }) => (
  <MemoryRouter initialEntries={[`/property/${parcelId}/treasury`]}>
    <Routes>
      <Route
        path='/property/:parcelId'
        element={<Outlet context={{ parcelId, propertyData: {}, workMode: 'overview' }} />}
      >
        <Route path='treasury' element={<PropertyTreasury />} />
      </Route>
    </Routes>
  </MemoryRouter>
);

const badgeSource = () =>
  screen
    .getByTestId('treasury-baseline-disclosure')
    .querySelector('[data-testid="workbench-source-badge"]')
    ?.getAttribute('data-source');

const oneStatement = [
  { statementId: 'TS-2026', taxYear: 2026, totalTaxDue: 3200, totalPaid: 1600, delinquent: false },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PropertyTreasury source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeView = {
      taxStatements: [],
      activeParcel: null,
      activeParcelLoading: false,
      activeParcelError: null,
    };
  });

  it('baseline disclosure box carries a WorkbenchSourceBadge', () => {
    render(<TestWrapper />);
    const disclosure = screen.getByTestId('treasury-baseline-disclosure');
    expect(disclosure.querySelector('[data-testid="workbench-source-badge"]')).toBeInTheDocument();
  });

  it('baseline badge shows "unavailable" before the parcel evidence loads', () => {
    render(<TestWrapper />);
    expect(badgeSource()).toBe('unavailable');
  });

  it('baseline badge shows "unavailable" while the parcel evidence is loading', () => {
    storeView = { ...storeView, activeParcelLoading: true };
    render(<TestWrapper />);
    expect(badgeSource()).toBe('unavailable');
  });

  it('baseline badge shows "unavailable" when the parcel evidence load errored', () => {
    storeView = {
      ...storeView,
      activeParcel: { parcelId: PARCEL_ID },
      activeParcelError: { message: 'load failed' },
    };
    render(<TestWrapper />);
    expect(badgeSource()).toBe('unavailable');
  });

  it('baseline badge reflects "live" on a successful evidence load even with zero tax statements', () => {
    storeView = {
      taxStatements: [],
      activeParcel: { parcelId: PARCEL_ID },
      activeParcelLoading: false,
      activeParcelError: null,
    };
    render(<TestWrapper />);
    expect(badgeSource()).toBe('live');
  });

  it('baseline badge flips unavailable -> live on the empty -> loaded transition (not memoized)', () => {
    const { rerender } = render(<TestWrapper />);
    expect(badgeSource()).toBe('unavailable');

    storeView = {
      taxStatements: oneStatement,
      activeParcel: { parcelId: PARCEL_ID },
      activeParcelLoading: false,
      activeParcelError: null,
    };
    rerender(<TestWrapper />);
    expect(badgeSource()).toBe('live');
  });

  it('baseline badge shows "unavailable" when the store holds a DIFFERENT parcel (stale nav frame)', () => {
    // During parcel-to-parcel navigation the store can still hold the previous
    // activeParcel for one frame; that must not read as live for this tab's parcel.
    storeView = {
      taxStatements: oneStatement,
      activeParcel: { parcelId: 'SOME-OTHER-PARCEL' },
      activeParcelLoading: false,
      activeParcelError: null,
    };
    render(<TestWrapper parcelId={PARCEL_ID} />);
    expect(badgeSource()).toBe('unavailable');
  });

  it('all badges avoid synthetic claims (unavailable or live only)', () => {
    storeView = {
      taxStatements: oneStatement,
      activeParcel: { parcelId: PARCEL_ID },
      activeParcelLoading: false,
      activeParcelError: null,
    };
    render(<TestWrapper />);
    for (const badge of screen.getAllByTestId('workbench-source-badge')) {
      expect(['unavailable', 'live']).toContain(badge.getAttribute('data-source'));
    }
  });

  it('disclosure copy is state-aware — never claims live loading while the badge reads unavailable', () => {
    // Idle: badge unavailable, so the copy must NOT assert the parcel is loaded live.
    const { rerender } = render(<TestWrapper />);
    let disclosure = screen.getByTestId('treasury-baseline-disclosure');
    expect(disclosure.textContent).toMatch(/not currently available/i);
    expect(disclosure.textContent).not.toMatch(/is loaded from the live property evidence feed/i);

    // Loaded: badge live, so the copy asserts the live-loaded state.
    storeView = {
      taxStatements: oneStatement,
      activeParcel: { parcelId: PARCEL_ID },
      activeParcelLoading: false,
      activeParcelError: null,
    };
    rerender(<TestWrapper />);
    disclosure = screen.getByTestId('treasury-baseline-disclosure');
    expect(disclosure.textContent).toMatch(/is loaded from the live property evidence feed/i);
  });

  it('does not use aspirational "AI-powered" language', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('property-treasury-tab').textContent).not.toMatch(/AI-powered/i);
  });

  it('baseline disclosure uses governed / live-evidence / never-inferred wording', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('treasury-baseline-disclosure').textContent).toMatch(
      /governed|live property evidence|never inferred/i,
    );
  });

  it('does not invoke any tool on mount without user action', () => {
    render(<TestWrapper />);
    expect(mockInvokeTool).not.toHaveBeenCalled();
  });
});

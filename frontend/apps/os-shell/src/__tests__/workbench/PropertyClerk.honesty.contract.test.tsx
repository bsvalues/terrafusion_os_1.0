/**
 * PropertyClerk.honesty.contract.test.tsx
 *
 * Source honesty contract for the PropertyClerk tab (WO-WB-INSTR-003).
 * Mirrors the Dossier/Pilot/Dais honesty contracts. Ensures:
 *   1. Baseline disclosure box carries a WorkbenchSourceBadge
 *   2. That badge shows "unavailable" when the parcel evidence has not loaded
 *   3. It reflects "live" once the parcel evidence bundle loads successfully —
 *      including a successful load that returns zero recordings (load-success
 *      provenance, NOT recording row count), and it flips on the empty -> loaded
 *      transition (not memoized at mount)
 *   4. No aspirational "AI-powered" language
 *   5. Baseline disclosure uses governed / live-evidence / never-inferred wording
 *   6. No tool is invoked on mount (the tab only lists tools)
 *
 * Reuses the mock setup from PropertyClerk.test.tsx.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import * as pilotApi from '../../api/pilotApi';
import PropertyClerk from '../../pages/workbench/tabs/PropertyClerk';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/pilotApi');

// Mutable store view driven per-test to exercise the load-provenance states.
interface StoreView {
  recordings: Array<{
    recordingId: string;
    documentType: string;
    grantor?: string;
    grantee?: string;
    recordingDate: string;
  }>;
  activeParcel: { parcelId: string } | null;
  activeParcelLoading: boolean;
  activeParcelError: { message: string } | null;
}

let storeView: StoreView = {
  recordings: [],
  activeParcel: null,
  activeParcelLoading: false,
  activeParcelError: null,
};

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (s: StoreView) => unknown) =>
    typeof selector === 'function' ? selector(storeView) : storeView,
}));

vi.mock('../../runtime/env', () => ({
  getEnv: () => ({ VITE_API_URL: 'http://localhost:5000' }),
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
  <MemoryRouter initialEntries={[`/property/${parcelId}/clerk`]}>
    <Routes>
      <Route
        path='/property/:parcelId'
        element={<Outlet context={{ parcelId, propertyData: {}, workMode: 'overview' }} />}
      >
        <Route path='clerk' element={<PropertyClerk />} />
      </Route>
    </Routes>
  </MemoryRouter>
);

const badgeSource = () =>
  screen
    .getByTestId('clerk-baseline-disclosure')
    .querySelector('[data-testid="workbench-source-badge"]')
    ?.getAttribute('data-source');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PropertyClerk source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeView = {
      recordings: [],
      activeParcel: null,
      activeParcelLoading: false,
      activeParcelError: null,
    };
  });

  it('baseline disclosure box carries a WorkbenchSourceBadge', () => {
    render(<TestWrapper />);
    const disclosure = screen.getByTestId('clerk-baseline-disclosure');
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

  it('baseline badge reflects "live" on a successful evidence load even with zero recordings', () => {
    // Load-success provenance, NOT row count: a live load returning no recordings
    // is still live, not unavailable.
    storeView = {
      recordings: [],
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

    // Parcel evidence finishes loading successfully.
    storeView = {
      recordings: [
        { recordingId: 'REC-1', documentType: 'Deed', grantor: 'Alice', grantee: 'Bob', recordingDate: '2026-01-15' },
      ],
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
      recordings: [
        { recordingId: 'REC-1', documentType: 'Deed', grantor: 'Alice', grantee: 'Bob', recordingDate: '2026-01-15' },
      ],
      activeParcel: { parcelId: 'SOME-OTHER-PARCEL' },
      activeParcelLoading: false,
      activeParcelError: null,
    };
    render(<TestWrapper parcelId={PARCEL_ID} />);
    expect(badgeSource()).toBe('unavailable');
  });

  it('disclosure copy is state-aware — never claims live loading while the badge reads unavailable', () => {
    // Idle: badge unavailable, so the copy must NOT assert the parcel is loaded live.
    const { rerender } = render(<TestWrapper />);
    let disclosure = screen.getByTestId('clerk-baseline-disclosure');
    expect(disclosure.textContent).toMatch(/not currently available/i);
    expect(disclosure.textContent).not.toMatch(/is loaded from the live property evidence feed/i);

    // Loaded: badge live, so the copy asserts the live-loaded state.
    storeView = {
      recordings: [],
      activeParcel: { parcelId: PARCEL_ID },
      activeParcelLoading: false,
      activeParcelError: null,
    };
    rerender(<TestWrapper />);
    disclosure = screen.getByTestId('clerk-baseline-disclosure');
    expect(disclosure.textContent).toMatch(/is loaded from the live property evidence feed/i);
  });

  it('all badges avoid synthetic claims (unavailable or live only)', () => {
    storeView = {
      recordings: [],
      activeParcel: { parcelId: PARCEL_ID },
      activeParcelLoading: false,
      activeParcelError: null,
    };
    render(<TestWrapper />);
    for (const badge of screen.getAllByTestId('workbench-source-badge')) {
      expect(['unavailable', 'live']).toContain(badge.getAttribute('data-source'));
    }
  });

  it('does not use aspirational "AI-powered" language', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('property-clerk-tab').textContent).not.toMatch(/AI-powered/i);
  });

  it('baseline disclosure uses governed / live-evidence / never-inferred wording', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('clerk-baseline-disclosure').textContent).toMatch(
      /governed|live property evidence|never inferred/i,
    );
  });

  it('does not invoke any tool on mount without user action', () => {
    render(<TestWrapper />);
    expect(mockInvokeTool).not.toHaveBeenCalled();
  });
});

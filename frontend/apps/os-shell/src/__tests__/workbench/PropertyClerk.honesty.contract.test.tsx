/**
 * PropertyClerk.honesty.contract.test.tsx
 *
 * Source honesty contract for the PropertyClerk tab (WO-WB-INSTR-003, slice-aware
 * under WO-WB-PROV-003). Ensures:
 *   1. Baseline disclosure box carries a WorkbenchSourceBadge
 *   2. That badge shows "unavailable" until the related-data bundle (which holds
 *      the recordings slice) has loaded — including while the parcel shell is up
 *      but the bundle is still loading, and after a bundle load error
 *   3. It reflects "live" once relatedDataStatus === 'loaded' for THIS parcel —
 *      including a successful load that returns zero recordings (load-success
 *      provenance, NOT recording row count), and it flips on the transition
 *      (not memoized at mount)
 *   4. A stale previous parcel's loaded status does not read as live (parcelId guard)
 *   5. No aspirational "AI-powered" language; state-aware disclosure copy
 *   6. No tool is invoked on mount (the tab only lists tools)
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import * as pilotApi from '../../api/pilotApi';
import PropertyClerk from '../../pages/workbench/tabs/PropertyClerk';
// Type-only import (erased at runtime) so the test's status union stays aligned
// with the store's real state machine while the module is still runtime-mocked below.
import type { RelatedDataStatus } from '../../stores/propertyStore';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/pilotApi');

// Mutable store view driven per-test to exercise the slice-load-provenance states.
interface StoreView {
  recordings: Array<{
    recordingId: string;
    documentType: string;
    grantor?: string;
    grantee?: string;
    recordingDate: string;
  }>;
  activeParcel: { parcelId: string } | null;
  relatedDataStatus: RelatedDataStatus;
}

let storeView: StoreView = {
  recordings: [],
  activeParcel: null,
  relatedDataStatus: 'idle',
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

const loadedFor = (parcelId: string, recordings: StoreView['recordings'] = []): StoreView => ({
  recordings,
  activeParcel: { parcelId },
  relatedDataStatus: 'loaded',
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PropertyClerk source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeView = {
      recordings: [],
      activeParcel: null,
      relatedDataStatus: 'idle',
    };
  });

  it('baseline disclosure box carries a WorkbenchSourceBadge', () => {
    render(<TestWrapper />);
    const disclosure = screen.getByTestId('clerk-baseline-disclosure');
    expect(disclosure.querySelector('[data-testid="workbench-source-badge"]')).toBeInTheDocument();
  });

  it('baseline badge shows "unavailable" before the parcel evidence loads (idle)', () => {
    render(<TestWrapper />);
    expect(badgeSource()).toBe('unavailable');
  });

  it('baseline badge shows "unavailable" while the parcel shell is up but the related bundle is still loading', () => {
    // Slice-aware: activeParcel is set for this parcel, but relatedDataStatus is
    // 'loading' — the recordings bundle has not resolved, so the badge is NOT live.
    storeView = { ...storeView, activeParcel: { parcelId: PARCEL_ID }, relatedDataStatus: 'loading' };
    render(<TestWrapper />);
    expect(badgeSource()).toBe('unavailable');
  });

  it('baseline badge shows "unavailable" when the related evidence bundle load errored', () => {
    storeView = { ...storeView, activeParcel: { parcelId: PARCEL_ID }, relatedDataStatus: 'error' };
    render(<TestWrapper />);
    expect(badgeSource()).toBe('unavailable');
  });

  it('baseline badge reflects "live" on a loaded bundle even with zero recordings', () => {
    // Load-success provenance, NOT row count: a loaded bundle with no recordings
    // is still live, not unavailable.
    storeView = loadedFor(PARCEL_ID, []);
    render(<TestWrapper />);
    expect(badgeSource()).toBe('live');
  });

  it('baseline badge flips unavailable -> live on the loading -> loaded transition (not memoized)', () => {
    storeView = { ...storeView, activeParcel: { parcelId: PARCEL_ID }, relatedDataStatus: 'loading' };
    const { rerender } = render(<TestWrapper />);
    expect(badgeSource()).toBe('unavailable');

    // Related bundle finishes loading successfully.
    storeView = loadedFor(PARCEL_ID, [
      { recordingId: 'REC-1', documentType: 'Deed', grantor: 'Alice', grantee: 'Bob', recordingDate: '2026-01-15' },
    ]);
    rerender(<TestWrapper />);
    expect(badgeSource()).toBe('live');
  });

  it('baseline badge shows "unavailable" when a DIFFERENT parcel bundle is loaded (stale nav frame)', () => {
    // During parcel-to-parcel navigation the store can still hold the previous
    // parcel's loaded bundle for one frame; that must not read as live here.
    storeView = loadedFor('SOME-OTHER-PARCEL', [
      { recordingId: 'REC-1', documentType: 'Deed', grantor: 'Alice', grantee: 'Bob', recordingDate: '2026-01-15' },
    ]);
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
    storeView = loadedFor(PARCEL_ID, []);
    rerender(<TestWrapper />);
    disclosure = screen.getByTestId('clerk-baseline-disclosure');
    expect(disclosure.textContent).toMatch(/is loaded from the live property evidence feed/i);
  });

  it('all badges avoid synthetic claims (unavailable or live only)', () => {
    storeView = loadedFor(PARCEL_ID, []);
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

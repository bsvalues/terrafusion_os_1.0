/**
 * PropertyClerk.honesty.contract.test.tsx
 *
 * Source honesty contract for the PropertyClerk tab (WO-WB-INSTR-003).
 * Mirrors the Dossier/Pilot/Dais honesty contracts. Ensures:
 *   1. Baseline disclosure box carries a WorkbenchSourceBadge
 *   2. That badge shows "unavailable" when no recording history is loaded
 *   3. It reflects "live" once recording history is loaded (state-driven, not hardcoded)
 *   4. No aspirational "AI-powered" language
 *   5. Baseline disclosure uses governed / returned-from wording
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

let clerkRecordings: Array<{
  recordingId: string;
  documentType: string;
  grantor?: string;
  grantee?: string;
  recordingDate: string;
}> = [];

vi.mock('../../stores/propertyStore', () => ({
  usePropertyStore: (selector: (s: { recordings: typeof clerkRecordings }) => unknown) => {
    const state = { recordings: clerkRecordings };
    return typeof selector === 'function' ? selector(state) : state;
  },
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

const oneRecording = [
  {
    recordingId: 'REC-1',
    documentType: 'Deed',
    grantor: 'Alice',
    grantee: 'Bob',
    recordingDate: '2026-01-15',
  },
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PropertyClerk source honesty contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clerkRecordings = [];
  });

  it('baseline disclosure box carries a WorkbenchSourceBadge', () => {
    render(<TestWrapper />);
    const disclosure = screen.getByTestId('clerk-baseline-disclosure');
    expect(disclosure.querySelector('[data-testid="workbench-source-badge"]')).toBeInTheDocument();
  });

  it('baseline badge shows "unavailable" when no recording history is loaded', () => {
    clerkRecordings = [];
    render(<TestWrapper />);
    const disclosure = screen.getByTestId('clerk-baseline-disclosure');
    const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).toHaveAttribute('data-source', 'unavailable');
  });

  it('baseline badge reflects live once recording history is loaded', () => {
    clerkRecordings = oneRecording;
    render(<TestWrapper />);
    const disclosure = screen.getByTestId('clerk-baseline-disclosure');
    const badge = disclosure.querySelector('[data-testid="workbench-source-badge"]');
    expect(badge).toHaveAttribute('data-source', 'live');
  });

  it('all badges avoid synthetic claims (unavailable or live only)', () => {
    clerkRecordings = oneRecording;
    render(<TestWrapper />);
    for (const badge of screen.getAllByTestId('workbench-source-badge')) {
      expect(['unavailable', 'live']).toContain(badge.getAttribute('data-source'));
    }
  });

  it('does not use aspirational "AI-powered" language', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('property-clerk-tab').textContent).not.toMatch(/AI-powered/i);
  });

  it('baseline disclosure uses governed / returned-from wording', () => {
    render(<TestWrapper />);
    expect(screen.getByTestId('clerk-baseline-disclosure').textContent).toMatch(/governed|returned from|never inferred/i);
  });

  it('does not invoke any tool on mount without user action', () => {
    render(<TestWrapper />);
    expect(mockInvokeTool).not.toHaveBeenCalled();
  });
});

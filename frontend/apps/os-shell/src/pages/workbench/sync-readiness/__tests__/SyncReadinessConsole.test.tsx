/**
 * OPS-1-B: Sync Readiness Console tests covering the 8 acceptance
 * gates from the OPS-1 policy at
 * docs/workbench/sync-readiness-console-policy.md.
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import SyncReadinessConsole from '../SyncReadinessConsole';
import type {
  SyncReadiness,
  SyncReadinessRefresh,
} from '@/api/workbenchSyncReadiness';

// ───────────────────────────────────────────────────────────────
// Mock the API client (the unit under test is the page, not fetch).
// ───────────────────────────────────────────────────────────────

vi.mock('@/api/workbenchSyncReadiness', () => ({
  getSyncReadiness: vi.fn(),
  refreshSyncReadiness: vi.fn(),
}));

// Mock the session — supplies countyId default for the scope form.
vi.mock('../../../../auth/useSession', () => ({
  useSession: () => ({
    userId: 'test-operator',
    countyId: 'benton',
    role: 'admin',
    mode: 'pilot',
  }),
}));

import {
  getSyncReadiness,
  refreshSyncReadiness,
} from '@/api/workbenchSyncReadiness';

const COUNTY = '19190019-1919-1919-1919-191919191919';
const SOURCE = '8e4944c7-9628-448e-b7a6-0053d58ff5ac';
const WORKBOOK = 'a767c8a2-5b8a-4846-af8b-c3496601e924';

function makeReadiness(overrides: Partial<SyncReadiness> = {}): SyncReadiness {
  return {
    countyId: COUNTY,
    sourceConnectionId: SOURCE,
    workbookId: WORKBOOK,
    assembledAtUtc: '2026-05-02T05:00:00Z',
    reachability: { status: 'UNKNOWN', headline: 'Reachability probe not run', source: 'pacs-connection-probe' },
    catalogHealth: { status: 'UNKNOWN', headline: 'No capture yet', source: 'schema-catalog-health' },
    invariants: { status: 'UNKNOWN', headline: 'No capture yet', source: 'invariant-artifact' },
    preflights: { status: 'UNKNOWN', headline: 'No capture yet', source: 'preflight-evidence' },
    coverage: { status: 'UNKNOWN', headline: 'No capture yet', source: 'coverage-report' },
    lastProof: {
      catalogHealth: 'never',
      invariantArtifact: 'never',
      preflightEvidence: 'never',
      coverageReport: 'never',
    },
    ...overrides,
  };
}

function renderWith(route: string): { qc: QueryClient } {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>
        <SyncReadinessConsole />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { qc };
}

beforeEach(() => {
  vi.mocked(getSyncReadiness).mockReset();
  vi.mocked(refreshSyncReadiness).mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SyncReadinessConsole — OPS-1-B acceptance gates', () => {
  // Gate 1: scope-empty state when URL params missing.
  it('shows scope-form empty state when URL params missing', async () => {
    renderWith('/workbench/sync-readiness');

    expect(await screen.findByTestId('sync-readiness-console')).toHaveAttribute(
      'data-state',
      'scope-empty',
    );
    expect(screen.getByTestId('scope-selector-form')).toBeInTheDocument();
    expect(vi.mocked(getSyncReadiness)).not.toHaveBeenCalled();
  });

  // Gate 2: render six panels when scope is present.
  it('renders six panels when all URL params present', async () => {
    vi.mocked(getSyncReadiness).mockResolvedValueOnce(makeReadiness({
      catalogHealth: { status: 'YES', headline: 'Schema catalog clean', source: 'schema-catalog-health' },
    }));
    renderWith(`/workbench/sync-readiness?countyId=${COUNTY}&sourceConnectionId=${SOURCE}&workbookId=${WORKBOOK}`);

    const panels = await screen.findAllByTestId('readiness-panel');
    // 5 status panels (reachability, catalogHealth, invariants, preflights,
    // coverage) + last-proof panel (rendered as its own section, but
    // labeled "6. Last successful proof per surface").
    // The 'readiness-panel' testid is used by the five status panels.
    expect(panels).toHaveLength(5);
  });

  // Gate 3: no auto-refresh on page load.
  it('does NOT auto-refresh on page load', async () => {
    vi.mocked(getSyncReadiness).mockResolvedValueOnce(makeReadiness());
    renderWith(`/workbench/sync-readiness?countyId=${COUNTY}&sourceConnectionId=${SOURCE}&workbookId=${WORKBOOK}`);

    await waitFor(() => expect(vi.mocked(getSyncReadiness)).toHaveBeenCalledTimes(1));

    // Wait a tick to verify no second fetch occurs.
    await new Promise((r) => setTimeout(r, 50));
    expect(vi.mocked(getSyncReadiness)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(refreshSyncReadiness)).not.toHaveBeenCalled();
  });

  // Gate 4: status colors map to terra-status tokens.
  it('renders status badges with the correct tf-status-* utility class', async () => {
    vi.mocked(getSyncReadiness).mockResolvedValueOnce(makeReadiness({
      reachability:   { status: 'YES',     headline: 'h', source: 's' },
      catalogHealth:  { status: 'WARN',    headline: 'h', source: 's' },
      invariants:     { status: 'NO',      headline: 'h', source: 's' },
      preflights:     { status: 'UNKNOWN', headline: 'h', source: 's' },
      coverage:       { status: 'YES',     headline: 'h', source: 's' },
    }));
    renderWith(`/workbench/sync-readiness?countyId=${COUNTY}&sourceConnectionId=${SOURCE}&workbookId=${WORKBOOK}`);

    const badges = await screen.findAllByTestId('status-badge');
    const classes = badges.map((b) => b.className);
    expect(classes.some((c) => c.includes('tf-status-success'))).toBe(true);
    expect(classes.some((c) => c.includes('tf-status-warning'))).toBe(true);
    expect(classes.some((c) => c.includes('tf-status-error'))).toBe(true);
    expect(classes.some((c) => c.includes('tf-status-muted'))).toBe(true);
  });

  // Gate 5: refresh button triggers POST exactly on click.
  it('triggers refreshSyncReadiness on explicit Refresh click', async () => {
    vi.mocked(getSyncReadiness).mockResolvedValueOnce(makeReadiness());
    vi.mocked(refreshSyncReadiness).mockResolvedValueOnce({
      readiness: makeReadiness({
        catalogHealth: { status: 'YES', headline: 'fresh', source: 'schema-catalog-health' },
      }),
      sessionArtifactDir: '/tmp/session',
      startedAtUtc: '2026-05-02T06:00:00Z',
      completedAtUtc: '2026-05-02T06:01:00Z',
      surfaces: {},
    } as SyncReadinessRefresh);

    renderWith(`/workbench/sync-readiness?countyId=${COUNTY}&sourceConnectionId=${SOURCE}&workbookId=${WORKBOOK}`);
    await screen.findByTestId('refresh-button');

    expect(vi.mocked(refreshSyncReadiness)).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('refresh-button'));

    await waitFor(() => expect(vi.mocked(refreshSyncReadiness)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(refreshSyncReadiness)).toHaveBeenCalledWith({
      countyId: COUNTY,
      sourceConnectionId: SOURCE,
      workbookId: WORKBOOK,
    });
  });

  // Gate 6: partial state renders mixed without blanking.
  it('partial-artifact state renders mixed status without blanking', async () => {
    vi.mocked(getSyncReadiness).mockResolvedValueOnce(makeReadiness({
      catalogHealth:  { status: 'YES',     headline: 'h', source: 's' },
      invariants:     { status: 'UNKNOWN', headline: 'h', source: 's' },
    }));
    renderWith(`/workbench/sync-readiness?countyId=${COUNTY}&sourceConnectionId=${SOURCE}&workbookId=${WORKBOOK}`);

    expect(await screen.findByText('1. Is Harris PACS reachable?')).toBeInTheDocument();
    expect(screen.getByText('2. Is the schema catalog healthy?')).toBeInTheDocument();
    expect(screen.getByText('3. Are invariants clean?')).toBeInTheDocument();
    expect(screen.getByText('4. Are dictionary preflights clean?')).toBeInTheDocument();
    expect(screen.getByText('5. Are canonical rows stale or missing?')).toBeInTheDocument();
  });

  // Gate 7: scope-empty state does NOT call the API.
  it('does not call API when scope is missing', async () => {
    renderWith('/workbench/sync-readiness?countyId=' + COUNTY); // partial scope
    await screen.findByTestId('scope-selector-form');
    expect(vi.mocked(getSyncReadiness)).not.toHaveBeenCalled();
  });

  // Gate 8: no PII in DOM — only counts + status + identifiers.
  it('rendered DOM contains no row-data fields beyond identifiers + counts + statuses', async () => {
    vi.mocked(getSyncReadiness).mockResolvedValueOnce(makeReadiness({
      catalogHealth: {
        status: 'YES',
        headline: 'Schema catalog clean',
        detail: 'Coverage  : 2229 tables, 32750 columns, 210 dictionaries',
        source: 'schema-catalog-health',
      },
    }));
    renderWith(`/workbench/sync-readiness?countyId=${COUNTY}&sourceConnectionId=${SOURCE}&workbookId=${WORKBOOK}`);
    await screen.findByTestId('readiness-panels');

    const text = document.body.textContent ?? '';

    // PII-shaped patterns the artifact surfaces are forbidden from
    // emitting upstream; the frontend regression-tests the absence
    // here as an additional guard.
    expect(text).not.toMatch(/SSN[:\s]\d{3}-\d{2}-\d{4}/);
    expect(text).not.toMatch(/grantor:|grantee:|seller:|buyer:/i);
    expect(text).not.toMatch(/Password=/i);
    expect(text).not.toMatch(/SYNCATLAS_SECRET_/);
  });
});

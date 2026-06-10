/**
 * SYNC-UX-1A: SyncQuarantinePage acceptance tests.
 *
 * Mirrors the sync-readiness console test pattern: vi.mock the API
 * client, render the page in a MemoryRouter + QueryClientProvider,
 * exercise the operator surface end-to-end via @testing-library.
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import SyncQuarantinePage from '../SyncQuarantinePage';
import {
  QuarantineApiError,
  type QuarantineListResponse,
  type QuarantineRowResponse,
} from '@/api/syncQuarantine';

// ───────────────────────────────────────────────────────────────
// Mock the API client. We do NOT mock useQuarantineList directly —
// we want the real TanStack Query layer in tests.
// ───────────────────────────────────────────────────────────────

vi.mock('@/api/syncQuarantine', async () => {
  const actual = await vi.importActual<typeof import('@/api/syncQuarantine')>(
    '@/api/syncQuarantine',
  );
  return {
    ...actual,
    listQuarantineImprvAttr: vi.fn(),
    routeQuarantineImprvAttr: vi.fn(),
    dismissQuarantineImprvAttr: vi.fn(),
    bulkRouteQuarantineImprvAttr: vi.fn(),
    bulkDismissQuarantineImprvAttr: vi.fn(),
  };
});

import {
  bulkDismissQuarantineImprvAttr,
  bulkRouteQuarantineImprvAttr,
  listQuarantineImprvAttr,
} from '@/api/syncQuarantine';

const ROW_ID_1 = '11111111-1111-1111-1111-111111111111';
const ROW_ID_2 = '22222222-2222-2222-2222-222222222222';
const ROW_ID_3 = '33333333-3333-3333-3333-333333333333';

function makeRow(overrides: Partial<QuarantineRowResponse> = {}): QuarantineRowResponse {
  return {
    unprovenRowId: ROW_ID_1,
    propId: 12345,
    propValYr: 2026,
    supNum: 0,
    imprvId: 999_111,
    imprvDetId: 999_222,
    iAttrValId: 31,
    iAttrValCd: 'WD-FRAME',
    attrValueText: 'Wood Frame',
    attrValueNumeric: null,
    quarantineReason: 'UNKNOWN_FOR_UNIVERSE_DICTIONARY',
    quarantineReasonDetail: 'No dictionary entry for REAL_RESIDENTIAL',
    universeCode: 'REAL_RESIDENTIAL',
    createdAt: '2026-05-07T12:00:00Z',
    triageStatus: 'Open',
    suggestedReroute: null,
    ...overrides,
  };
}

function makeList(rows: QuarantineRowResponse[], limit = 100, offset = 0): QuarantineListResponse {
  return { count: rows.length, limit, offset, items: rows };
}

function renderPage(): { qc: QueryClient } {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/workbench/sync/quarantine']}>
        <SyncQuarantinePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { qc };
}

beforeEach(() => {
  vi.mocked(listQuarantineImprvAttr).mockReset();
  vi.mocked(bulkRouteQuarantineImprvAttr).mockReset();
  vi.mocked(bulkDismissQuarantineImprvAttr).mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SyncQuarantinePage', () => {
  it('renders an empty state when no rows match', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValueOnce(makeList([]));
    renderPage();

    expect(await screen.findByTestId('sync-quarantine-page')).toBeInTheDocument();
    expect(await screen.findByTestId('quarantine-empty')).toBeInTheDocument();
    expect(vi.mocked(listQuarantineImprvAttr)).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100, offset: 0 }),
      expect.anything(),
    );
  });

  it('renders a paged list with status badges', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValueOnce(
      makeList([
        makeRow({ unprovenRowId: ROW_ID_1, triageStatus: 'Open', propId: 100 }),
        makeRow({ unprovenRowId: ROW_ID_2, triageStatus: 'Open', propId: 200 }),
        makeRow({ unprovenRowId: ROW_ID_3, triageStatus: 'Open', propId: 300 }),
      ]),
    );
    renderPage();

    const rows = await screen.findAllByTestId('quarantine-row');
    expect(rows).toHaveLength(3);
    const badges = await screen.findAllByTestId('triage-badge');
    expect(badges).toHaveLength(3);
    expect(badges[0]).toHaveClass('tf-status-info'); // Open
  });

  it('refetches when filter changes', async () => {
    vi.mocked(listQuarantineImprvAttr)
      .mockResolvedValueOnce(makeList([makeRow({ propId: 100 })]))
      .mockResolvedValueOnce(makeList([makeRow({ propId: 200, unprovenRowId: ROW_ID_2 })]));

    renderPage();
    await screen.findByTestId('quarantine-row');
    expect(vi.mocked(listQuarantineImprvAttr)).toHaveBeenCalledTimes(1);

    await userEvent.selectOptions(screen.getByTestId('filter-reason'), 'UNKNOWN_UNIVERSE');

    await waitFor(() =>
      expect(vi.mocked(listQuarantineImprvAttr)).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'UNKNOWN_UNIVERSE' }),
        expect.anything(),
      ),
    );
  });

  it('shows bulk-actions bar when rows are selected', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValueOnce(
      makeList([
        makeRow({ unprovenRowId: ROW_ID_1 }),
        makeRow({ unprovenRowId: ROW_ID_2, propId: 200 }),
      ]),
    );
    renderPage();

    const rowCheckboxes = await screen.findAllByTestId('row-checkbox');
    expect(rowCheckboxes).toHaveLength(2);

    expect(screen.queryByTestId('bulk-actions-bar')).not.toBeInTheDocument();
    await userEvent.click(rowCheckboxes[0]!);
    expect(await screen.findByTestId('bulk-actions-bar')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-route-button')).toBeInTheDocument();
    expect(screen.getByTestId('bulk-dismiss-button')).toBeInTheDocument();
  });

  it('manual refresh fires a refetch', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValue(makeList([makeRow()]));
    renderPage();

    await screen.findByTestId('quarantine-row');
    expect(vi.mocked(listQuarantineImprvAttr)).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByTestId('refresh-button'));
    await waitFor(() =>
      expect(vi.mocked(listQuarantineImprvAttr)).toHaveBeenCalledTimes(2),
    );
  });

  it('opens route modal when row Route button is clicked, validates required universe', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValueOnce(makeList([makeRow()]));
    renderPage();

    const routeBtns = await screen.findAllByTestId('row-route-button');
    await userEvent.click(routeBtns[0]!);

    const modal = await screen.findByTestId('route-modal');
    expect(modal).toBeInTheDocument();

    // Submit without selecting a universe → validation error.
    await userEvent.click(within(modal).getByTestId('route-submit-button'));
    expect(await within(modal).findByTestId('route-validation-error')).toBeInTheDocument();
    expect(vi.mocked(bulkRouteQuarantineImprvAttr)).not.toHaveBeenCalled();
  });

  it('submits a route decision, closes modal, and refetches the list', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValue(makeList([makeRow()]));
    vi.mocked(bulkRouteQuarantineImprvAttr).mockResolvedValueOnce([
      {
        unprovenRowId: ROW_ID_1,
        status: 'ok',
        payload: {
          triageId: 'tid-1',
          unprovenRowId: ROW_ID_1,
          status: 'Routed',
          routedToUniverse: 'REAL_RESIDENTIAL',
          routedToIAttrValCd: 'WD-FRAME',
          updatedAt: '2026-05-07T13:00:00Z',
        },
      },
    ]);

    renderPage();
    const routeBtns = await screen.findAllByTestId('row-route-button');
    await userEvent.click(routeBtns[0]!);

    const modal = await screen.findByTestId('route-modal');
    await userEvent.selectOptions(
      within(modal).getByTestId('route-target-universe'),
      'REAL_RESIDENTIAL',
    );
    await userEvent.click(within(modal).getByTestId('route-submit-button'));

    await waitFor(() => expect(vi.mocked(bulkRouteQuarantineImprvAttr)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(bulkRouteQuarantineImprvAttr)).toHaveBeenCalledWith(
      [ROW_ID_1],
      expect.objectContaining({ TargetUniverse: 'REAL_RESIDENTIAL' }),
    );
    await waitFor(() => expect(screen.queryByTestId('route-modal')).not.toBeInTheDocument());
    expect(await screen.findByTestId('toast-success')).toBeInTheDocument();
  });

  it('keeps modal open and shows error summary on 409 conflict', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValue(makeList([makeRow()]));
    const conflict = new QuarantineApiError(409, 'Conflict', {
      error: 'Decision already exists with different target',
    });
    vi.mocked(bulkRouteQuarantineImprvAttr).mockResolvedValueOnce([
      { unprovenRowId: ROW_ID_1, status: 'error', error: conflict },
    ]);

    renderPage();
    await userEvent.click((await screen.findAllByTestId('row-route-button'))[0]!);
    const modal = await screen.findByTestId('route-modal');
    await userEvent.selectOptions(
      within(modal).getByTestId('route-target-universe'),
      'REAL_RESIDENTIAL',
    );
    await userEvent.click(within(modal).getByTestId('route-submit-button'));

    await waitFor(() => expect(vi.mocked(bulkRouteQuarantineImprvAttr)).toHaveBeenCalled());
    // Modal stays open with the per-row error visible.
    expect(await within(modal).findByTestId('route-error-summary')).toBeInTheDocument();
    expect(within(modal).getByTestId('route-error-summary').textContent).toMatch(/conflict/i);
    expect(screen.getByTestId('route-modal')).toBeInTheDocument();
  });

  it('dismiss modal validates a required reason', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValueOnce(makeList([makeRow()]));
    renderPage();

    const dismissBtns = await screen.findAllByTestId('row-dismiss-button');
    await userEvent.click(dismissBtns[0]!);

    const modal = await screen.findByTestId('dismiss-modal');
    await userEvent.click(within(modal).getByTestId('dismiss-submit-button'));
    expect(await within(modal).findByTestId('dismiss-validation-error')).toBeInTheDocument();
    expect(vi.mocked(bulkDismissQuarantineImprvAttr)).not.toHaveBeenCalled();
  });

  it('submits a dismiss decision and closes the modal', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValue(makeList([makeRow()]));
    vi.mocked(bulkDismissQuarantineImprvAttr).mockResolvedValueOnce([
      {
        unprovenRowId: ROW_ID_1,
        status: 'ok',
        payload: {
          triageId: 'tid-1',
          unprovenRowId: ROW_ID_1,
          status: 'Dismissed',
          dismissalReason: 'IntentionalNoise',
          updatedAt: '2026-05-07T13:00:00Z',
        },
      },
    ]);

    renderPage();
    await userEvent.click((await screen.findAllByTestId('row-dismiss-button'))[0]!);
    const modal = await screen.findByTestId('dismiss-modal');
    await userEvent.selectOptions(
      within(modal).getByTestId('dismiss-reason'),
      'IntentionalNoise',
    );
    await userEvent.click(within(modal).getByTestId('dismiss-submit-button'));

    await waitFor(() => expect(vi.mocked(bulkDismissQuarantineImprvAttr)).toHaveBeenCalledTimes(1));
    expect(vi.mocked(bulkDismissQuarantineImprvAttr)).toHaveBeenCalledWith(
      [ROW_ID_1],
      expect.objectContaining({ DismissalReason: 'IntentionalNoise' }),
    );
    await waitFor(() => expect(screen.queryByTestId('dismiss-modal')).not.toBeInTheDocument());
  });

  it('paginates next/prev', async () => {
    // Page 1 returns full pageSize -> hasNextPage true.
    vi.mocked(listQuarantineImprvAttr).mockImplementation(async (params) => {
      const offset = params.offset ?? 0;
      if (offset === 0) {
        return makeList(
          Array.from({ length: 100 }, (_, i) =>
            makeRow({ unprovenRowId: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`, propId: 1000 + i }),
          ),
          100,
          0,
        );
      }
      return makeList(
        [makeRow({ unprovenRowId: ROW_ID_3, propId: 9001 })],
        100,
        100,
      );
    });

    renderPage();
    await screen.findAllByTestId('quarantine-row');

    const nextBtn = screen.getByTestId('next-page-button');
    expect(nextBtn).toBeEnabled();
    await userEvent.click(nextBtn);

    await waitFor(() =>
      expect(vi.mocked(listQuarantineImprvAttr)).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 100 }),
        expect.anything(),
      ),
    );

    expect(screen.getByTestId('page-indicator').textContent).toMatch(/page 2/);
  });

  it('changes page size via the selector and resets to page 1', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValue(makeList([makeRow()]));
    renderPage();
    await screen.findByTestId('quarantine-row');

    const sel = screen.getByTestId('page-size-select');
    await userEvent.selectOptions(sel, '50');

    await waitFor(() =>
      expect(vi.mocked(listQuarantineImprvAttr)).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 0 }),
        expect.anything(),
      ),
    );
  });

  it('shows error state with retry on network failure', async () => {
    vi.mocked(listQuarantineImprvAttr).mockRejectedValueOnce(new Error('boom'));
    renderPage();

    expect(await screen.findByTestId('quarantine-error')).toBeInTheDocument();
    expect(screen.getByTestId('quarantine-error-retry')).toBeEnabled();
  });

  it('clears propId via the X button', async () => {
    vi.mocked(listQuarantineImprvAttr).mockResolvedValue(makeList([makeRow()]));
    renderPage();
    await screen.findByTestId('quarantine-row');

    const propIdInput = screen.getByTestId('filter-propid');
    await userEvent.type(propIdInput, '12345');

    await waitFor(() =>
      expect(vi.mocked(listQuarantineImprvAttr)).toHaveBeenCalledWith(
        expect.objectContaining({ propId: 12345 }),
        expect.anything(),
      ),
    );

    const clearBtn = await screen.findByTestId('filter-propid-clear');
    await userEvent.click(clearBtn);

    await waitFor(() =>
      expect(vi.mocked(listQuarantineImprvAttr)).toHaveBeenCalledWith(
        expect.objectContaining({ propId: null }),
        expect.anything(),
      ),
    );
  });
});

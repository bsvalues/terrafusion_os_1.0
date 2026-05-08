/**
 * SYNC-UX-1B: SyncCommitsPage integration tests.
 *
 * Verifies the wired list+detail page:
 *   - empty list state
 *   - paged list renders rows + selecting a row drives the detail
 *     panel via the URL :commitId param
 *   - "New Commit" button opens the modal
 *
 * Fetches are routed through a stubbed global fetch dispatcher that
 * branches on URL — keeps tests deterministic without msw.
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SyncCommitsPage from '../SyncCommitsPage';
import type {
  CommitDetailResponse,
  CommitListResponse,
  CommitSummaryResponse,
} from '@/api/syncCommits';

interface FetchRouter {
  list?: CommitListResponse;
  detail?: CommitDetailResponse;
  detailStatus?: number;
}

function installFetchRouter(router: FetchRouter): void {
  const handler = async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    if (url.includes('/api/sync/workbench/g/commits/')) {
      const status = router.detailStatus ?? (router.detail ? 200 : 404);
      return {
        ok: status >= 200 && status < 300,
        status,
        statusText: 'mock',
        text: async () => JSON.stringify(router.detail ?? { error: 'not found' }),
        json: async () => router.detail ?? { error: 'not found' },
      } as unknown as Response;
    }
    if (url.includes('/api/sync/workbench/g/commits')) {
      const list: CommitListResponse =
        router.list ?? { count: 0, limit: 50, offset: 0, items: [] };
      return {
        ok: true,
        status: 200,
        statusText: 'mock',
        text: async () => JSON.stringify(list),
        json: async () => list,
      } as unknown as Response;
    }
    return {
      ok: false,
      status: 404,
      statusText: 'unhandled',
      text: async () => '{}',
      json: async () => ({}),
    } as unknown as Response;
  };
  vi.stubGlobal('fetch', vi.fn(handler) as unknown as typeof fetch);
}

function renderPage(initialPath = '/workbench/sync/commits') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path='/workbench/sync/commits' element={<SyncCommitsPage />} />
          <Route
            path='/workbench/sync/commits/:commitId'
            element={<SyncCommitsPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const summary: CommitSummaryResponse = {
  commitId: '11111111-aaaa-bbbb-cccc-dddddddddddd',
  committedAt: '2026-05-08T16:00:00Z',
  operatorId: 'bsvalues',
  idempotencyKey: 'idem-1',
  routedDecisionsApplied: 5,
  dismissedDecisionsApplied: 2,
  commitNote: 'first commit',
};

const detail: CommitDetailResponse = {
  ...summary,
  universeDistributionJson: JSON.stringify({
    REAL_RESIDENTIAL: 50,
    REAL_COMMERCIAL: 0,
    MOBILE_HOME: 0,
    AG_CURRENT_USE: 0,
    PERSONAL_PROPERTY: 0,
    CONVERSION_LEGACY: 0,
    UNKNOWN: 0,
  }),
  ratioDistributionJson: JSON.stringify({
    DorQ_CountyQ: 1,
    DorQ_CountyN: 0,
    DorN_CountyQ: 0,
    DorN_CountyN: 0,
  }),
  decisions: [],
};

describe('SyncCommitsPage', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders the empty state when no commits exist', async () => {
    installFetchRouter({ list: { count: 0, limit: 50, offset: 0, items: [] } });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('commits-list-empty')).toBeInTheDocument();
    });
    expect(screen.getByTestId('commit-detail-empty')).toBeInTheDocument();
  });

  it('renders the action bar with the New Commit button', async () => {
    installFetchRouter({ list: { count: 0, limit: 50, offset: 0, items: [] } });

    renderPage();

    expect(screen.getByTestId('new-commit-button')).toBeInTheDocument();
    expect(screen.getByTestId('commits-refresh-button')).toBeInTheDocument();
  });

  it('renders commit rows and the row label for each summary item', async () => {
    installFetchRouter({
      list: { count: 1, limit: 50, offset: 0, items: [summary] },
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByTestId(`commit-row-${summary.commitId}`),
      ).toBeInTheDocument();
    });
    const row = screen.getByTestId(`commit-row-${summary.commitId}`);
    expect(within(row).getByTestId(`commit-routed-${summary.commitId}`)).toHaveTextContent(
      'R 5',
    );
    expect(within(row).getByTestId(`commit-dismissed-${summary.commitId}`)).toHaveTextContent(
      'D 2',
    );
  });

  it('selects a commit on click and renders its detail', async () => {
    installFetchRouter({
      list: { count: 1, limit: 50, offset: 0, items: [summary] },
      detail,
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByTestId(`commit-row-${summary.commitId}`),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByTestId(`commit-row-${summary.commitId}`));

    await waitFor(() => {
      expect(screen.getByTestId('commit-detail')).toBeInTheDocument();
    });
    expect(screen.getByTestId('commit-id-full')).toHaveTextContent(summary.commitId);
    expect(screen.getByTestId('commit-routed-count')).toHaveTextContent('5');
  });

  it('opens the New Commit modal when the button is clicked', async () => {
    installFetchRouter({ list: { count: 0, limit: 50, offset: 0, items: [] } });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByTestId('new-commit-button'));
    expect(screen.getByTestId('commit-create-modal')).toBeInTheDocument();
  });

  it('hydrates a commit selected via the URL :commitId param', async () => {
    installFetchRouter({
      list: { count: 1, limit: 50, offset: 0, items: [summary] },
      detail,
    });

    renderPage(`/workbench/sync/commits/${summary.commitId}`);

    await waitFor(() => {
      expect(screen.getByTestId('commit-detail')).toBeInTheDocument();
    });
    expect(screen.getByTestId('commit-id-full')).toHaveTextContent(summary.commitId);
  });
});

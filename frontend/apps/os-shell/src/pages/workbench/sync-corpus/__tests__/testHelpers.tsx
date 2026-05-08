/**
 * SYNC-UX-1C: shared test fixtures + render helpers.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render } from '@testing-library/react';
import type {
  CorpusReconciliationResponseEnvelope,
  CorpusStatusResponse,
  FullCorpusLaneResultResponse,
  FullCorpusReconciliationResponse,
  FullCorpusRunResponse,
  LaneName,
  LaneStatus,
  ReconciliationStatus,
  RunStatus,
} from '@/api/syncCorpus';

export const RUN_ID = '11111111-2222-3333-4444-555555555555';

export function makeRun(overrides: Partial<FullCorpusRunResponse> = {}): FullCorpusRunResponse {
  return {
    runId: RUN_ID,
    operatorName: 'b.svalues',
    workingYear: 2026,
    status: 'Running',
    currentLane: 'parcel',
    nextLaneOnResume: null,
    startedAt: '2026-05-08T10:00:00Z',
    finishedAt: null,
    errorMessage: null,
    ...overrides,
  };
}

const LANES: LaneName[] = [
  'parcel',
  'owner-wsdor',
  'improvement',
  'land',
  'sales',
  'geometry',
];

export function makeLanes(
  overrides: Partial<Record<LaneName, Partial<FullCorpusLaneResultResponse>>> = {},
): FullCorpusLaneResultResponse[] {
  return LANES.map((lane, i) => ({
    laneResultId: `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
    runId: RUN_ID,
    lane,
    status: 'Pending' as LaneStatus,
    startedAt: null,
    finishedAt: null,
    batchIdsJson: null,
    countsJson: null,
    gateSummaryJson: null,
    quarantineDeltaJson: null,
    errorMessage: null,
    ...(overrides[lane] ?? {}),
  }));
}

export function makeStatus(
  run: Partial<FullCorpusRunResponse> = {},
  laneOverrides: Partial<Record<LaneName, Partial<FullCorpusLaneResultResponse>>> = {},
): CorpusStatusResponse {
  return {
    run: makeRun(run),
    lanes: makeLanes(laneOverrides),
  };
}

export function makeReconciliationRow(
  lane: LaneName,
  status: ReconciliationStatus = 'Match',
  overrides: Partial<FullCorpusReconciliationResponse> = {},
): FullCorpusReconciliationResponse {
  return {
    reconciliationId: `recon-${lane}`,
    runId: RUN_ID,
    lane,
    expectedBasis: 'RAW_SOURCE',
    pacsSourceCount: 100000,
    tfCanonicalCount: 100000,
    delta: 0,
    deltaPct: 0,
    tolerancePct: 1,
    reconciliationStatus: status,
    notes: null,
    computedAt: '2026-05-08T20:00:00Z',
    ...overrides,
  };
}

export function makeReconciliationEnvelope(
  rows?: FullCorpusReconciliationResponse[],
  runStatus: RunStatus = 'Completed',
): CorpusReconciliationResponseEnvelope {
  return {
    run: makeRun({ status: runStatus, finishedAt: '2026-05-08T20:00:00Z' }),
    reconciliations:
      rows ?? LANES.map((l) => makeReconciliationRow(l)),
  };
}

export function buildTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: Number.POSITIVE_INFINITY,
      },
      mutations: { retry: false },
    },
  });
}

export interface RenderResult {
  qc: QueryClient;
}

/**
 * Render a page mounted at the same routes as production
 * (/workbench/sync/corpus and /workbench/sync/corpus/:runId).
 * Initial location is fully customizable via `route`.
 */
export function renderWithRouter(
  Page: React.ComponentType,
  route: string,
): RenderResult {
  const qc = buildTestQueryClient();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path='/workbench/sync/corpus' element={<Page />} />
          <Route path='/workbench/sync/corpus/:runId' element={<Page />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { qc };
}

/**
 * Render a non-routed component (ones that don't read URL params)
 * inside MemoryRouter + QueryClient providers.
 */
export function renderInProviders(
  ui: React.ReactElement,
  route = '/workbench/sync/corpus',
): RenderResult {
  const qc = buildTestQueryClient();
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
  return { qc };
}

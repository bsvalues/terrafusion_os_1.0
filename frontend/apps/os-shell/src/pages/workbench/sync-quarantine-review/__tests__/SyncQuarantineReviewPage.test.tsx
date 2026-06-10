/**
 * WORKBENCH-V0.2 SLICE-I STEP-3 — SyncQuarantineReviewPage tests.
 *
 * Validates:
 *   1. Panel renders page title and lane label.
 *   2. Empty state renders when no quarantine rows are returned.
 *   3. No release / promote / commit / bulk buttons exist.
 *   4. Save button calls POST endpoint via saveQuarantineReviewDecision.
 *   5. No auto-save: save button does nothing until disposition is selected.
 *   6. After save, savedAt timestamp and disposition are shown.
 *   7. Save error is shown when API call fails.
 *   8. Doctrine banner is present.
 *   9. Accept-as-is notice appears when ACCEPT_AS_IS radio is selected.
 *  10. Disposition radio buttons are present for each allowed value.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type {
  QuarantineReviewRow,
  QuarantineReviewBrowseResponse,
  SaveDecisionResponse,
} from '@/api/syncQuarantineReview';
import { QuarantineReviewApiError } from '@/api/syncQuarantineReview';
import SyncQuarantineReviewPage from '../SyncQuarantineReviewPage';

// ── Mock API module ────────────────────────────────────────────────────────────

vi.mock('@/api/syncQuarantineReview', async () => {
  const actual =
    await vi.importActual<typeof import('@/api/syncQuarantineReview')>(
      '@/api/syncQuarantineReview',
    );
  return {
    ...actual,
    browseQuarantineReview: vi.fn(),
    saveQuarantineReviewDecision: vi.fn(),
  };
});

// Import AFTER mock registration so we get the mocked versions.
const { browseQuarantineReview, saveQuarantineReviewDecision } =
  await import('@/api/syncQuarantineReview');

const mockedBrowse = vi.mocked(browseQuarantineReview);
const mockedSave = vi.mocked(saveQuarantineReviewDecision);

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<QuarantineReviewRow> = {}): QuarantineReviewRow {
  return {
    quarantineRowRef: '11111111-1111-1111-1111-111111111111',
    propValYr: 2025,
    supNum: 0,
    propId: 10001,
    imprvId: 1,
    imprvDetId: 2,
    iAttrValId: 3,
    iAttrValCd: 'ROOF_STYLE',
    attrValueText: 'Comp Shingle',
    attrValueNumeric: null,
    quarantineReason: 'UNKNOWN_I_ATTR_VAL_CD',
    quarantineReasonDetail: null,
    universeCode: 'REAL_RESIDENTIAL',
    quarantinedAt: '2025-05-01T00:00:00Z',
    currentDisposition: 'UNREVIEWED',
    currentNote: null,
    reviewedBy: null,
    reviewedAt: null,
    currentDecisionId: null,
    ...overrides,
  };
}

function makeEmptyResponse(): QuarantineReviewBrowseResponse {
  return {
    lane: 'imprv_attr',
    totalSourceCount: 0,
    returnedCount: 0,
    items: [],
    notice: '',
  };
}

function makeResponse(rows: QuarantineReviewRow[]): QuarantineReviewBrowseResponse {
  return {
    lane: 'imprv_attr',
    totalSourceCount: rows.length,
    returnedCount: rows.length,
    items: rows,
    notice: '',
  };
}

function makeSaveResponse(
  overrides: Partial<SaveDecisionResponse> = {},
): SaveDecisionResponse {
  return {
    decisionId: 42,
    disposition: 'ACCEPT_AS_IS',
    savedAt: '2026-06-09T12:00:00Z',
    sourceRowCountAfterSave: 9504,
    notice: '',
    ...overrides,
  };
}

function wrap(ui: React.ReactElement): React.ReactElement {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// 1. Panel renders
test('panel renders page title and lane label', async () => {
  mockedBrowse.mockResolvedValueOnce(makeEmptyResponse());
  render(wrap(<SyncQuarantineReviewPage />));

  expect(screen.getByTestId('page-title')).toHaveTextContent('Quarantine Review');
  await waitFor(() => expect(screen.getByTestId('lane-label')).toHaveTextContent('imprv_attr'));
});

// 2. Empty state
test('empty state renders when no rows are returned', async () => {
  mockedBrowse.mockResolvedValueOnce(makeEmptyResponse());
  render(wrap(<SyncQuarantineReviewPage />));

  await waitFor(() => {
    expect(screen.getByTestId('empty-state')).toHaveTextContent(
      'No quarantine records for imprv_attr.',
    );
  });
  expect(screen.queryByTestId('quarantine-review-list')).not.toBeInTheDocument();
});

// 3. No forbidden buttons
test('no release / promote / commit / bulk buttons exist', async () => {
  mockedBrowse.mockResolvedValueOnce(makeResponse([makeRow()]));
  render(wrap(<SyncQuarantineReviewPage />));

  await waitFor(() => expect(screen.getByTestId('quarantine-review-list')).toBeInTheDocument());

  const page = screen.getByTestId('sync-quarantine-review-page');

  const forbidden = [
    /release/i,
    /promote/i,
    /commit/i,
    /bulk/i,
    /approve/i,
    /approve.and.release/i,
  ];
  for (const pattern of forbidden) {
    const buttons = within(page).queryAllByRole('button');
    for (const btn of buttons) {
      expect(btn).not.toHaveAccessibleName(pattern);
    }
  }
});

// 4. Save calls POST endpoint
test('save button calls saveQuarantineReviewDecision with correct args', async () => {
  const row = makeRow();
  mockedBrowse.mockResolvedValueOnce(makeResponse([row]));
  mockedSave.mockResolvedValueOnce(makeSaveResponse({ disposition: 'NEEDS_RESEARCH' }));

  render(wrap(<SyncQuarantineReviewPage />));

  await waitFor(() => expect(screen.getByTestId('quarantine-review-list')).toBeInTheDocument());

  // Select a disposition
  fireEvent.click(screen.getByTestId('radio-NEEDS_RESEARCH'));

  // Click Save
  fireEvent.click(screen.getByTestId('save-button'));

  await waitFor(() => expect(mockedSave).toHaveBeenCalledTimes(1));

  expect(mockedSave).toHaveBeenCalledWith(
    row.quarantineRowRef,
    expect.objectContaining({
      lane: 'imprv_attr',
      disposition: 'NEEDS_RESEARCH',
    }),
    expect.any(AbortSignal),
  );
});

// 5. No auto-save: save button disabled without selection
test('save button is disabled until a disposition is selected', async () => {
  mockedBrowse.mockResolvedValueOnce(makeResponse([makeRow()]));
  render(wrap(<SyncQuarantineReviewPage />));

  await waitFor(() => expect(screen.getByTestId('quarantine-review-list')).toBeInTheDocument());

  const saveBtn = screen.getByTestId('save-button');
  expect(saveBtn).toBeDisabled();

  // No call should have been made
  expect(mockedSave).not.toHaveBeenCalled();
});

// 6. After save, savedAt timestamp and disposition are shown
test('after save, saved timestamp and disposition chip update', async () => {
  const row = makeRow();
  mockedBrowse.mockResolvedValueOnce(makeResponse([row]));
  mockedSave.mockResolvedValueOnce(
    makeSaveResponse({ disposition: 'REJECT_PERMANENTLY', savedAt: '2026-06-09T15:30:00Z' }),
  );

  render(wrap(<SyncQuarantineReviewPage />));
  await waitFor(() => expect(screen.getByTestId('quarantine-review-list')).toBeInTheDocument());

  fireEvent.click(screen.getByTestId('radio-REJECT_PERMANENTLY'));
  fireEvent.click(screen.getByTestId('save-button'));

  await waitFor(() => {
    expect(screen.getByTestId('save-success')).toBeInTheDocument();
  });

  expect(screen.getByTestId('current-disposition')).toHaveTextContent('REJECT_PERMANENTLY');
});

// 7. Save error shown on failure
test('save error message shown when API call fails', async () => {
  const row = makeRow();
  mockedBrowse.mockResolvedValueOnce(makeResponse([row]));
  mockedSave.mockRejectedValueOnce(
    new QuarantineReviewApiError(400, 'Bad request', { error: 'disposition invalid' }),
  );

  render(wrap(<SyncQuarantineReviewPage />));
  await waitFor(() => expect(screen.getByTestId('quarantine-review-list')).toBeInTheDocument());

  fireEvent.click(screen.getByTestId('radio-ACCEPT_AS_IS'));
  fireEvent.click(screen.getByTestId('save-button'));

  await waitFor(() => {
    expect(screen.getByTestId('save-error')).toBeInTheDocument();
  });
});

// 8. Doctrine banner present
test('doctrine banner is always visible', async () => {
  mockedBrowse.mockResolvedValueOnce(makeEmptyResponse());
  render(wrap(<SyncQuarantineReviewPage />));

  await waitFor(() => expect(screen.getByTestId('doctrine-banner')).toBeInTheDocument());
  expect(screen.getByTestId('doctrine-banner')).toHaveTextContent('ACCEPT_AS_IS');
  expect(screen.getByTestId('doctrine-banner')).toHaveTextContent('does not promote');
});

// 9. Accept-as-is notice appears when radio selected
test('ACCEPT_AS_IS notice appears when that radio is selected', async () => {
  mockedBrowse.mockResolvedValueOnce(makeResponse([makeRow()]));
  render(wrap(<SyncQuarantineReviewPage />));

  await waitFor(() => expect(screen.getByTestId('quarantine-review-list')).toBeInTheDocument());

  // Notice should not be visible before selection
  expect(screen.queryByTestId('accept-notice')).not.toBeInTheDocument();

  fireEvent.click(screen.getByTestId('radio-ACCEPT_AS_IS'));

  expect(screen.getByTestId('accept-notice')).toBeInTheDocument();
  expect(screen.getByTestId('accept-notice')).toHaveTextContent('does not promote');
});

// 10. All three disposition radios present
test('radio buttons exist for all three allowed dispositions', async () => {
  mockedBrowse.mockResolvedValueOnce(makeResponse([makeRow()]));
  render(wrap(<SyncQuarantineReviewPage />));

  await waitFor(() => expect(screen.getByTestId('quarantine-review-list')).toBeInTheDocument());

  expect(screen.getByTestId('radio-ACCEPT_AS_IS')).toBeInTheDocument();
  expect(screen.getByTestId('radio-REJECT_PERMANENTLY')).toBeInTheDocument();
  expect(screen.getByTestId('radio-NEEDS_RESEARCH')).toBeInTheDocument();
});

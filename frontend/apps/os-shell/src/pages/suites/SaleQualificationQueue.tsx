/**
 * SaleQualificationQueue — Slice 1.4
 *
 * County-wide pending sale qualification queue, wired to
 * GET  /api/terraforge/sale-qualification
 * PATCH /api/terraforge/sale-qualification/{saleId}
 *
 * Surface: ForgeSuiteHome (os-shell), NOT the standalone terraforge harness.
 * Owner: Suite-Forge layer.  Read PACS comps; write appraiser decisions only.
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { apiFetch } from '../../lib/apiBase';

// ── Types ──────────────────────────────────────────────────────────────────

type QueueStatus = 'pending' | 'staff-confirmed' | 'appraiser-final';

interface SaleQualificationItem {
  saleId: string;
  parcelId: string;
  saleDate: string;
  salePrice: number;
  adjustedSalePrice: number | null;
  gla: number | null;
  hood: string | null;
  qualificationRecommendation: string | null;
  recommendationReason: string | null;
  qualificationDecision: string | null;
  qualificationDecisionBy: string | null;
  qualificationDecisionAt: string | null;
  researchNotes: string | null;
}

interface QueuePage {
  total: number;
  page: number;
  pageSize: number;
  items: SaleQualificationItem[];
}

// ── State machine ──────────────────────────────────────────────────────────

interface QueueState {
  status: QueueStatus;
  page: number;
  data: QueuePage | null;
  loading: boolean;
  error: string | null;
  /** saleId → 'working' | 'done' | 'error' */
  patchState: Record<string, 'working' | 'done' | 'error'>;
}

type QueueAction =
  | { type: 'SET_STATUS'; status: QueueStatus }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_OK'; data: QueuePage }
  | { type: 'FETCH_ERR'; error: string }
  | { type: 'PATCH_START'; saleId: string }
  | { type: 'PATCH_OK'; saleId: string }
  | { type: 'PATCH_ERR'; saleId: string };

function reducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.status, page: 1, data: null, error: null };
    case 'SET_PAGE':
      return { ...state, page: action.page, data: null, error: null };
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_OK':
      return { ...state, loading: false, data: action.data };
    case 'FETCH_ERR':
      return { ...state, loading: false, error: action.error };
    case 'PATCH_START':
      return { ...state, patchState: { ...state.patchState, [action.saleId]: 'working' } };
    case 'PATCH_OK':
      return { ...state, patchState: { ...state.patchState, [action.saleId]: 'done' } };
    case 'PATCH_ERR':
      return { ...state, patchState: { ...state.patchState, [action.saleId]: 'error' } };
    default:
      return state;
  }
}

const PAGE_SIZE = 15;
const TAX_YEAR = new Date().getFullYear();

// ── Formatters ─────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function fmtPrice(n: number | null): string {
  if (n == null) return '—';
  return `$${n.toLocaleString()}`;
}

function recChip(rec: string | null): { label: string; cls: string } {
  if (!rec) return { label: 'unknown', cls: 'forge-chip--neutral' };
  if (rec === 'qualified') return { label: 'qualified', cls: 'forge-chip--success' };
  if (rec.startsWith('exempt')) return { label: 'exempt', cls: 'forge-chip--warn' };
  return { label: rec.replace('non-arms-length', 'non-AL'), cls: 'forge-chip--warn' };
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  taxYear?: number;
}

export function SaleQualificationQueue({ taxYear = TAX_YEAR }: Props) {
  const [state, dispatch] = useReducer(reducer, {
    status: 'pending',
    page: 1,
    data: null,
    loading: false,
    error: null,
    patchState: {},
  });

  // Refresh trigger — incremented after a successful PATCH to re-fetch
  const refreshCount = useRef(0);

  const fetchPage = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const url =
        `/terraforge/sale-qualification` +
        `?taxYear=${taxYear}&status=${state.status}&page=${state.page}&pageSize=${PAGE_SIZE}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as QueuePage;

      // Page-clamp guard: if this page is now empty but earlier pages exist
      // (happens when a PATCH decision moves the last item off the current page),
      // step back to the last valid page rather than showing a misleading
      // "no results" message or an impossible page indicator like "3 / 2".
      const newTotalPages = Math.ceil(json.total / PAGE_SIZE);
      if (json.items.length === 0 && state.page > 1) {
        dispatch({ type: 'SET_PAGE', page: Math.max(1, newTotalPages) });
        return;
      }

      dispatch({ type: 'FETCH_OK', data: json });
    } catch (e) {
      dispatch({ type: 'FETCH_ERR', error: e instanceof Error ? e.message : 'Failed to load' });
    }
  }, [taxYear, state.status, state.page]);

  useEffect(() => {
    void fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxYear, state.status, state.page, refreshCount.current]);

  const handleDecision = useCallback(
    async (saleId: string, decision: 'qualified' | 'non-arms-length') => {
      dispatch({ type: 'PATCH_START', saleId });
      try {
        const res = await apiFetch(`/terraforge/sale-qualification/${saleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qualificationDecision: decision,
            decidedBy: 'staff',
            decisionSource: 'StaffConfirmed',
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        dispatch({ type: 'PATCH_OK', saleId });
        refreshCount.current += 1;
        void fetchPage();
      } catch {
        dispatch({ type: 'PATCH_ERR', saleId });
      }
    },
    [fetchPage],
  );

  const { status, page, data, loading, error, patchState } = state;
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const TABS: { value: QueueStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'staff-confirmed', label: 'Staff confirmed' },
    { value: 'appraiser-final', label: 'Appraiser final' },
  ];

  return (
    <section
      className="forge-panel"
      data-testid="forge-sale-qualification-queue"
    >
      {/* Header */}
      <div className="forge-panel__header">
        <div>
          <p className="forge-panel__eyebrow">Sale Qualification</p>
          <h2 className="forge-panel__title">
            County-wide qualification queue
            {data != null && (
              <span
                className="forge-chip forge-chip--warn"
                style={{ marginLeft: 10, verticalAlign: 'middle' }}
              >
                {data.total.toLocaleString()} {status}
              </span>
            )}
          </h2>
        </div>
        {/* Tax year badge */}
        <span className="forge-chip forge-chip--neutral">{taxYear} ratio window</span>
      </div>

      {/* Status tabs */}
      <div className="sq-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            className={`sq-tab ${status === tab.value ? 'sq-tab--active' : ''}`}
            onClick={() => dispatch({ type: 'SET_STATUS', status: tab.value })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      {loading && !data && (
        <div className="sq-state" role="status">
          Loading sales…
        </div>
      )}
      {error && (
        <div className="sq-state sq-state--error" role="alert">
          {error}
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="sq-state">No {status} sales in {taxYear} ratio window.</div>
      )}

      {data && data.items.length > 0 && (
        <div className="sq-table" role="table" aria-label="Sale qualification queue">
          {/* Table head */}
          <div className="sq-row sq-row--head" role="row">
            <span role="columnheader">Parcel</span>
            <span role="columnheader">Sale date</span>
            <span role="columnheader">Price</span>
            <span role="columnheader">Recommendation</span>
            {status === 'pending' && <span role="columnheader">Action</span>}
            {status !== 'pending' && <span role="columnheader">Decision</span>}
          </div>

          {/* Rows */}
          {data.items.map((item) => {
            const chip = recChip(item.qualificationRecommendation);
            const patch = patchState[item.saleId];
            return (
              <div key={item.saleId} className="sq-row" role="row">
                <span className="sq-cell sq-cell--parcel" role="cell">
                  {item.parcelId}
                </span>
                <span className="sq-cell" role="cell">
                  {fmtDate(item.saleDate)}
                </span>
                <span className="sq-cell" role="cell">
                  {fmtPrice(item.salePrice)}
                </span>
                <span className="sq-cell" role="cell">
                  <span className={`forge-chip ${chip.cls}`}>{chip.label}</span>
                  {item.recommendationReason && (
                    <span className="sq-reason" title={item.recommendationReason}>
                      {item.recommendationReason.length > 40
                        ? `${item.recommendationReason.slice(0, 40)}…`
                        : item.recommendationReason}
                    </span>
                  )}
                </span>

                {/* Pending — show decision buttons */}
                {status === 'pending' && (
                  <span className="sq-cell sq-cell--actions" role="cell">
                    {patch === 'working' && (
                      <span className="sq-patch-state">Saving…</span>
                    )}
                    {patch === 'error' && (
                      <span className="sq-patch-state sq-patch-state--error">Error</span>
                    )}
                    {patch === 'done' && (
                      <span className="sq-patch-state sq-patch-state--done">Saved</span>
                    )}
                    {patch == null && (
                      <>
                        <button
                          type="button"
                          className="sq-action sq-action--qualify"
                          aria-label={`Mark ${item.parcelId} as qualified`}
                          onClick={() => void handleDecision(item.saleId, 'qualified')}
                        >
                          Qualified
                        </button>
                        <button
                          type="button"
                          className="sq-action sq-action--reject"
                          aria-label={`Mark ${item.parcelId} as non-arms-length`}
                          onClick={() => void handleDecision(item.saleId, 'non-arms-length')}
                        >
                          Non-AL
                        </button>
                      </>
                    )}
                  </span>
                )}

                {/* Decided — show existing decision */}
                {status !== 'pending' && (
                  <span className="sq-cell" role="cell">
                    <span className={`forge-chip ${
                      item.qualificationDecision === 'qualified'
                        ? 'forge-chip--success'
                        : 'forge-chip--warn'
                    }`}>
                      {item.qualificationDecision ?? '—'}
                    </span>
                    {item.qualificationDecisionBy && (
                      <span className="sq-reason">{item.qualificationDecisionBy}</span>
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="sq-pagination">
          <button
            type="button"
            className="sq-page-btn"
            disabled={page <= 1}
            onClick={() => dispatch({ type: 'SET_PAGE', page: page - 1 })}
            aria-label="Previous page"
          >
            ‹ Prev
          </button>
          <span className="sq-page-info">
            {page} / {totalPages}
            {data && (
              <span className="sq-page-total">&nbsp;({data.total.toLocaleString()} total)</span>
            )}
          </span>
          <button
            type="button"
            className="sq-page-btn"
            disabled={page >= totalPages}
            onClick={() => dispatch({ type: 'SET_PAGE', page: page + 1 })}
            aria-label="Next page"
          >
            Next ›
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * RatioStudyPanel — Slice 1.5
 *
 * County-wide IAAO ratio study, wired to
 * GET /api/terraforge/ratio-study?taxYear=…&page=…&pageSize=…
 *
 * Surface: ForgeSuiteHome (os-shell), NOT the standalone terraforge harness.
 * Read-only: ratios are PACS-computed, not staff-editable here.
 *
 * IAAO reference thresholds (residential):
 *   Median ratio: 0.90 – 1.10   (level of appraisal)
 *   COD:          < 10           (uniformity)
 *   PRD:          0.98 – 1.03   (vertical equity)
 */

import { useCallback, useEffect, useReducer } from 'react';
import { apiFetch } from '../../lib/apiBase';

// ── Types ──────────────────────────────────────────────────────────────────

interface RatioStudyStats {
  medianRatio: number | null;
  meanRatio:   number | null;
  cod:         number | null;
  prd:         number | null;
}

interface RatioStudyItem {
  saleId:             string;
  parcelId:           string;
  saleDate:           string;
  salePrice:          number;
  rawSalePrice:       number;
  adjustedSalePrice:  number | null;
  pacsComputedRatio:  number | null;
  ratio:              number | null;
  gla:                number | null;
  yearBuilt:          number | null;
  hood:               string | null;
  propertyType:       string | null;
  qualificationSource: 'decision' | 'recommendation';
}

interface RatioStudyPage {
  taxYear:          number;
  total:            number;
  countWithRatio:   number;
  outliersExcluded: number;
  stats:            RatioStudyStats;
  page:             number;
  pageSize:         number;
  items:            RatioStudyItem[];
}

// ── State machine ──────────────────────────────────────────────────────────

interface RSState {
  page:    number;
  data:    RatioStudyPage | null;
  loading: boolean;
  error:   string | null;
}

type RSAction =
  | { type: 'SET_PAGE';   page: number }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_OK';   data: RatioStudyPage }
  | { type: 'FETCH_ERR';  error: string };

function reducer(state: RSState, action: RSAction): RSState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: action.page, data: null, error: null };
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_OK':
      return { ...state, loading: false, data: action.data };
    case 'FETCH_ERR':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

export const RS_PAGE_SIZE = 25;
const TAX_YEAR = new Date().getFullYear();

// ── IAAO threshold helpers ─────────────────────────────────────────────────

type IaaoTone = 'success' | 'warn' | 'neutral';

function medianTone(v: number | null): IaaoTone {
  if (v == null) return 'neutral';
  return v >= 0.9 && v <= 1.1 ? 'success' : 'warn';
}

function codTone(v: number | null): IaaoTone {
  if (v == null) return 'neutral';
  return v < 10 ? 'success' : 'warn';
}

function prdTone(v: number | null): IaaoTone {
  if (v == null) return 'neutral';
  return v >= 0.98 && v <= 1.03 ? 'success' : 'warn';
}

// ── Formatters ─────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    });
  } catch {
    return iso;
  }
}

function fmtPrice(n: number | null): string {
  return n == null ? '—' : `$${n.toLocaleString()}`;
}

function fmtRatio(n: number | null): string {
  if (n == null) return '—';
  // n is 0–1 from the API; display as percentage
  return `${(n * 100).toFixed(1)}%`;
}

function fmtStat(n: number | null, digits: number): string {
  return n == null ? '—' : n.toFixed(digits);
}

// ── Stat card sub-component ────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: IaaoTone;
}) {
  return (
    <div className={`rs-stat rs-stat--${tone}`}>
      <div className="rs-stat__label">{label}</div>
      <div className="rs-stat__value">{value}</div>
      {sub && <div className="rs-stat__sub">{sub}</div>}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  taxYear?: number;
}

export function RatioStudyPanel({ taxYear = TAX_YEAR }: Props) {
  const [state, dispatch] = useReducer(reducer, {
    page:    1,
    data:    null,
    loading: false,
    error:   null,
  });

  const fetchPage = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const url =
        `/terraforge/ratio-study` +
        `?taxYear=${taxYear}&page=${state.page}&pageSize=${RS_PAGE_SIZE}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as RatioStudyPage;

      // Page-clamp: if a stale page comes back empty, step to last valid page
      if (json.items.length === 0 && state.page > 1) {
        const newTotalPages = Math.ceil(json.total / RS_PAGE_SIZE);
        dispatch({ type: 'SET_PAGE', page: Math.max(1, newTotalPages) });
        return;
      }

      dispatch({ type: 'FETCH_OK', data: json });
    } catch (e) {
      dispatch({
        type: 'FETCH_ERR',
        error: e instanceof Error ? e.message : 'Failed to load',
      });
    }
  }, [taxYear, state.page]);

  useEffect(() => {
    void fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxYear, state.page]);

  const { page, data, loading, error } = state;
  const totalPages = data ? Math.ceil(data.total / RS_PAGE_SIZE) : 0;
  const stats      = data?.stats;

  return (
    <section
      className="forge-panel"
      data-testid="forge-ratio-study-panel"
    >
      {/* Header */}
      <div className="forge-panel__header">
        <div>
          <p className="forge-panel__eyebrow">IAAO Ratio Study</p>
          <h2 className="forge-panel__title">
            County-wide ratio study
            {data != null && (
              <span
                className="forge-chip forge-chip--neutral"
                style={{ marginLeft: 10, verticalAlign: 'middle' }}
              >
                {data.total.toLocaleString()} qualified sales
              </span>
            )}
          </h2>
        </div>
        <span className="forge-chip forge-chip--neutral">{taxYear} tax year</span>
      </div>

      {/* Loading / error */}
      {loading && !data && (
        <div className="rs-state" role="status">Loading ratio study…</div>
      )}
      {error && (
        <div className="rs-state rs-state--error" role="alert">{error}</div>
      )}

      {/* IAAO stat bar */}
      {data && (
        <>
          <div className="rs-stats-bar" aria-label="IAAO ratio study statistics">
            <StatCard
              label="Median ratio"
              value={fmtStat(stats?.medianRatio ?? null, 4)}
              sub="Target: 0.90 – 1.10"
              tone={medianTone(stats?.medianRatio ?? null)}
            />
            <StatCard
              label="Mean ratio"
              value={fmtStat(stats?.meanRatio ?? null, 4)}
              tone={medianTone(stats?.meanRatio ?? null)}
            />
            <StatCard
              label="COD"
              value={fmtStat(stats?.cod ?? null, 2)}
              sub="Target: < 10"
              tone={codTone(stats?.cod ?? null)}
            />
            <StatCard
              label="PRD"
              value={fmtStat(stats?.prd ?? null, 4)}
              sub="Target: 0.98 – 1.03"
              tone={prdTone(stats?.prd ?? null)}
            />
            <div className="rs-stat rs-stat--neutral">
              <div className="rs-stat__label">With ratio</div>
              <div className="rs-stat__value">{data.countWithRatio.toLocaleString()}</div>
              {data.outliersExcluded > 0 && (
                <div className="rs-stat__sub">
                  {data.outliersExcluded} outlier{data.outliersExcluded !== 1 ? 's' : ''} trimmed
                </div>
              )}
            </div>
          </div>

          {/* Detail table */}
          {data.items.length === 0 ? (
            <div className="rs-state">
              No qualified sales in the {taxYear} ratio window.
            </div>
          ) : (
            <div className="rs-table" role="table" aria-label="Ratio study detail">
              <div className="rs-row rs-row--head" role="row">
                <span role="columnheader">Parcel</span>
                <span role="columnheader">Sale date</span>
                <span role="columnheader">Sale price</span>
                <span role="columnheader">Ratio</span>
                <span role="columnheader">Hood</span>
                <span role="columnheader">Source</span>
              </div>

              {data.items.map((item) => (
                <div key={item.saleId} className="rs-row" role="row">
                  <span className="rs-cell rs-cell--parcel" role="cell">
                    {item.parcelId}
                  </span>
                  <span className="rs-cell" role="cell">
                    {fmtDate(item.saleDate)}
                  </span>
                  <span className="rs-cell" role="cell">
                    {fmtPrice(item.salePrice)}
                  </span>
                  <span className="rs-cell rs-cell--ratio" role="cell">
                    {item.ratio != null ? (
                      <span className={`rs-ratio-badge ${
                        item.ratio >= 0.9 && item.ratio <= 1.1
                          ? 'rs-ratio-badge--ok'
                          : 'rs-ratio-badge--out'
                      }`}>
                        {fmtRatio(item.ratio)}
                      </span>
                    ) : (
                      <span className="rs-ratio-badge rs-ratio-badge--missing">—</span>
                    )}
                  </span>
                  <span className="rs-cell rs-cell--muted" role="cell">
                    {item.hood ?? '—'}
                  </span>
                  <span className="rs-cell rs-cell--muted" role="cell">
                    <span className={`forge-chip ${
                      item.qualificationSource === 'decision'
                        ? 'forge-chip--success'
                        : 'forge-chip--neutral'
                    }`}>
                      {item.qualificationSource}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="rs-pagination">
              <button
                type="button"
                className="rs-page-btn"
                disabled={page <= 1}
                onClick={() => dispatch({ type: 'SET_PAGE', page: page - 1 })}
                aria-label="Previous page"
              >
                ‹ Prev
              </button>
              <span className="rs-page-info">
                {page} / {totalPages}
                <span className="rs-page-total">
                  &nbsp;({data.total.toLocaleString()} total)
                </span>
              </span>
              <button
                type="button"
                className="rs-page-btn"
                disabled={page >= totalPages}
                onClick={() => dispatch({ type: 'SET_PAGE', page: page + 1 })}
                aria-label="Next page"
              >
                Next ›
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

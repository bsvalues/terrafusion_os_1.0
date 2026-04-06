/**
 * CompsPoolBrowser — Slice 1.6
 *
 * Browses the effective qualified comps pool, wired to
 * GET /api/terraforge/comps-pool?taxYear=…&hood=…&propertyType=…
 *                               &minPrice=…&maxPrice=…&minGla=…&maxGla=…
 *                               &page=…&pageSize=…
 *
 * Surface: ForgeSuiteHome (os-shell only). Read-only pool view; no edits.
 * Filters are committed on button press — not applied live — to avoid
 * hammering the endpoint while the user is mid-typing.
 */

import { useCallback, useEffect, useReducer, useState } from 'react';
import { apiFetch } from '../../lib/apiBase';

// ── Types ──────────────────────────────────────────────────────────────────

interface CompsPoolItem {
  saleId:             string;
  parcelId:           string;
  address:            string | null;
  hood:               string | null;
  propertyType:       string | null;
  imprvTypeCode:      string | null;
  saleDate:           string;
  salePrice:          number;
  rawSalePrice:       number;
  adjustedSalePrice:  number | null;
  gla:                number | null;
  lotSizeSqft:        number | null;
  yearBuilt:          number | null;
  bedrooms:           number | null;
  bathrooms:          number | null;
  condition:          string | null;
  qualityGrade:       string | null;
  pacsComputedRatio:  number | null;
  qualificationSource: 'decision' | 'recommendation';
}

interface CompsPoolPage {
  total:    number;
  page:     number;
  pageSize: number;
  items:    CompsPoolItem[];
}

// ── Filter state ───────────────────────────────────────────────────────────

interface FilterForm {
  hood:         string;
  propertyType: string;
  minPrice:     string;
  maxPrice:     string;
  minGla:       string;
  maxGla:       string;
}

/** Committed query params — only updated when user clicks Apply. */
interface CommittedFilters {
  hood:         string | null;
  propertyType: string | null;
  minPrice:     number | null;
  maxPrice:     number | null;
  minGla:       number | null;
  maxGla:       number | null;
}

const EMPTY_FORM: FilterForm = {
  hood:         '',
  propertyType: '',
  minPrice:     '',
  maxPrice:     '',
  minGla:       '',
  maxGla:       '',
};

const EMPTY_COMMITTED: CommittedFilters = {
  hood:         null,
  propertyType: null,
  minPrice:     null,
  maxPrice:     null,
  minGla:       null,
  maxGla:       null,
};

// ── Reducer ────────────────────────────────────────────────────────────────

interface CPState {
  page:    number;
  data:    CompsPoolPage | null;
  loading: boolean;
  error:   string | null;
}

type CPAction =
  | { type: 'SET_PAGE';   page: number }
  | { type: 'RESET_PAGE' }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_OK';   data: CompsPoolPage }
  | { type: 'FETCH_ERR';  error: string };

function reducer(state: CPState, action: CPAction): CPState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: action.page, data: null, error: null };
    case 'RESET_PAGE':
      return { ...state, page: 1, data: null, error: null };
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

export const CP_PAGE_SIZE = 20;
const TAX_YEAR = new Date().getFullYear();

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

function fmtNum(n: number | null): string {
  return n == null ? '—' : n.toLocaleString();
}

function fmtRatio(n: number | null): string {
  // pacsComputedRatio is on the 0–100 scale from PACS
  if (n == null) return '—';
  return `${n.toFixed(1)}%`;
}

function conditionLabel(c: string | null): string {
  if (!c) return '—';
  return c.charAt(0).toUpperCase() + c.slice(1);
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  taxYear?: number;
}

export function CompsPoolBrowser({ taxYear = TAX_YEAR }: Props) {
  const [form,      setForm]      = useState<FilterForm>(EMPTY_FORM);
  const [committed, setCommitted] = useState<CommittedFilters>(EMPTY_COMMITTED);

  const [state, dispatch] = useReducer(reducer, {
    page:    1,
    data:    null,
    loading: false,
    error:   null,
  });

  const buildUrl = useCallback(
    (p: number, f: CommittedFilters) => {
      const params = new URLSearchParams();
      params.set('taxYear',  String(taxYear));
      params.set('page',     String(p));
      params.set('pageSize', String(CP_PAGE_SIZE));
      if (f.hood)         params.set('hood',         f.hood);
      if (f.propertyType) params.set('propertyType', f.propertyType);
      if (f.minPrice)     params.set('minPrice',     String(f.minPrice));
      if (f.maxPrice)     params.set('maxPrice',     String(f.maxPrice));
      if (f.minGla)       params.set('minGla',       String(f.minGla));
      if (f.maxGla)       params.set('maxGla',       String(f.maxGla));
      return `/api/terraforge/comps-pool?${params.toString()}`;
    },
    [taxYear],
  );

  const fetchPage = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const res  = await apiFetch(buildUrl(state.page, committed));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as CompsPoolPage;

      // Page-clamp guard
      if (json.items.length === 0 && state.page > 1) {
        const newTotalPages = Math.ceil(json.total / CP_PAGE_SIZE);
        dispatch({ type: 'SET_PAGE', page: Math.max(1, newTotalPages) });
        return;
      }

      dispatch({ type: 'FETCH_OK', data: json });
    } catch (e) {
      dispatch({
        type:  'FETCH_ERR',
        error: e instanceof Error ? e.message : 'Failed to load',
      });
    }
  }, [buildUrl, state.page, committed]);

  useEffect(() => {
    void fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.page, committed]);

  const handleApply = useCallback(() => {
    const toNum = (s: string) => {
      const n = parseFloat(s.replace(/,/g, ''));
      return isNaN(n) ? null : n;
    };
    setCommitted({
      hood:         form.hood.trim()         || null,
      propertyType: form.propertyType.trim() || null,
      minPrice:     toNum(form.minPrice),
      maxPrice:     toNum(form.maxPrice),
      minGla:       toNum(form.minGla),
      maxGla:       toNum(form.maxGla),
    });
    dispatch({ type: 'RESET_PAGE' });
  }, [form]);

  const handleClear = useCallback(() => {
    setForm(EMPTY_FORM);
    setCommitted(EMPTY_COMMITTED);
    dispatch({ type: 'RESET_PAGE' });
  }, []);

  const { page, data, loading, error } = state;
  const totalPages = data ? Math.ceil(data.total / CP_PAGE_SIZE) : 0;
  const hasFilters = Object.values(committed).some((v) => v != null);

  return (
    <section
      className="forge-panel"
      data-testid="forge-comps-pool-browser"
    >
      {/* Header */}
      <div className="forge-panel__header">
        <div>
          <p className="forge-panel__eyebrow">Comps Pool</p>
          <h2 className="forge-panel__title">
            Qualified comps pool browser
            {data != null && (
              <span
                className="forge-chip forge-chip--neutral"
                style={{ marginLeft: 10, verticalAlign: 'middle' }}
              >
                {data.total.toLocaleString()} sales
              </span>
            )}
          </h2>
        </div>
        <span className="forge-chip forge-chip--neutral">{taxYear} ratio window</span>
      </div>

      {/* Filter bar */}
      <div className="cp-filters" aria-label="Comps pool filters">
        <div className="cp-filter-row">
          <label className="cp-filter-group">
            <span className="cp-filter-label">Neighborhood</span>
            <input
              className="cp-filter-input"
              type="text"
              placeholder="e.g. 1A"
              value={form.hood}
              onChange={(e) => setForm((f) => ({ ...f, hood: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
            />
          </label>

          <label className="cp-filter-group">
            <span className="cp-filter-label">Property type</span>
            <input
              className="cp-filter-input"
              type="text"
              placeholder="e.g. residential"
              value={form.propertyType}
              onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }}
            />
          </label>

          <label className="cp-filter-group cp-filter-group--narrow">
            <span className="cp-filter-label">Min price ($)</span>
            <input
              className="cp-filter-input"
              type="number"
              placeholder="0"
              min={0}
              value={form.minPrice}
              onChange={(e) => setForm((f) => ({ ...f, minPrice: e.target.value }))}
            />
          </label>

          <label className="cp-filter-group cp-filter-group--narrow">
            <span className="cp-filter-label">Max price ($)</span>
            <input
              className="cp-filter-input"
              type="number"
              placeholder="any"
              min={0}
              value={form.maxPrice}
              onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))}
            />
          </label>

          <label className="cp-filter-group cp-filter-group--narrow">
            <span className="cp-filter-label">Min GLA (sf)</span>
            <input
              className="cp-filter-input"
              type="number"
              placeholder="0"
              min={0}
              value={form.minGla}
              onChange={(e) => setForm((f) => ({ ...f, minGla: e.target.value }))}
            />
          </label>

          <label className="cp-filter-group cp-filter-group--narrow">
            <span className="cp-filter-label">Max GLA (sf)</span>
            <input
              className="cp-filter-input"
              type="number"
              placeholder="any"
              min={0}
              value={form.maxGla}
              onChange={(e) => setForm((f) => ({ ...f, maxGla: e.target.value }))}
            />
          </label>
        </div>

        <div className="cp-filter-actions">
          <button
            type="button"
            className="cp-btn cp-btn--apply"
            onClick={handleApply}
          >
            Apply filters
          </button>
          {hasFilters && (
            <button
              type="button"
              className="cp-btn cp-btn--clear"
              onClick={handleClear}
            >
              Clear
            </button>
          )}
          {hasFilters && (
            <span className="cp-filter-active-note">Filters active</span>
          )}
        </div>
      </div>

      {/* Loading / error */}
      {loading && !data && (
        <div className="cp-state" role="status">Loading comps pool…</div>
      )}
      {error && (
        <div className="cp-state cp-state--error" role="alert">{error}</div>
      )}

      {data && data.items.length === 0 && (
        <div className="cp-state">
          No qualified sales match the current filters in the {taxYear} ratio window.
        </div>
      )}

      {/* Table */}
      {data && data.items.length > 0 && (
        <div className="cp-table" role="table" aria-label="Comps pool">
          <div className="cp-row cp-row--head" role="row">
            <span role="columnheader">Parcel / Address</span>
            <span role="columnheader">Sale date</span>
            <span role="columnheader">Price</span>
            <span role="columnheader">GLA</span>
            <span role="columnheader">Yr blt</span>
            <span role="columnheader">Bed/Bath</span>
            <span role="columnheader">Condition</span>
            <span role="columnheader">PACS ratio</span>
            <span role="columnheader">Source</span>
          </div>

          {data.items.map((item) => (
            <div key={item.saleId} className="cp-row" role="row">
              <span className="cp-cell cp-cell--identity" role="cell">
                <span className="cp-parcel">{item.parcelId}</span>
                {item.address && (
                  <span className="cp-address" title={item.address}>
                    {item.address.length > 36
                      ? `${item.address.slice(0, 36)}…`
                      : item.address}
                  </span>
                )}
                {item.hood && (
                  <span className="cp-hood">Hood {item.hood}</span>
                )}
              </span>
              <span className="cp-cell" role="cell">{fmtDate(item.saleDate)}</span>
              <span className="cp-cell cp-cell--num" role="cell">
                {fmtPrice(item.salePrice)}
                {item.adjustedSalePrice != null &&
                  item.adjustedSalePrice !== item.rawSalePrice && (
                  <span className="cp-adj" title="Adjusted sale price">adj</span>
                )}
              </span>
              <span className="cp-cell cp-cell--num" role="cell">{fmtNum(item.gla)}</span>
              <span className="cp-cell cp-cell--num" role="cell">{item.yearBuilt ?? '—'}</span>
              <span className="cp-cell cp-cell--num" role="cell">
                {item.bedrooms != null || item.bathrooms != null
                  ? `${item.bedrooms ?? '?'}/${item.bathrooms ?? '?'}`
                  : '—'}
              </span>
              <span className="cp-cell cp-cell--muted" role="cell">
                {conditionLabel(item.condition)}
              </span>
              <span className="cp-cell cp-cell--num" role="cell">
                {item.pacsComputedRatio != null ? (
                  <span className={`cp-ratio-badge ${
                    item.pacsComputedRatio >= 90 && item.pacsComputedRatio <= 110
                      ? 'cp-ratio-badge--ok'
                      : 'cp-ratio-badge--out'
                  }`}>
                    {fmtRatio(item.pacsComputedRatio)}
                  </span>
                ) : (
                  <span className="cp-ratio-badge cp-ratio-badge--missing">—</span>
                )}
              </span>
              <span className="cp-cell cp-cell--muted" role="cell">
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
        <div className="cp-pagination">
          <button
            type="button"
            className="cp-page-btn"
            disabled={page <= 1}
            onClick={() => dispatch({ type: 'SET_PAGE', page: page - 1 })}
            aria-label="Previous page"
          >
            ‹ Prev
          </button>
          <span className="cp-page-info">
            {page} / {totalPages}
            {data && (
              <span className="cp-page-total">
                &nbsp;({data.total.toLocaleString()} total)
              </span>
            )}
          </span>
          <button
            type="button"
            className="cp-page-btn"
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

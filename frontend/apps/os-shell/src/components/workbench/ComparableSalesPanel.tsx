/**
 * ComparableSalesPanel.tsx
 *
 * ADAPTER HOST — not a greenfield comp app.
 * Translates existing backend capabilities (CostForge sales-comparison endpoints)
 * and legacy comp workflow patterns (QUARANTINE comparablesService/similarityService)
 * into the Property Workbench Forge tab surface.
 *
 * Provenance:
 *   - Layout pattern: QUARANTINE PropertyComparisonTable.tsx
 *   - Filter/score logic: services/comparableSalesService.ts (adapted from legacy)
 *   - Adjustment math: CostForge POST /api/costforge/sales-comparison/adjust-comparable
 *   - Reconciliation: CostForge POST /api/costforge/sales-comparison/reconcile
 *   - Data source: dev-snapshots/benton-comparable-sales.json
 *
 * GUARDRAILS:
 *   - All adjustment/reconciliation math stays in backend CostForge
 *   - Frontend only filters, sorts, scores candidates
 *   - Graceful degradation when backend is unavailable
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useWorkbenchTab } from '../../context/workbenchTabContext';
import { usePropertyStore } from '../../stores/propertyStore';
import { invokeTool } from '../../api/pilotApi';
import {
  loadBentonComps,
  findCompsForSubject,
  adjustComp,
  reconcileComps,
  type ComparableSale,
  type ScoredComp,
  type SubjectProperty,
  type AdjustmentResult,
  type ReconciliationResult,
  type CompFilter,
} from '../../services/comparableSalesService';

const SUCCESS_COLOR = 'hsl(var(--tf-success))';
const SUCCESS_BG = 'hsl(var(--tf-success) / 0.15)';
const SUCCESS_BG_SUBTLE = 'hsl(var(--tf-success) / 0.12)';
const WARNING_COLOR = 'hsl(var(--tf-warning))';
const WARNING_BG = 'hsl(var(--tf-warning) / 0.15)';
const WARNING_BG_SUBTLE = 'hsl(var(--tf-warning) / 0.12)';
const WARNING_BANNER_BG = 'hsl(var(--tf-warning) / 0.1)';
const WARNING_BANNER_BG_SUBTLE = 'hsl(var(--tf-warning) / 0.06)';
const WARNING_BORDER = '1px solid hsl(var(--tf-warning) / 0.2)';
const ERROR_COLOR = 'hsl(var(--tf-error))';
const ERROR_BG = 'hsl(var(--tf-error) / 0.15)';

interface ComparableSalesPanelProps {
  onReconciledValue?: (result: ReconciliationResult) => void;
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const fmtCurrency = (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtPct = (v: number) => `${Math.round(v * 100)}%`;
const fmtDate = (d: string) => d.slice(0, 10);

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

/** Subject property context bar */
const SubjectBar: React.FC<{ subject: SubjectProperty }> = ({ subject }) => (
  <div
    className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2 text-xs"
    style={{
      background: 'hsl(var(--tf-accent) / 0.06)',
      borderBottom: '1px solid hsl(var(--tf-border) / 0.15)',
      color: 'hsl(var(--tf-text) / 0.8)',
    }}
  >
    <span className="font-semibold" style={{ color: 'hsl(var(--tf-accent))' }}>
      Subject: {subject.address || subject.parcelId}
    </span>
    <span>GLA: {subject.grossLivingArea?.toLocaleString() || '—'} sq ft</span>
    <span>Year: {subject.yearBuilt || '—'}</span>
    <span>Lot: {subject.lotSizeSqft?.toLocaleString() || '—'} sq ft</span>
    <span>Assessed: {subject.assessedValue ? fmtCurrency(subject.assessedValue) : '—'}</span>
  </div>
);

/** Filter controls bar */
const FilterBar: React.FC<{
  filters: CompFilter;
  onChange: (f: CompFilter) => void;
  totalCandidates: number;
}> = ({ filters, onChange, totalCandidates }) => (
  <div
    className="flex flex-wrap items-center gap-3 px-4 py-2 text-xs"
    style={{
      background: 'hsl(var(--tf-bg-surface) / 0.3)',
      borderBottom: '1px solid hsl(var(--tf-border) / 0.1)',
      color: 'hsl(var(--tf-text) / 0.7)',
    }}
  >
    <label className="flex items-center gap-1">
      <input
        type="checkbox"
        checked={filters.qualifiedOnly !== false}
        onChange={(e) => onChange({ ...filters, qualifiedOnly: e.target.checked })}
        className="accent-current"
      />
      Qualified only
    </label>
    <span style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>|</span>
    <span>{totalCandidates} candidates</span>
  </div>
);

/** Reconciliation summary */
const ReconciliationSummary: React.FC<{ result: ReconciliationResult }> = ({ result }) => (
  <div
    className="px-4 py-3"
    style={{
      background: 'hsl(var(--tf-accent) / 0.04)',
      borderTop: '1px solid hsl(var(--tf-border) / 0.15)',
    }}
  >
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-semibold" style={{ color: 'hsl(var(--tf-text) / 0.9)' }}>
        Reconciliation
      </span>
      <span
        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
        style={{
          background:
            result.confidence === 'HIGH'
              ? SUCCESS_BG
              : result.confidence === 'MODERATE'
                ? WARNING_BG
                : ERROR_BG,
          color:
            result.confidence === 'HIGH'
              ? SUCCESS_COLOR
              : result.confidence === 'MODERATE'
                ? WARNING_COLOR
                : ERROR_COLOR,
        }}
      >
        {result.confidence} confidence
      </span>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
      <div>
        <span className="block" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Weighted Avg</span>
        <span className="font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
          {fmtCurrency(result.weightedAverage)}
        </span>
      </div>
      <div>
        <span className="block" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Median</span>
        <span className="font-semibold" style={{ color: 'hsl(var(--tf-text))' }}>
          {fmtCurrency(result.median)}
        </span>
      </div>
      <div>
        <span className="block" style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>Range</span>
        <span style={{ color: 'hsl(var(--tf-text))' }}>
          {fmtCurrency(result.low)} – {fmtCurrency(result.high)}
        </span>
      </div>
      <div>
        <span className="block" style={{ color: 'hsl(var(--tf-text) / 0.5)' }} title="Coefficient of Variation (σ/μ) — measures spread relative to the mean; IAAO guideline ≤15%">CV</span>
        <span style={{ color: 'hsl(var(--tf-text))' }}>{result.coefficientOfVariation}%</span>
      </div>
    </div>
    <div className="mt-1 text-[10px]" style={{ color: 'hsl(var(--tf-text) / 0.35)' }}>
      Source: {result.source}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

export const ComparableSalesPanel: React.FC<ComparableSalesPanelProps> = ({
  onReconciledValue,
}) => {
  const { parcelId } = useWorkbenchTab();
  const activeParcel = usePropertyStore((s) => s.activeParcel);

  // Build subject from active parcel
  const subject = useMemo<SubjectProperty | null>(() => {
    if (!activeParcel) return null;
    return {
      parcelId: activeParcel.parcelId || parcelId || '',
      address: activeParcel.address || '',
      grossLivingArea: activeParcel.buildingSquareFeet || 0,
      lotSizeSqft: activeParcel.landAcreage ? Math.round(activeParcel.landAcreage * 43560) : 0,
      yearBuilt: activeParcel.yearBuilt || 0,
      bedrooms: activeParcel.bedrooms || 0,
      bathrooms: activeParcel.bathrooms || 0,
      condition: 'Average',
      qualityGrade: 'AVG',
      propertyType: activeParcel.propertyType || 'residential',
      assessedValue: activeParcel.totalAssessedValue || 0,
    };
  }, [activeParcel, parcelId]);

  // All sales from snapshot
  const allSales = useMemo(() => loadBentonComps(), []);

  // Filters
  const [filters, setFilters] = useState<CompFilter>({ qualifiedOnly: true });

  // Scored candidates
  const candidates = useMemo<ScoredComp[]>(() => {
    if (!subject) return [];
    return findCompsForSubject(subject, allSales, filters);
  }, [subject, allSales, filters]);

  // Selected comp parcelIds + saleDates (unique key)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const toggleComp = useCallback((comp: ScoredComp) => {
    const key = `${comp.parcelId}|${comp.saleDate}`;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectedComps = useMemo(
    () => candidates.filter((c) => selectedKeys.has(`${c.parcelId}|${c.saleDate}`)),
    [candidates, selectedKeys],
  );

  // Adjustment results (keyed by parcelId|saleDate)
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentResult>>({});
  const [adjustLoading, setAdjustLoading] = useState<Set<string>>(new Set());
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Fetch adjustments when selection changes
  useEffect(() => {
    if (!subject || selectedComps.length === 0) return;

    const pending = selectedComps.filter((c) => {
      const key = `${c.parcelId}|${c.saleDate}`;
      return !adjustments[key] && !adjustLoading.has(key);
    });

    if (pending.length === 0) return;

    const keys = pending.map((c) => `${c.parcelId}|${c.saleDate}`);
    setAdjustLoading((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.add(k));
      return next;
    });
    setAdjustError(null);

    Promise.allSettled(pending.map((c) => adjustComp(subject, c))).then((results) => {
      const newAdj: Record<string, AdjustmentResult> = {};
      let hasError = false;

      results.forEach((r, i) => {
        const key = keys[i];
        if (r.status === 'fulfilled') {
          newAdj[key] = r.value;
        } else {
          hasError = true;
        }
      });

      setAdjustments((prev) => ({ ...prev, ...newAdj }));
      setAdjustLoading((prev) => {
        const next = new Set(prev);
        keys.forEach((k) => next.delete(k));
        return next;
      });

      if (hasError) {
        setAdjustError('Backend unavailable — connect to CostForge API for paired adjustments');
      }
    });
  }, [subject, selectedComps, adjustments, adjustLoading]);

  // Reconciliation
  const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
  const [reconLoading, setReconLoading] = useState(false);
  const [reconError, setReconError] = useState<string | null>(null);

  const handleReconcile = useCallback(async () => {
    const adjusted = selectedComps
      .map((c) => adjustments[`${c.parcelId}|${c.saleDate}`])
      .filter(Boolean);

    if (adjusted.length < 2) return;

    setReconLoading(true);
    setReconError(null);

    try {
      const result = await reconcileComps(
        adjusted.map((a) => ({
          adjustedPrice: a.adjustedPrice,
          grossAdjustmentPct: a.grossAdjustmentPct,
        })),
      );
      setReconciliation(result);
      onReconciledValue?.(result);
    } catch {
      setReconError('Backend unavailable — connect to CostForge API for reconciliation');
    } finally {
      setReconLoading(false);
    }
  }, [selectedComps, adjustments, onReconciledValue]);

  // Auto-reconcile when we have enough adjusted comps
  const adjustedCount = selectedComps.filter(
    (c) => adjustments[`${c.parcelId}|${c.saleDate}`],
  ).length;

  useEffect(() => {
    if (adjustedCount >= 2) {
      handleReconcile();
    } else {
      setReconciliation(null);
    }
  }, [adjustedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // AI rationale
  const [rationale, setRationale] = useState<string | null>(null);
  const [rationaleLoading, setRationaleLoading] = useState(false);

  const handleRationale = useCallback(async () => {
    if (selectedComps.length === 0 || !subject) return;
    setRationaleLoading(true);
    try {
      const ids = selectedComps.map((c) => c.parcelId);
      const response = await invokeTool({
        toolId: 'summarize_sales_comps_rationale',
        params: {
          county: 'benton',
          subjectId: subject.parcelId,
          compIds: ids,
          adjustments: true,
        },
        parcelId: subject.parcelId,
      });
      if (response.success && response.result) {
        const out = response.result.output;
        setRationale(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
      }
    } catch {
      setRationale('AI rationale unavailable');
    } finally {
      setRationaleLoading(false);
    }
  }, [selectedComps, subject]);

  // No subject
  if (!subject) {
    return (
      <div
        className="flex items-center justify-center h-32 text-sm"
        data-testid="comparable-sales-empty-state"
        style={{ color: 'hsl(var(--tf-text) / 0.5)' }}
      >
        Select a parcel to view comparable sales
      </div>
    );
  }

  return (
    <div className="flex flex-col" data-testid="comparable-sales-panel" style={{ color: 'hsl(var(--tf-text))' }}>
      {/* Subject context */}
      <SubjectBar subject={subject} />

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} totalCandidates={candidates.length} />

      {/* Comp candidates table */}
      <div className="overflow-auto" style={{ maxHeight: '320px' }}>
        <table className="w-full text-xs">
          <thead
            className="sticky top-0"
            style={{
              background: 'hsl(var(--tf-bg-surface))',
              borderBottom: '1px solid hsl(var(--tf-border) / 0.2)',
            }}
          >
            <tr>
              <th className="px-2 py-1.5 text-left w-8"></th>
              <th className="px-2 py-1.5 text-left">Address</th>
              <th className="px-2 py-1.5 text-right">Sale Date</th>
              <th className="px-2 py-1.5 text-right">Sale Price</th>
              <th className="px-2 py-1.5 text-right">GLA</th>
              <th className="px-2 py-1.5 text-right">Lot</th>
              <th className="px-2 py-1.5 text-right">Year</th>
              <th className="px-2 py-1.5 text-left">Cond</th>
              <th className="px-2 py-1.5 text-left">Qual</th>
              <th className="px-2 py-1.5 text-right">$/Sq Ft</th>
              <th className="px-2 py-1.5 text-right">Sim</th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-4 py-6 text-center"
                  style={{ color: 'hsl(var(--tf-text) / 0.4)' }}
                >
                  No comparable sales match current filters
                </td>
              </tr>
            ) : (
              candidates.map((comp) => {
                const key = `${comp.parcelId}|${comp.saleDate}`;
                const isSelected = selectedKeys.has(key);
                return (
                  <tr
                    key={key}
                    className="transition-colors cursor-pointer"
                    style={{
                      background: isSelected ? 'hsl(var(--tf-accent) / 0.06)' : 'transparent',
                      borderBottom: '1px solid hsl(var(--tf-border) / 0.06)',
                    }}
                    onClick={() => toggleComp(comp)}
                  >
                    <td className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleComp(comp)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-current"
                      />
                    </td>
                    <td className="px-2 py-1 truncate max-w-[180px]" title={comp.address}>
                      {comp.address}
                    </td>
                    <td className="px-2 py-1 text-right whitespace-nowrap">{fmtDate(comp.saleDate)}</td>
                    <td className="px-2 py-1 text-right font-medium">{fmtCurrency(comp.salePrice)}</td>
                    <td className="px-2 py-1 text-right">
                      {comp.grossLivingArea?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {comp.lotSizeSqft ? Math.round(comp.lotSizeSqft).toLocaleString() : '—'}
                    </td>
                    <td className="px-2 py-1 text-right">{comp.yearBuilt ?? '—'}</td>
                    <td className="px-2 py-1">{comp.condition ?? '—'}</td>
                    <td className="px-2 py-1">{comp.qualityGrade ?? '—'}</td>
                    <td className="px-2 py-1 text-right">
                      {comp.pricePerSqft ? `$${comp.pricePerSqft.toFixed(0)}` : '—'}
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span
                        className="inline-block px-1 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          background:
                            comp.similarityScore >= 0.7
                              ? SUCCESS_BG_SUBTLE
                              : comp.similarityScore >= 0.4
                                ? WARNING_BG_SUBTLE
                                : 'hsl(var(--tf-text) / 0.06)',
                          color:
                            comp.similarityScore >= 0.7
                              ? SUCCESS_COLOR
                              : comp.similarityScore >= 0.4
                                ? WARNING_COLOR
                                : 'hsl(var(--tf-text) / 0.5)',
                        }}
                      >
                        {fmtPct(comp.similarityScore)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Adjustment grid for selected comps */}
      {selectedComps.length > 0 && (
        <div
          className="px-4 py-3"
          style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.15)' }}
        >
          <div className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--tf-text) / 0.9)' }}>
            Paired Adjustments ({selectedComps.length} selected)
          </div>

          {adjustError && (
            <div
              className="text-xs px-3 py-2 rounded mb-2"
              style={{
                background: WARNING_BANNER_BG,
                color: WARNING_COLOR,
                border: WARNING_BORDER,
              }}
            >
              {adjustError}
            </div>
          )}

          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                  <th className="px-2 py-1 text-left">Address</th>
                  <th className="px-2 py-1 text-right">Sale Price</th>
                  <th className="px-2 py-1 text-right">GLA Adj</th>
                  <th className="px-2 py-1 text-right">Lot Adj</th>
                  <th className="px-2 py-1 text-right">Age Adj</th>
                  <th className="px-2 py-1 text-right">Cond Adj</th>
                  <th className="px-2 py-1 text-right">Net Adj</th>
                  <th className="px-2 py-1 text-right font-semibold">Adjusted</th>
                  <th className="px-2 py-1 text-right">Gross%</th>
                </tr>
              </thead>
              <tbody>
                {selectedComps.map((comp) => {
                  const key = `${comp.parcelId}|${comp.saleDate}`;
                  const adj = adjustments[key];
                  const loading = adjustLoading.has(key);

                  if (loading) {
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.06)' }}>
                        <td className="px-2 py-1 truncate max-w-[150px]">{comp.address}</td>
                        <td colSpan={8} className="px-2 py-1 text-center" style={{ color: 'hsl(var(--tf-text) / 0.4)' }}>
                          Loading adjustments...
                        </td>
                      </tr>
                    );
                  }

                  if (!adj) {
                    return (
                      <tr key={key} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.06)' }}>
                        <td className="px-2 py-1 truncate max-w-[150px]">{comp.address}</td>
                        <td className="px-2 py-1 text-right">{fmtCurrency(comp.salePrice)}</td>
                        <td colSpan={7} className="px-2 py-1 text-center" style={{ color: 'hsl(var(--tf-text) / 0.35)' }}>
                          Awaiting backend
                        </td>
                      </tr>
                    );
                  }

                  const fmtAdj = (v: number) => {
                    if (v === 0) return '—';
                    return v > 0 ? `+${fmtCurrency(v)}` : `-${fmtCurrency(Math.abs(v))}`;
                  };

                  return (
                    <tr key={key} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.06)' }}>
                      <td className="px-2 py-1 truncate max-w-[150px]">{comp.address}</td>
                      <td className="px-2 py-1 text-right">{fmtCurrency(adj.salePrice)}</td>
                      <td className="px-2 py-1 text-right">{fmtAdj(adj.glaAdjustment)}</td>
                      <td className="px-2 py-1 text-right">{fmtAdj(adj.lotAdjustment)}</td>
                      <td className="px-2 py-1 text-right">{fmtAdj(adj.ageAdjustment)}</td>
                      <td className="px-2 py-1 text-right">{fmtAdj(adj.conditionAdjustment)}</td>
                      <td className="px-2 py-1 text-right font-medium">{fmtAdj(adj.totalNetAdjustment)}</td>
                      <td className="px-2 py-1 text-right font-semibold" style={{ color: 'hsl(var(--tf-accent))' }}>
                        {fmtCurrency(adj.adjustedPrice)}
                      </td>
                      <td className="px-2 py-1 text-right">{adj.grossAdjustmentPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* AI Rationale button */}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handleRationale}
              disabled={rationaleLoading || selectedComps.length === 0}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                background: 'hsl(var(--tf-accent) / 0.1)',
                color: 'hsl(var(--tf-accent))',
                border: '1px solid hsl(var(--tf-accent) / 0.2)',
                opacity: rationaleLoading ? 0.5 : 1,
              }}
            >
              {rationaleLoading ? 'Generating...' : 'AI Comp Rationale'}
            </button>
          </div>

          {rationale && (
            <div
              className="mt-2 text-xs p-3 rounded whitespace-pre-wrap"
              style={{
                background: 'hsl(var(--tf-bg-surface) / 0.5)',
                color: 'hsl(var(--tf-text) / 0.8)',
                border: '1px solid hsl(var(--tf-border) / 0.1)',
              }}
            >
              {rationale}
            </div>
          )}
        </div>
      )}

      {/* Reconciliation summary */}
      {reconLoading && (
        <div
          className="px-4 py-2 text-xs"
          style={{ color: 'hsl(var(--tf-text) / 0.4)', borderTop: '1px solid hsl(var(--tf-border) / 0.1)' }}
        >
          Reconciling...
        </div>
      )}

      {reconError && (
        <div
          className="px-4 py-2 text-xs"
          style={{
              color: WARNING_COLOR,
              background: WARNING_BANNER_BG_SUBTLE,
            borderTop: '1px solid hsl(var(--tf-border) / 0.1)',
          }}
        >
          {reconError}
        </div>
      )}

      {reconciliation && <ReconciliationSummary result={reconciliation} />}
    </div>
  );
};

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
 *   - Candidate data: Washington statewide launch package county shards
 *
 * GUARDRAILS:
 *   - All adjustment/reconciliation math stays in backend CostForge
 *   - Frontend only filters, sorts, scores candidates
 *   - Graceful degradation when backend is unavailable
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getSession } from '../../auth/session';
import { useWorkbenchTab } from '../../context/workbenchTabContext';
import { usePropertyStore } from '../../stores/propertyStore';
import { invokeTool } from '../../api/pilotApi';
import {
  findCompsForSubject,
  adjustComp,
  reconcileComps,
  loadCountyComps,
  getComparableCountyName,
  getPilotCountyScopeToken,
  doesPilotCountyMatchComparableCounty,
  supportsGovernedComparableAdjustments,
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

type CandidateDecision = 'use' | 'reject' | 'needs-data';
type PhysicalSupportStatus = 'supported' | 'partial' | 'blocked';
type AdjustmentSupportStatus = 'supported' | 'partial' | 'blocked';

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const REQUIRED_COMP_COUNT = 3;
const REQUIRED_COMPLETENESS = 1;

const fmtCurrency = (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtPct = (v: number) => `${Math.round(v * 100)}%`;
const fmtDate = (d: string) => d.slice(0, 10);

function compKey(comp: ComparableSale): string {
  return `${comp.parcelId}|${comp.saleDate}`;
}

function hasPhysicalSupport(comp: ComparableSale): boolean {
  return Boolean(
    comp.grossLivingArea &&
    comp.grossLivingArea > 0 &&
    comp.lotSizeSqft &&
    comp.lotSizeSqft > 0 &&
    comp.yearBuilt &&
    comp.yearBuilt > 0 &&
    comp.condition &&
    comp.qualityGrade
  );
}

function hasSubjectPhysicalSupport(subject: SubjectProperty): boolean {
  return Boolean(
    subject.grossLivingArea > 0 &&
      subject.lotSizeSqft > 0 &&
      subject.yearBuilt > 0 &&
      subject.condition &&
      subject.qualityGrade
  );
}

function isSimilarityDefensible(comp: ScoredComp): boolean {
  return comp.similarityScore >= 0.4;
}

function getSubjectBlockers(subject: SubjectProperty): string[] {
  return [
    subject.grossLivingArea > 0 ? null : 'Subject missing GLA',
    subject.lotSizeSqft > 0 ? null : 'Subject missing site size',
    subject.yearBuilt > 0 ? null : 'Subject missing year built',
    subject.propertyType ? null : 'Subject missing property type',
    subject.condition ? null : 'Subject missing condition',
    subject.qualityGrade ? null : 'Subject missing quality',
  ].filter((value): value is string => Boolean(value));
}

function getCompCompleteness(comp: ComparableSale): number {
  const checks = [
    comp.grossLivingArea != null && comp.grossLivingArea > 0,
    comp.lotSizeSqft != null && comp.lotSizeSqft > 0,
    comp.yearBuilt != null && comp.yearBuilt > 0,
    Boolean(comp.condition),
    Boolean(comp.qualityGrade),
  ];
  return checks.filter(Boolean).length / checks.length;
}

function getPhysicalSupportStatus(total: number, supported: number): PhysicalSupportStatus {
  if (total === 0 || supported === 0) return 'blocked';
  if (supported === total) return 'supported';
  return 'partial';
}

function getAdjustmentSupportStatus(total: number, adjusted: number): AdjustmentSupportStatus {
  if (total === 0 || adjusted === 0) return 'blocked';
  if (adjusted === total) return 'supported';
  return 'partial';
}

function formatSupportStatus(status: PhysicalSupportStatus | AdjustmentSupportStatus): string {
  if (status === 'supported') return 'supported';
  if (status === 'partial') return 'partial';
  return 'blocked';
}

function getCompBlockers(
  comp: ScoredComp,
  decision: CandidateDecision | undefined,
  adjustment: AdjustmentResult | undefined
): string[] {
  const blockers: string[] = [];
  const label = `Comp ${comp.parcelId}`;

  if (decision === 'reject') blockers.push(`${label} rejected`);
  if (decision === 'needs-data') blockers.push(`${label} needs sale validation`);
  if (decision !== 'use') return blockers;

  if (comp.saleQualification !== 'qualified') blockers.push(`${label} needs sale validation`);
  if (getCompCompleteness(comp) < REQUIRED_COMPLETENESS) blockers.push(`${label} missing physical support`);
  if (!hasPhysicalSupport(comp)) blockers.push(`${label} has physical mismatch`);
  if (!isSimilarityDefensible(comp)) blockers.push(`${label} below minimum similarity support`);
  if (!adjustment) blockers.push(`${label} selected but not adjusted`);
  if (adjustment && adjustment.grossAdjustmentPct > 25) {
    blockers.push(`${label} exceeds gross adjustment tolerance`);
  }

  return blockers;
}

function isDefensibleComp(
  comp: ScoredComp,
  decision: CandidateDecision | undefined,
  adjustment: AdjustmentResult | undefined
): boolean {
  return (
    decision === 'use' &&
    comp.saleQualification === 'qualified' &&
    getCompCompleteness(comp) >= REQUIRED_COMPLETENESS &&
    hasPhysicalSupport(comp) &&
    isSimilarityDefensible(comp) &&
    Boolean(adjustment) &&
    (!adjustment || adjustment.grossAdjustmentPct <= 25)
  );
}

function stringFromRecord(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

/** Subject property context bar */
const SubjectBar: React.FC<{ subject: SubjectProperty }> = ({ subject }) => (
  <div
    className='flex flex-wrap gap-x-6 gap-y-1 px-4 py-2 text-xs'
    style={{
      background: 'hsl(var(--tf-accent) / 0.06)',
      borderBottom: '1px solid hsl(var(--tf-border) / 0.15)',
      color: 'hsl(var(--tf-text) / 0.8)',
    }}
  >
    <span className='font-semibold' style={{ color: 'hsl(var(--tf-accent))' }}>
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
    className='flex flex-wrap items-center gap-3 px-4 py-2 text-xs'
    style={{
      background: 'hsl(var(--tf-bg-surface) / 0.3)',
      borderBottom: '1px solid hsl(var(--tf-border) / 0.1)',
      color: 'hsl(var(--tf-text) / 0.7)',
    }}
  >
    <label className='flex items-center gap-1'>
      <input
        type='checkbox'
        checked={filters.qualifiedOnly !== false}
        onChange={(e) => onChange({ ...filters, qualifiedOnly: e.target.checked })}
        className='accent-current'
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
    className='px-4 py-3'
    style={{
      background: 'hsl(var(--tf-accent) / 0.04)',
      borderTop: '1px solid hsl(var(--tf-border) / 0.15)',
    }}
  >
    <div className='flex items-center gap-2 mb-2'>
      <span className='text-xs font-semibold' style={{ color: 'hsl(var(--tf-text) / 0.9)' }}>
        Reconciliation
      </span>
      <span
        className='text-[10px] px-1.5 py-0.5 rounded font-medium'
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
    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
      <div>
        <span className='block' style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
          Weighted Avg
        </span>
        <span className='font-semibold' style={{ color: 'hsl(var(--tf-text))' }}>
          {fmtCurrency(result.weightedAverage)}
        </span>
      </div>
      <div>
        <span className='block' style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
          Median
        </span>
        <span className='font-semibold' style={{ color: 'hsl(var(--tf-text))' }}>
          {fmtCurrency(result.median)}
        </span>
      </div>
      <div>
        <span className='block' style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
          Range
        </span>
        <span style={{ color: 'hsl(var(--tf-text))' }}>
          {fmtCurrency(result.low)} – {fmtCurrency(result.high)}
        </span>
      </div>
      <div>
        <span
          className='block'
          style={{ color: 'hsl(var(--tf-text) / 0.5)' }}
          title='Coefficient of Variation (σ/μ) — measures spread relative to the mean; IAAO guideline ≤15%'
        >
          CV
        </span>
        <span style={{ color: 'hsl(var(--tf-text))' }}>{result.coefficientOfVariation}%</span>
      </div>
    </div>
    <div className='mt-1 text-[10px]' style={{ color: 'hsl(var(--tf-text) / 0.35)' }}>
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
  const activeParcelLoading = usePropertyStore((s) => s.activeParcelLoading);
  const countyCode = activeParcel?.countyCode ?? null;
  const countyName = useMemo(() => getComparableCountyName(countyCode), [countyCode]);
  const pilotCountyScope = useMemo(
    () => getPilotCountyScopeToken(getSession()?.countyId ?? null),
    []
  );
  const countyScopeMismatch = useMemo(
    () =>
      countyCode != null &&
      pilotCountyScope != null &&
      !doesPilotCountyMatchComparableCounty(pilotCountyScope, countyCode),
    [countyCode, pilotCountyScope]
  );
  const adjustmentsSupported = useMemo(
    () => supportsGovernedComparableAdjustments(countyCode),
    [countyCode]
  );

  // Build subject from active parcel
  const subject = useMemo<SubjectProperty | null>(() => {
    if (!activeParcel) return null;
    const parcelRecord = activeParcel as unknown as Record<string, unknown>;
    return {
      parcelId: activeParcel.parcelId || parcelId || '',
      address: activeParcel.address || '',
      grossLivingArea: activeParcel.buildingSquareFeet || 0,
      lotSizeSqft: activeParcel.landAcreage ? Math.round(activeParcel.landAcreage * 43560) : 0,
      yearBuilt: activeParcel.yearBuilt || 0,
      bedrooms: activeParcel.bedrooms || 0,
      bathrooms: activeParcel.bathrooms || 0,
      condition: stringFromRecord(parcelRecord, [
        'condition',
        'propertyCondition',
        'improvementCondition',
        'camaCondition',
      ]),
      qualityGrade: stringFromRecord(parcelRecord, [
        'qualityGrade',
        'quality',
        'propertyQuality',
        'improvementQuality',
        'camaQualityGrade',
      ]),
      propertyType: activeParcel.propertyType || 'residential',
      assessedValue: activeParcel.totalAssessedValue || 0,
    };
  }, [activeParcel, parcelId]);
  const subjectPhysicalSupported = useMemo(
    () => (subject ? hasSubjectPhysicalSupport(subject) : false),
    [subject]
  );
  const subjectEvidence = useMemo(() => {
    if (!activeParcel || !subject) return null;
    return {
      source:
        activeParcel.dataSource === 'assessment-source-live'
          ? 'Canonical parcel/improvement/land truth'
          : 'Loaded workbench parcel record',
      parcelReady: Boolean(subject.parcelId && subject.address && subject.assessedValue > 0),
      improvementReady: Boolean(subject.grossLivingArea > 0 && subject.yearBuilt > 0),
      landReady: Boolean(subject.lotSizeSqft > 0),
      missingPhysicals: getSubjectBlockers(subject).map((blocker) =>
        blocker.replace(/^Subject missing /, '')
      ),
    };
  }, [activeParcel, subject]);

  const [allSales, setAllSales] = useState<ComparableSale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSales() {
      if (!countyCode) {
        setAllSales([]);
        setSalesError(
          'Comparable sales cannot load until the active parcel includes a county code.'
        );
        setSalesLoading(false);
        return;
      }

      setSalesLoading(true);
      setSalesError(null);

      try {
        const sales = await loadCountyComps(countyCode);
        if (!cancelled) {
          setAllSales(sales);
          setSalesLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setAllSales([]);
          setSalesError(
            error instanceof Error
              ? error.message
              : `${countyName} County comparable sales are unavailable.`
          );
          setSalesLoading(false);
        }
      }
    }

    void loadSales();

    return () => {
      cancelled = true;
    };
  }, [countyCode, countyName]);

  // Filters
  const [filters, setFilters] = useState<CompFilter>({ qualifiedOnly: true });

  // Scored candidates
  const candidates = useMemo<ScoredComp[]>(() => {
    if (!subject) return [];
    return findCompsForSubject(subject, allSales, filters);
  }, [subject, allSales, filters]);

  // Selected comp parcelIds + saleDates (unique key)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [candidateDecisions, setCandidateDecisions] = useState<Record<string, CandidateDecision>>(
    {}
  );

  const toggleComp = useCallback((comp: ScoredComp) => {
    const key = compKey(comp);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setCandidateDecisions((decisions) => {
          const rest = { ...decisions };
          delete rest[key];
          return rest;
        });
      } else {
        next.add(key);
        setCandidateDecisions((decisions) => ({ ...decisions, [key]: 'use' }));
      }
      return next;
    });
  }, []);

  const setCandidateDecision = useCallback((comp: ScoredComp, decision: CandidateDecision) => {
    const key = compKey(comp);

    setCandidateDecisions((prev) => ({ ...prev, [key]: decision }));
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (decision === 'use') next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const selectedComps = useMemo(
    () => candidates.filter((c) => selectedKeys.has(compKey(c))),
    [candidates, selectedKeys]
  );

  // Adjustment results (keyed by parcelId|saleDate)
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentResult>>({});
  const [adjustLoading, setAdjustLoading] = useState<Set<string>>(new Set());
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Fetch adjustments when selection changes
  useEffect(() => {
    if (!subject || selectedComps.length === 0) return;

    if (!subjectPhysicalSupported) {
      if (Object.keys(adjustments).length > 0) {
        setAdjustments({});
      }
      setReconciliation(null);
      setAdjustError(
        'Subject physical support incomplete — paired adjustments are blocked until CAMA quality and condition are present.'
      );
      return;
    }

    if (!adjustmentsSupported) {
      setAdjustments({});
      setReconciliation(null);
      setAdjustError(
        `${countyName} County comparable sales are available, but governed paired adjustments and reconciliation are currently certified only for Benton County.`
      );
      return;
    }

    const pending = selectedComps.filter((c) => {
      const key = compKey(c);
      return !adjustments[key] && !adjustLoading.has(key);
    });

    if (pending.length === 0) return;

    const keys = pending.map(compKey);
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
  }, [
    subject,
    selectedComps,
    adjustments,
    adjustLoading,
    adjustmentsSupported,
    countyName,
    subjectPhysicalSupported,
  ]);

  const adjustedCount = selectedComps.filter(
    (c) => adjustments[compKey(c)]
  ).length;

  const physicallySupportedCount = selectedComps.filter(hasPhysicalSupport).length;
  const physicalSupportStatus = getPhysicalSupportStatus(
    selectedComps.length,
    physicallySupportedCount
  );
  const adjustmentSupportStatus = getAdjustmentSupportStatus(selectedComps.length, adjustedCount);
  const defensibleSelectedCount = selectedComps.filter((comp) =>
    isDefensibleComp(comp, candidateDecisions[compKey(comp)], adjustments[compKey(comp)])
  ).length;
  const overAdjustmentCount = selectedComps.filter((comp) => {
    const adjustment = adjustments[compKey(comp)];
    return adjustment ? adjustment.grossAdjustmentPct > 25 : false;
  }).length;
  const readinessBlockers = useMemo(() => {
    const blockers: string[] = [];

    if (selectedComps.length < REQUIRED_COMP_COUNT) {
      blockers.push('Select at least 3 defensible comps.');
      blockers.push(`Selected comps: ${selectedComps.length} / ${REQUIRED_COMP_COUNT} required.`);
    }
    if (!subjectPhysicalSupported) {
      blockers.push('Subject physical support incomplete.');
      if (subject) blockers.push(...getSubjectBlockers(subject));
    }
    if (physicallySupportedCount < selectedComps.length) {
      blockers.push('Selected comps need complete physical support.');
    }
    if (!adjustmentsSupported) {
      blockers.push('Governed paired adjustments are not certified for this county.');
    }
    if (selectedComps.length > 0 && adjustedCount < selectedComps.length) {
      blockers.push('Adjustment support is still incomplete.');
    }
    if (overAdjustmentCount > 0) {
      blockers.push('One or more comps exceed the gross adjustment tolerance.');
    }
    selectedComps.forEach((comp) => {
      blockers.push(
        ...getCompBlockers(comp, candidateDecisions[compKey(comp)], adjustments[compKey(comp)])
      );
    });

    return Array.from(new Set(blockers));
  }, [
    adjustedCount,
    adjustmentsSupported,
    adjustments,
    candidateDecisions,
    defensibleSelectedCount,
    overAdjustmentCount,
    physicallySupportedCount,
    selectedComps,
    selectedComps.length,
    subject,
    subjectPhysicalSupported,
  ]);
  const reconciliationReady =
    selectedComps.length >= REQUIRED_COMP_COUNT &&
    defensibleSelectedCount >= REQUIRED_COMP_COUNT &&
    readinessBlockers.length === 0;

  // Reconciliation
  const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
  const [reconLoading, setReconLoading] = useState(false);
  const [reconError, setReconError] = useState<string | null>(null);

  const handleReconcile = useCallback(async () => {
    const adjusted = selectedComps
      .map((c) => adjustments[compKey(c)])
      .filter(Boolean);

    if (!reconciliationReady || adjusted.length < 3) return;

    setReconLoading(true);
    setReconError(null);

    try {
      const result = await reconcileComps(
        adjusted.map((a) => ({
          adjustedPrice: a.adjustedPrice,
          grossAdjustmentPct: a.grossAdjustmentPct,
        }))
      );
      setReconciliation(result);
      onReconciledValue?.(result);
    } catch {
      setReconError('Backend unavailable — connect to CostForge API for reconciliation');
    } finally {
      setReconLoading(false);
    }
  }, [selectedComps, adjustments, onReconciledValue, reconciliationReady]);

  useEffect(() => {
    if (reconciliationReady) {
      handleReconcile();
    } else {
      setReconciliation(null);
    }
  }, [reconciliationReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // AI rationale
  const [rationale, setRationale] = useState<string | null>(null);
  const [rationaleLoading, setRationaleLoading] = useState(false);

  const handleRationale = useCallback(async () => {
    if (selectedComps.length === 0 || !subject) return;
    if (!pilotCountyScope) {
      setRationale('Governed rationale is unavailable until a county-scoped session is active.');
      return;
    }
    if (countyScopeMismatch) {
      setRationale('Governed rationale is only available for parcels inside your county scope.');
      return;
    }
    setRationaleLoading(true);
    try {
      const ids = selectedComps.map((c) => c.parcelId);
      const response = await invokeTool({
        toolId: 'summarize_sales_comps_rationale',
        params: {
          county: pilotCountyScope,
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
  }, [selectedComps, subject, pilotCountyScope, countyScopeMismatch]);

  // No subject
  if (!subject) {
    if (parcelId) {
      return (
        <div
          className='rounded-xl p-4 text-sm'
          data-testid='comparable-sales-empty-state'
          style={{
            color: 'hsl(var(--tf-text))',
            background:
              'linear-gradient(135deg, hsl(var(--tf-bg-surface) / 0.96), hsl(var(--tf-bg-elevated) / 0.92))',
            border: '1px solid hsl(var(--tf-border) / 0.22)',
          }}
        >
          <div
            className='text-[10px] font-semibold uppercase tracking-[0.16em]'
            style={{ color: 'hsl(var(--tf-accent))' }}
          >
            Property Workbench / Forge / Sales
          </div>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <span className='text-base font-semibold'>
              {activeParcelLoading
                ? 'Loading parcel evidence.'
                : 'Parcel evidence unavailable. Comparable review blocked.'}
            </span>
            <span
              className='rounded-full px-2 py-0.5 text-[10px] font-semibold'
              style={{
                background: WARNING_BG_SUBTLE,
                color: WARNING_COLOR,
                border: `1px solid ${WARNING_COLOR}33`,
              }}
            >
              Reconciliation blocked
            </span>
          </div>
          <div className='mt-2 text-xs' style={{ color: 'hsl(var(--tf-text) / 0.62)' }}>
            Route parcel: {parcelId}. Use sealed parcel, improvement, and land truth only.
            Sales comparison remains on hold until the workbench can load the active parcel
            record.
          </div>
          <div className='mt-3 text-xs' style={{ color: WARNING_COLOR }}>
            No comparable selection, adjustment request, or reconciliation posture will run without
            an active parcel evidence record.
          </div>
        </div>
      );
    }

    return (
      <div
        className='flex items-center justify-center h-32 text-sm'
        data-testid='comparable-sales-empty-state'
        style={{ color: 'hsl(var(--tf-text) / 0.5)' }}
      >
        Select a parcel to view comparable sales
      </div>
    );
  }

  return (
    <div
      className='flex flex-col gap-3 rounded-xl p-3'
      data-testid='comparable-sales-panel'
      style={{
        color: 'hsl(var(--tf-text))',
        background:
          'linear-gradient(135deg, hsl(var(--tf-bg-surface) / 0.96), hsl(var(--tf-bg-elevated) / 0.92))',
        border: '1px solid hsl(var(--tf-border) / 0.22)',
      }}
    >
      <section
        className='rounded-lg'
        data-testid='compsforge-review-desk'
        style={{
          background: 'hsl(var(--tf-bg-surface) / 0.50)',
          border: '1px solid hsl(var(--tf-border) / 0.18)',
        }}
      >
        <div
          className='flex flex-wrap items-start justify-between gap-3 px-4 py-3'
          style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.14)' }}
        >
          <div>
            <div
              className='text-[10px] font-semibold uppercase tracking-[0.16em]'
              style={{ color: 'hsl(var(--tf-accent))' }}
            >
              Property Workbench / Forge / Sales
            </div>
            <h3 className='mt-1 text-base font-semibold'>CompsForge Review Desk</h3>
            <p className='mt-1 text-xs' style={{ color: 'hsl(var(--tf-text) / 0.62)' }}>
              Parcel-scoped comparable selection, adjustment support, and reconciliation readiness.
            </p>
          </div>
          <div
            className='rounded-full px-3 py-1 text-xs font-semibold'
            style={{
              background: reconciliationReady ? SUCCESS_BG : WARNING_BG_SUBTLE,
              color: reconciliationReady ? SUCCESS_COLOR : WARNING_COLOR,
              border: `1px solid ${reconciliationReady ? SUCCESS_COLOR : WARNING_COLOR}33`,
            }}
          >
            {reconciliationReady ? 'Reconciliation ready' : 'Reconciliation blocked'}
          </div>
        </div>

        <SubjectBar subject={subject} />

        <div className='grid gap-3 p-3 xl:grid-cols-[minmax(0,1fr)_320px]'>
          <div
            className='min-w-0 rounded-lg'
            style={{
              background: 'hsl(var(--tf-bg-elevated) / 0.42)',
              border: '1px solid hsl(var(--tf-border) / 0.14)',
            }}
          >
            <div className='flex flex-wrap items-center justify-between gap-2 px-4 py-3'>
              <div>
                <div className='text-sm font-semibold'>Candidate Sales</div>
                <div className='text-xs' style={{ color: 'hsl(var(--tf-text) / 0.55)' }}>
                  Select only comps that can survive physical, adjustment, and review scrutiny.
                </div>
              </div>
            </div>

            <FilterBar
              filters={filters}
              onChange={setFilters}
              totalCandidates={candidates.length}
            />

            {salesError && (
              <div
                className='text-xs px-3 py-2'
                style={{
                  color: WARNING_COLOR,
                  background: WARNING_BANNER_BG_SUBTLE,
                  borderBottom: '1px solid hsl(var(--tf-border) / 0.1)',
                }}
              >
                {salesError}
              </div>
            )}

            {!adjustmentsSupported && countyCode && (
              <div
                className='text-xs px-3 py-2'
                style={{
                  color: WARNING_COLOR,
                  background: WARNING_BANNER_BG_SUBTLE,
                  borderBottom: '1px solid hsl(var(--tf-border) / 0.1)',
                }}
              >
                {countyName} County comps are loaded from the statewide sales database, but governed
                paired adjustments and reconciliation remain Benton-certified only.
              </div>
            )}

            {countyScopeMismatch && (
              <div
                className='text-xs px-3 py-2'
                style={{
                  color: WARNING_COLOR,
                  background: WARNING_BANNER_BG_SUBTLE,
                  borderBottom: '1px solid hsl(var(--tf-border) / 0.1)',
                }}
              >
                You can review statewide parcels here, but governed county-scoped comp rationale is
                unavailable outside your own county.
              </div>
            )}

            {/* Comp candidates table */}
            <div className='overflow-auto' style={{ maxHeight: '320px' }}>
              <table className='w-full text-xs'>
                <thead
                  className='sticky top-0'
                  style={{
                    background: 'hsl(var(--tf-bg-surface))',
                    borderBottom: '1px solid hsl(var(--tf-border) / 0.2)',
                  }}
                >
                  <tr>
                    <th className='px-2 py-1.5 text-left w-8'></th>
                    <th className='px-2 py-1.5 text-left'>Address</th>
                    <th className='px-2 py-1.5 text-right'>Sale Date</th>
                    <th className='px-2 py-1.5 text-right'>Sale Price</th>
                    <th className='px-2 py-1.5 text-right'>GLA</th>
                    <th className='px-2 py-1.5 text-right'>Lot</th>
                    <th className='px-2 py-1.5 text-right'>Year</th>
                    <th className='px-2 py-1.5 text-left'>Cond</th>
                    <th className='px-2 py-1.5 text-left'>Qual</th>
                    <th className='px-2 py-1.5 text-right'>$/Sq Ft</th>
                    <th className='px-2 py-1.5 text-right'>Sim</th>
                    <th className='px-2 py-1.5 text-left'>Qualification</th>
                    <th className='px-2 py-1.5 text-left'>Completeness</th>
                    <th className='px-2 py-1.5 text-left'>Physical Support</th>
                    <th className='px-2 py-1.5 text-left'>Adjustment Status</th>
                    <th className='px-2 py-1.5 text-left'>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.length === 0 ? (
                    <tr>
                      <td
                        colSpan={16}
                        className='px-4 py-6 text-center'
                        style={{ color: 'hsl(var(--tf-text) / 0.4)' }}
                      >
                        {salesLoading
                          ? `Loading ${countyName} County comparable sales...`
                          : 'No comparable sales match current filters'}
                      </td>
                    </tr>
                  ) : (
                    candidates.map((comp) => {
                      const key = compKey(comp);
                      const isSelected = selectedKeys.has(key);
                      const decision = candidateDecisions[key];
                      const completeness = getCompCompleteness(comp);
                      const physicalSupported = hasPhysicalSupport(comp);
                      const adjustment = adjustments[key];
                      const adjustmentStatus = adjustment
                        ? 'Adjusted'
                        : adjustLoading.has(key)
                          ? 'Adjustment Loading'
                          : 'Adjustment Pending';
                      const handleDecision = (
                        event: React.MouseEvent<HTMLButtonElement>,
                        nextDecision: CandidateDecision
                      ) => {
                        event.stopPropagation();
                        setCandidateDecision(comp, nextDecision);
                      };
                      const decisionLabel =
                        decision === 'use'
                          ? 'Using'
                          : decision === 'reject'
                            ? 'Rejected'
                            : decision === 'needs-data'
                              ? 'Needs Data'
                              : 'No decision';
                      return (
                        <tr
                          key={key}
                          className='transition-colors cursor-pointer'
                          style={{
                            background: isSelected ? 'hsl(var(--tf-accent) / 0.06)' : 'transparent',
                            borderBottom: '1px solid hsl(var(--tf-border) / 0.06)',
                          }}
                          onClick={() => toggleComp(comp)}
                        >
                          <td className='px-2 py-1'>
                            <input
                              type='checkbox'
                              checked={isSelected}
                              onChange={() => toggleComp(comp)}
                              onClick={(e) => e.stopPropagation()}
                              className='accent-current'
                            />
                          </td>
                          <td className='px-2 py-1 truncate max-w-[180px]' title={comp.address}>
                            {comp.address}
                          </td>
                          <td className='px-2 py-1 text-right whitespace-nowrap'>
                            {fmtDate(comp.saleDate)}
                          </td>
                          <td className='px-2 py-1 text-right font-medium'>
                            {fmtCurrency(comp.salePrice)}
                          </td>
                          <td className='px-2 py-1 text-right'>
                            {comp.grossLivingArea?.toLocaleString() ?? '—'}
                          </td>
                          <td className='px-2 py-1 text-right'>
                            {comp.lotSizeSqft ? Math.round(comp.lotSizeSqft).toLocaleString() : '—'}
                          </td>
                          <td className='px-2 py-1 text-right'>{comp.yearBuilt ?? '—'}</td>
                          <td className='px-2 py-1'>{comp.condition ?? '—'}</td>
                          <td className='px-2 py-1'>{comp.qualityGrade ?? '—'}</td>
                          <td className='px-2 py-1 text-right'>
                            {comp.pricePerSqft ? `$${comp.pricePerSqft.toFixed(0)}` : '—'}
                          </td>
                          <td className='px-2 py-1 text-right'>
                            <span
                              className='inline-block px-1 py-0.5 rounded text-[10px] font-medium'
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
                          <td className='px-2 py-1'>
                            <span
                              className='rounded px-1.5 py-0.5 text-[10px] font-semibold'
                              style={{
                                background:
                                  comp.saleQualification === 'qualified'
                                    ? SUCCESS_BG_SUBTLE
                                    : WARNING_BG_SUBTLE,
                                color:
                                  comp.saleQualification === 'qualified'
                                    ? SUCCESS_COLOR
                                    : WARNING_COLOR,
                              }}
                            >
                              {comp.saleQualification === 'qualified'
                                ? 'Qualified'
                                : 'Sale Unverified'}
                            </span>
                          </td>
                          <td className='px-2 py-1'>
                            <span
                              className='rounded px-1.5 py-0.5 text-[10px] font-semibold'
                              style={{
                                background:
                                  completeness >= REQUIRED_COMPLETENESS
                                    ? SUCCESS_BG_SUBTLE
                                    : WARNING_BG_SUBTLE,
                                color:
                                  completeness >= REQUIRED_COMPLETENESS
                                    ? SUCCESS_COLOR
                                    : WARNING_COLOR,
                              }}
                            >
                              {fmtPct(completeness)}
                            </span>
                          </td>
                          <td className='px-2 py-1'>
                            <span
                              className='rounded px-1.5 py-0.5 text-[10px] font-semibold'
                              style={{
                                background: physicalSupported ? SUCCESS_BG_SUBTLE : WARNING_BG_SUBTLE,
                                color: physicalSupported ? SUCCESS_COLOR : WARNING_COLOR,
                              }}
                            >
                              {physicalSupported ? 'Supported' : 'Missing physicals'}
                            </span>
                          </td>
                          <td className='px-2 py-1'>
                            <span
                              className='rounded px-1.5 py-0.5 text-[10px] font-semibold'
                              style={{
                                background: adjustment ? SUCCESS_BG_SUBTLE : WARNING_BG_SUBTLE,
                                color: adjustment ? SUCCESS_COLOR : WARNING_COLOR,
                              }}
                            >
                              {adjustmentStatus}
                            </span>
                          </td>
                          <td className='px-2 py-1'>
                            <div className='flex min-w-[170px] flex-col gap-1'>
                              <div className='flex items-center gap-1'>
                                <button
                                  type='button'
                                  aria-label={`Use comp ${comp.parcelId}`}
                                  className='rounded px-2 py-1 text-[10px] font-semibold'
                                  style={{
                                    background:
                                      decision === 'use'
                                        ? SUCCESS_BG
                                        : 'hsl(var(--tf-bg-surface) / 0.6)',
                                    color:
                                      decision === 'use'
                                        ? SUCCESS_COLOR
                                        : 'hsl(var(--tf-text) / 0.72)',
                                    border: '1px solid hsl(var(--tf-border) / 0.18)',
                                  }}
                                  onClick={(event) => handleDecision(event, 'use')}
                                >
                                  Use
                                </button>
                                <button
                                  type='button'
                                  aria-label={`Reject comp ${comp.parcelId}`}
                                  className='rounded px-2 py-1 text-[10px] font-semibold'
                                  style={{
                                    background:
                                      decision === 'reject'
                                        ? ERROR_BG
                                        : 'hsl(var(--tf-bg-surface) / 0.6)',
                                    color:
                                      decision === 'reject'
                                        ? ERROR_COLOR
                                        : 'hsl(var(--tf-text) / 0.72)',
                                    border: '1px solid hsl(var(--tf-border) / 0.18)',
                                  }}
                                  onClick={(event) => handleDecision(event, 'reject')}
                                >
                                  Reject
                                </button>
                                <button
                                  type='button'
                                  aria-label={`Needs data ${comp.parcelId}`}
                                  className='rounded px-2 py-1 text-[10px] font-semibold'
                                  style={{
                                    background:
                                      decision === 'needs-data'
                                        ? WARNING_BG
                                        : 'hsl(var(--tf-bg-surface) / 0.6)',
                                    color:
                                      decision === 'needs-data'
                                        ? WARNING_COLOR
                                        : 'hsl(var(--tf-text) / 0.72)',
                                    border: '1px solid hsl(var(--tf-border) / 0.18)',
                                  }}
                                  onClick={(event) => handleDecision(event, 'needs-data')}
                                >
                                  Needs Data
                                </button>
                              </div>
                              <div
                                className='text-[10px]'
                                style={{ color: 'hsl(var(--tf-text) / 0.48)' }}
                              >
                                {decisionLabel}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <aside
            className='rounded-lg p-4'
            style={{
              background: 'hsl(var(--tf-bg-elevated) / 0.52)',
              border: '1px solid hsl(var(--tf-border) / 0.16)',
            }}
          >
            <div className='text-sm font-semibold'>Defensibility Inspector</div>
            <p className='mt-1 text-xs' style={{ color: 'hsl(var(--tf-text) / 0.58)' }}>
              Reconciliation stays blocked until the selected set has enough support to defend.
            </p>

            {subjectEvidence && (
              <div
                className='mt-4 rounded p-3 text-xs'
                style={{
                  background: 'hsl(var(--tf-bg-surface) / 0.55)',
                  border: '1px solid hsl(var(--tf-border) / 0.12)',
                }}
              >
                <div className='font-semibold'>Sealed subject evidence</div>
                <div className='mt-1' style={{ color: 'hsl(var(--tf-text) / 0.54)' }}>
                  {subjectEvidence.source}
                </div>
                <div className='mt-3 flex flex-wrap gap-1.5'>
                  {([
                    ['Parcel', subjectEvidence.parcelReady],
                    ['Improvement', subjectEvidence.improvementReady],
                    ['Land', subjectEvidence.landReady],
                  ] as Array<[string, boolean]>).map(([label, ready]) => (
                    <span
                      key={String(label)}
                      className='rounded-full px-2 py-0.5 text-[10px] font-semibold'
                      style={{
                        background: ready ? SUCCESS_BG_SUBTLE : WARNING_BANNER_BG_SUBTLE,
                        color: ready ? SUCCESS_COLOR : WARNING_COLOR,
                        border: ready ? `1px solid ${SUCCESS_COLOR}33` : WARNING_BORDER,
                      }}
                    >
                      {label} {ready ? 'ready' : 'needs data'}
                    </span>
                  ))}
                </div>
                {subjectEvidence.missingPhysicals.length > 0 && (
                  <div className='mt-3' style={{ color: WARNING_COLOR }}>
                    Subject quality and condition are unavailable when sealed improvement evidence
                    is missing: {subjectEvidence.missingPhysicals.join(', ')}.
                  </div>
                )}
              </div>
            )}

            <div className='mt-4 grid grid-cols-2 gap-2 text-xs'>
              <div
                className='rounded p-2'
                style={{ background: 'hsl(var(--tf-bg-surface) / 0.55)' }}
              >
                <div style={{ color: 'hsl(var(--tf-text) / 0.48)' }}>Selected</div>
                <div className='text-lg font-semibold'>{selectedComps.length}</div>
                <div className='text-[10px]' style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                  Selected comps: {selectedComps.length} / {REQUIRED_COMP_COUNT} required
                </div>
              </div>
              <div
                className='rounded p-2'
                style={{ background: 'hsl(var(--tf-bg-surface) / 0.55)' }}
              >
                <div style={{ color: 'hsl(var(--tf-text) / 0.48)' }}>Defensible</div>
                <div className='text-lg font-semibold'>{defensibleSelectedCount}</div>
                <div className='text-[10px]' style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                  Defensible comps: {defensibleSelectedCount}
                </div>
              </div>
              <div
                className='rounded p-2'
                style={{ background: 'hsl(var(--tf-bg-surface) / 0.55)' }}
              >
                <div style={{ color: 'hsl(var(--tf-text) / 0.48)' }}>Physical support</div>
                <div className='text-lg font-semibold'>
                  {physicallySupportedCount}/{selectedComps.length}
                </div>
                <div className='text-[10px]' style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                  Physical support: {formatSupportStatus(physicalSupportStatus)}
                </div>
              </div>
              <div
                className='rounded p-2'
                style={{ background: 'hsl(var(--tf-bg-surface) / 0.55)' }}
              >
                <div style={{ color: 'hsl(var(--tf-text) / 0.48)' }}>Adjusted</div>
                <div className='text-lg font-semibold'>
                  {adjustedCount}/{selectedComps.length}
                </div>
                <div className='text-[10px]' style={{ color: 'hsl(var(--tf-text) / 0.5)' }}>
                  Adjustment support: {formatSupportStatus(adjustmentSupportStatus)}
                </div>
              </div>
            </div>

            <div
              className='mt-4 rounded p-3 text-xs'
              style={{
                background: reconciliationReady ? SUCCESS_BG_SUBTLE : WARNING_BANNER_BG_SUBTLE,
                color: reconciliationReady ? SUCCESS_COLOR : WARNING_COLOR,
                border: reconciliationReady ? `1px solid ${SUCCESS_COLOR}33` : WARNING_BORDER,
              }}
            >
              <div className='font-semibold'>
                {reconciliationReady ? 'Ready for reconciliation review' : 'Reconciliation blocked'}
              </div>
              {!reconciliationReady && (
                <ul className='mt-2 space-y-1'>
                  {readinessBlockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              )}
              {reconciliationReady && (
                <div className='mt-1'>
                  Selected comps clear qualification, physical, adjustment, and tolerance checks.
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* Adjustment grid for selected comps */}
      {selectedComps.length > 0 && (
        <div className='px-4 py-3' style={{ borderTop: '1px solid hsl(var(--tf-border) / 0.15)' }}>
          <div
            className='text-xs font-semibold mb-2'
            style={{ color: 'hsl(var(--tf-text) / 0.9)' }}
          >
            Paired Adjustments ({selectedComps.length} selected)
          </div>

          {adjustError && (
            <div
              className='text-xs px-3 py-2 rounded mb-2'
              style={{
                background: WARNING_BANNER_BG,
                color: WARNING_COLOR,
                border: WARNING_BORDER,
              }}
            >
              {adjustError}
            </div>
          )}

          <div className='overflow-auto'>
            <table className='w-full text-xs'>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)' }}>
                  <th className='px-2 py-1 text-left'>Address</th>
                  <th className='px-2 py-1 text-right'>Sale Price</th>
                  <th className='px-2 py-1 text-right'>GLA Adj</th>
                  <th className='px-2 py-1 text-right'>Lot Adj</th>
                  <th className='px-2 py-1 text-right'>Age Adj</th>
                  <th className='px-2 py-1 text-right'>Cond Adj</th>
                  <th className='px-2 py-1 text-right'>Net Adj</th>
                  <th className='px-2 py-1 text-right font-semibold'>Adjusted</th>
                  <th className='px-2 py-1 text-right'>Gross%</th>
                </tr>
              </thead>
              <tbody>
                {selectedComps.map((comp) => {
                  const key = compKey(comp);
                  const adj = adjustments[key];
                  const loading = adjustLoading.has(key);

                  if (loading) {
                    return (
                      <tr
                        key={key}
                        style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.06)' }}
                      >
                        <td className='px-2 py-1 truncate max-w-[150px]'>{comp.address}</td>
                        <td
                          colSpan={8}
                          className='px-2 py-1 text-center'
                          style={{ color: 'hsl(var(--tf-text) / 0.4)' }}
                        >
                          Loading adjustments...
                        </td>
                      </tr>
                    );
                  }

                  if (!adj) {
                    return (
                      <tr
                        key={key}
                        style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.06)' }}
                      >
                        <td className='px-2 py-1 truncate max-w-[150px]'>{comp.address}</td>
                        <td className='px-2 py-1 text-right'>{fmtCurrency(comp.salePrice)}</td>
                        <td
                          colSpan={7}
                          className='px-2 py-1 text-center'
                          style={{ color: 'hsl(var(--tf-text) / 0.35)' }}
                        >
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
                    <tr
                      key={key}
                      style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.06)' }}
                    >
                      <td className='px-2 py-1 truncate max-w-[150px]'>{comp.address}</td>
                      <td className='px-2 py-1 text-right'>{fmtCurrency(adj.salePrice)}</td>
                      <td className='px-2 py-1 text-right'>{fmtAdj(adj.glaAdjustment)}</td>
                      <td className='px-2 py-1 text-right'>{fmtAdj(adj.lotAdjustment)}</td>
                      <td className='px-2 py-1 text-right'>{fmtAdj(adj.ageAdjustment)}</td>
                      <td className='px-2 py-1 text-right'>{fmtAdj(adj.conditionAdjustment)}</td>
                      <td className='px-2 py-1 text-right font-medium'>
                        {fmtAdj(adj.totalNetAdjustment)}
                      </td>
                      <td
                        className='px-2 py-1 text-right font-semibold'
                        style={{ color: 'hsl(var(--tf-accent))' }}
                      >
                        {fmtCurrency(adj.adjustedPrice)}
                      </td>
                      <td className='px-2 py-1 text-right'>{adj.grossAdjustmentPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* AI Rationale button */}
          <div className='mt-2 flex items-center gap-2'>
            <button
              onClick={handleRationale}
              disabled={
                rationaleLoading ||
                selectedComps.length === 0 ||
                !pilotCountyScope ||
                countyScopeMismatch
              }
              className='text-xs px-3 py-1 rounded transition-colors'
              style={{
                background: 'hsl(var(--tf-accent) / 0.1)',
                color: 'hsl(var(--tf-accent))',
                border: '1px solid hsl(var(--tf-accent) / 0.2)',
                opacity: rationaleLoading ? 0.5 : 1,
              }}
            >
              {rationaleLoading ? 'Generating...' : 'Governed Comp Rationale'}
            </button>
          </div>

          {rationale && (
            <div
              className='mt-2 text-xs p-3 rounded whitespace-pre-wrap'
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
          className='px-4 py-2 text-xs'
          style={{
            color: 'hsl(var(--tf-text) / 0.4)',
            borderTop: '1px solid hsl(var(--tf-border) / 0.1)',
          }}
        >
          Reconciling...
        </div>
      )}

      {reconError && (
        <div
          className='px-4 py-2 text-xs'
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

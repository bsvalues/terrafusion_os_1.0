/**
 * CompsForge Module - Sales Comparison Approach
 *
 * Uses the active parcel as subject context, TerraFusion-normalized county sales as the
 * candidate pool, and CostForge endpoints as the adjustment/reconciliation
 * authority. The module does not fabricate subject characteristics or comp
 * values when source data is unavailable.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  DollarSign,
  Home,
  Ruler,
  Search,
} from 'lucide-react';
import { usePropertyStore } from '@/stores/propertyStore';
import {
  adjustComp,
  findCompsForSubject,
  getComparableCountyName,
  loadCountyComps,
  reconcileComps,
  supportsGovernedComparableAdjustments,
  type AdjustmentResult,
  type ComparableSale,
  type ReconciliationResult,
  type ScoredComp,
  type SubjectProperty,
} from '@/services/comparableSalesService';

type SaleWindow = {
  start: string;
  end: string;
};

const INITIAL_SALE_WINDOW: SaleWindow = {
  start: '2016-01-01',
  end: '2026-12-31',
};

function compKey(comp: ScoredComp): string {
  return `${comp.parcelId}|${comp.saleDate}`;
}

function numberOrZero(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatOptionalNumber(value: number): string {
  return value > 0 ? value.toLocaleString() : 'Unavailable';
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toLocaleDateString();
}

function adjustmentSummary(adjustment: AdjustmentResult | undefined): string {
  if (!adjustment) return 'Waiting for governed adjustment';
  return `${formatCurrency(adjustment.adjustedPrice)} adjusted`;
}

function buildSubjectFromActiveParcel(
  activeParcel: ReturnType<typeof usePropertyStore.getState>['activeParcel'],
): SubjectProperty | null {
  if (!activeParcel) return null;

  return {
    parcelId: activeParcel.parcelId,
    address: activeParcel.address,
    grossLivingArea: numberOrZero(activeParcel.buildingSquareFeet),
    lotSizeSqft: numberOrZero(activeParcel.landAcreage) > 0
      ? Math.round(numberOrZero(activeParcel.landAcreage) * 43560)
      : 0,
    yearBuilt: numberOrZero(activeParcel.yearBuilt),
    bedrooms: numberOrZero(activeParcel.bedrooms),
    bathrooms: numberOrZero(activeParcel.bathrooms),
    condition: 'Average',
    qualityGrade: 'Unspecified',
    propertyType: activeParcel.propertyType,
    assessedValue: numberOrZero(activeParcel.totalAssessedValue),
  };
}

export default function CompsForgeModule() {
  const activeParcel = usePropertyStore((state) => state.activeParcel);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [qualifiedOnly, setQualifiedOnly] = useState(true);
  const [saleWindow, setSaleWindow] = useState<SaleWindow>(INITIAL_SALE_WINDOW);
  const [allSales, setAllSales] = useState<ComparableSale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Record<string, AdjustmentResult>>({});
  const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);

  const subject = useMemo(() => buildSubjectFromActiveParcel(activeParcel), [activeParcel]);
  const countyCode = activeParcel?.countyCode ?? null;
  const countyName = useMemo(() => getComparableCountyName(countyCode), [countyCode]);
  const adjustmentsSupported = useMemo(
    () => supportsGovernedComparableAdjustments(countyCode),
    [countyCode],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadSales() {
      if (!countyCode) {
        setAllSales([]);
        setSalesError('Active parcel is missing a county code, so CompsForge cannot load the county sales shard.');
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
              : `CompsForge could not load the ${countyName} County sales shard.`,
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

  const candidates = useMemo(() => {
    if (!subject) return [];
    return findCompsForSubject(
      subject,
      allSales,
      {
        qualifiedOnly,
        saleDateRange: {
          start: saleWindow.start,
          end: saleWindow.end,
        },
      },
      30,
    );
  }, [allSales, qualifiedOnly, saleWindow.end, saleWindow.start, subject]);

  useEffect(() => {
    setAdjustments({});
    setReconciliation(null);
    setAdjustmentError(null);
    setSelectedKeys(() => new Set(candidates.slice(0, Math.min(3, candidates.length)).map(compKey)));
  }, [candidates]);

  const selectedComps = useMemo(
    () => candidates.filter((candidate) => selectedKeys.has(compKey(candidate))),
    [candidates, selectedKeys],
  );

  useEffect(() => {
    let cancelled = false;

    async function runGovernedAdjustment() {
      if (!subject || selectedComps.length === 0) {
        setAdjustments({});
        setReconciliation(null);
        return;
      }

      if (!adjustmentsSupported) {
        setAdjustments({});
        setReconciliation(null);
        setAdjustmentError(
          `${countyName} County comparable sales are available, but governed paired adjustments and reconciliation are currently certified only for Benton County.`,
        );
        return;
      }

      setIsAdjusting(true);
      setAdjustmentError(null);
      setReconciliation(null);

      try {
        const adjustedEntries = await Promise.all(
          selectedComps.map(async (comp) => {
            const result = await adjustComp(subject, comp);
            return [compKey(comp), result] as const;
          }),
        );

        if (cancelled) return;

        const nextAdjustments = Object.fromEntries(adjustedEntries) as Record<string, AdjustmentResult>;
        setAdjustments(nextAdjustments);

        if (adjustedEntries.length >= 2) {
          const reconciled = await reconcileComps(
            adjustedEntries.map(([, result]) => ({
              adjustedPrice: result.adjustedPrice,
              grossAdjustmentPct: result.grossAdjustmentPct,
            })),
          );
          if (!cancelled) setReconciliation(reconciled);
        }
      } catch (error) {
        if (!cancelled) {
          setAdjustments({});
          setReconciliation(null);
          setAdjustmentError(error instanceof Error ? error.message : 'CostForge adjustment failed');
        }
      } finally {
        if (!cancelled) setIsAdjusting(false);
      }
    }

    void runGovernedAdjustment();

    return () => {
      cancelled = true;
    };
  }, [adjustmentsSupported, countyName, selectedComps, subject]);

  const toggleSelect = useCallback((comp: ScoredComp) => {
    const key = compKey(comp);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const subjectCanScore = Boolean(
    subject &&
    subject.grossLivingArea > 0 &&
    subject.yearBuilt > 0 &&
    subject.assessedValue > 0,
  );

  return (
    <div className='p-6 space-y-6'>
      <div>
        <h2
          className='text-2xl font-semibold flex items-center gap-3'
          style={{ color: 'hsl(var(--tf-fg))' }}
        >
          <BarChart3 style={{ color: 'hsl(var(--tf-suite-forge))' }} size={28} />
          CompsForge - Sales Comparison
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Active-parcel comp selection using TerraFusion-normalized {countyName} County sales and CostForge governed adjustments.
        </p>
      </div>

      {!subject && (
        <Card
          style={{
            background: 'hsl(var(--tf-card-bg))',
            borderColor: 'hsl(var(--tf-warning) / 0.4)',
          }}
        >
          <CardContent className='pt-6 flex items-start gap-3'>
            <AlertTriangle size={22} style={{ color: 'hsl(var(--tf-warning))' }} />
            <div>
              <p className='font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                Select a parcel before running sales comparison.
              </p>
              <p className='text-sm mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                CompsForge requires an active subject parcel so scoring, evidence, and any Pilot action remain parcel-bound.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {subject && salesError && (
        <Card
          style={{
            background: 'hsl(var(--tf-card-bg))',
            borderColor: 'hsl(var(--tf-warning) / 0.35)',
          }}
        >
          <CardContent className='pt-5 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
            {salesError}
          </CardContent>
        </Card>
      )}

      {subject && !subjectCanScore && (
        <Card
          style={{
            background: 'hsl(var(--tf-card-bg))',
            borderColor: 'hsl(var(--tf-warning) / 0.35)',
          }}
        >
          <CardContent className='pt-5 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
            Subject data is incomplete. Candidate sales can still be reviewed, but scoring quality is limited until GLA,
            year built, and assessed value are present in the parcel provider.
          </CardContent>
        </Card>
      )}

      {subject && !adjustmentsSupported && (
        <Card
          style={{
            background: 'hsl(var(--tf-card-bg))',
            borderColor: 'hsl(var(--tf-warning) / 0.35)',
          }}
        >
          <CardContent className='pt-5 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
            {countyName} County sales are loaded from the statewide launch bundle, but governed paired adjustments and reconciliation are still Benton-certified only.
          </CardContent>
        </Card>
      )}

      <div className='flex items-center gap-4 flex-wrap'>
        <label className='flex items-center gap-2 text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
          <input
            type='checkbox'
            checked={qualifiedOnly}
            onChange={(event) => setQualifiedOnly(event.target.checked)}
          />
          Qualified sales only
        </label>

        <div className='flex items-center gap-2'>
          <Label className='text-sm shrink-0' style={{ color: 'hsl(var(--tf-muted))' }}>Sale from</Label>
          <Input
            type='date'
            value={saleWindow.start}
            onChange={(event) => setSaleWindow((prev) => ({ ...prev, start: event.target.value }))}
            className='w-[150px]'
            style={{
              background: 'hsl(var(--tf-bg))',
              borderColor: 'hsl(var(--tf-border))',
              color: 'hsl(var(--tf-fg))',
            }}
          />
        </div>

        <div className='flex items-center gap-2'>
          <Label className='text-sm shrink-0' style={{ color: 'hsl(var(--tf-muted))' }}>through</Label>
          <Input
            type='date'
            value={saleWindow.end}
            onChange={(event) => setSaleWindow((prev) => ({ ...prev, end: event.target.value }))}
            className='w-[150px]'
            style={{
              background: 'hsl(var(--tf-bg))',
              borderColor: 'hsl(var(--tf-border))',
              color: 'hsl(var(--tf-fg))',
            }}
          />
        </div>

        <Badge variant='outline' style={{ color: 'hsl(var(--tf-fg))' }}>
          {selectedKeys.size} selected / {candidates.length} candidates
        </Badge>

        <Button
          type='button'
          variant='outline'
          onClick={() => setSelectedKeys(new Set(candidates.slice(0, Math.min(3, candidates.length)).map(compKey)))}
          disabled={!subject || candidates.length === 0}
        >
          Use top 3
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2 space-y-3'>
          {candidates.length === 0 && (
            <Card
              style={{
                background: 'hsl(var(--tf-card-bg))',
                borderColor: 'hsl(var(--tf-border))',
              }}
            >
              <CardContent className='text-center py-10'>
                <Search size={32} className='mx-auto mb-3' style={{ color: 'hsl(var(--tf-muted) / 0.4)' }} />
                <p style={{ color: 'hsl(var(--tf-muted))' }}>
                  {salesLoading
                    ? `Loading ${countyName} County sales…`
                    : salesError
                      ? 'Comparable sales are unavailable until the county sales shard is restored.'
                      : 'No comparable sales match the current parcel and filters.'}
                </p>
              </CardContent>
            </Card>
          )}

          {candidates.map((comp) => {
            const key = compKey(comp);
            const isSelected = selectedKeys.has(key);
            const adjustment = adjustments[key];

            return (
              <Card
                key={key}
                className='cursor-pointer transition-all duration-200'
                onClick={() => toggleSelect(comp)}
                style={{
                  background: 'hsl(var(--tf-card-bg))',
                  borderColor: isSelected ? 'hsl(var(--tf-suite-forge))' : 'hsl(var(--tf-border))',
                  borderWidth: isSelected ? '2px' : '1px',
                }}
              >
                <CardContent className='pt-4'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2'>
                        {isSelected && (
                          <CheckCircle2 size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                        )}
                        <span className='font-medium truncate' style={{ color: 'hsl(var(--tf-fg))' }}>
                          {comp.address || 'Address unavailable'}
                        </span>
                      </div>
                      <p className='text-xs mt-0.5' style={{ color: 'hsl(var(--tf-muted))' }}>
                        Parcel: {comp.parcelId}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {formatCurrency(comp.salePrice)}
                      </p>
                      <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {comp.pricePerSqft ? `${formatCurrency(comp.pricePerSqft)}/sqft` : 'Price/sqft unavailable'}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-4 mt-3 text-xs flex-wrap' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <span className='flex items-center gap-1'>
                      <Calendar size={12} />
                      {formatDate(comp.saleDate)}
                    </span>
                    <span className='flex items-center gap-1'>
                      <Ruler size={12} />
                      {formatOptionalNumber(numberOrZero(comp.grossLivingArea))} sqft
                    </span>
                    <span className='flex items-center gap-1'>
                      <Home size={12} />
                      {formatOptionalNumber(numberOrZero(comp.yearBuilt))}
                    </span>
                    <span>
                      Similarity: {Math.round(comp.similarityScore * 100)}%
                    </span>
                    <span>
                      Qualification: {comp.saleQualification || 'Unspecified'}
                    </span>
                  </div>

                  {isSelected && (
                    <div className='mt-3 pt-3 text-sm' style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                      <div className='flex justify-between'>
                        <span style={{ color: 'hsl(var(--tf-muted))' }}>CostForge adjustment</span>
                        <span className='font-medium' style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                          {adjustmentSummary(adjustment)}
                        </span>
                      </div>
                      {adjustment && (
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs'>
                          <span style={{ color: 'hsl(var(--tf-muted))' }}>
                            Net: {formatCurrency(adjustment.totalNetAdjustment)}
                          </span>
                          <span style={{ color: 'hsl(var(--tf-muted))' }}>
                            Gross adj: {Math.round(adjustment.grossAdjustmentPct)}%
                          </span>
                          <span style={{ color: 'hsl(var(--tf-muted))' }}>
                            Source: {adjustment.source}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className='space-y-4'>
          <Card
            style={{
              background: 'hsl(var(--tf-card-bg))',
              borderColor: 'hsl(var(--tf-suite-forge) / 0.3)',
            }}
          >
            <CardHeader>
              <CardTitle
                className='text-lg flex items-center gap-2'
                style={{ color: 'hsl(var(--tf-fg))' }}
              >
                <DollarSign size={20} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                Reconciliation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reconciliation ? (
                <div className='space-y-4'>
                  <div className='text-center space-y-1'>
                    <p className='text-xs uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>
                      Governed Indication
                    </p>
                    <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {formatCurrency(reconciliation.weightedAverage)}
                    </p>
                    <Badge className='bg-green-500/20 text-green-400 border-green-500/30' variant='outline'>
                      {reconciliation.confidence} confidence
                    </Badge>
                  </div>

                  <Separator style={{ background: 'hsl(var(--tf-border))' }} />

                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Median</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(reconciliation.median)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Low</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(reconciliation.low)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>High</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(reconciliation.high)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Source</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{reconciliation.source}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Search size={32} className='mx-auto mb-3' style={{ color: 'hsl(var(--tf-muted) / 0.4)' }} />
                  <p style={{ color: 'hsl(var(--tf-muted))' }}>
                    {isAdjusting
                      ? 'CostForge is adjusting selected sales.'
                      : selectedComps.length < 2
                        ? 'Select at least two sales for reconciliation.'
                        : 'Reconciliation waits for governed CostForge adjustment output.'}
                  </p>
                  {adjustmentError && (
                    <p className='text-xs mt-3' style={{ color: 'hsl(var(--tf-warning))' }}>
                      {adjustmentError}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            style={{
              background: 'hsl(var(--tf-card-bg))',
              borderColor: 'hsl(var(--tf-border))',
            }}
          >
            <CardHeader className='pb-2'>
              <CardTitle
                className='text-sm flex items-center gap-2'
                style={{ color: 'hsl(var(--tf-fg))' }}
              >
                <Home size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                Subject Property
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-1 text-sm'>
              <div className='flex justify-between gap-4'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Parcel</span>
                <span className='text-right' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {subject?.parcelId ?? 'Required'}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>County</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>
                  {countyCode ? `${countyName} (${countyCode})` : 'Unavailable'}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Neighborhood code</span>
                <span className='text-right' style={{ color: 'hsl(var(--tf-fg))' }}>
                  {activeParcel?.neighborhood ?? 'Unavailable from current provider'}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>GLA</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>
                  {subject ? formatOptionalNumber(subject.grossLivingArea) : 'Required'} sqft
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Year Built</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>
                  {subject ? formatOptionalNumber(subject.yearBuilt) : 'Required'}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Assessed</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>
                  {subject && subject.assessedValue > 0 ? formatCurrency(subject.assessedValue) : 'Unavailable'}
                </span>
              </div>
              <div className='flex justify-between gap-4'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Lot</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>
                  {subject ? formatOptionalNumber(subject.lotSizeSqft) : 'Required'} sqft
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

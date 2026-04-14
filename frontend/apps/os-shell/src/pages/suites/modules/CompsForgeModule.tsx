/**
 * CompsForge Module — Sales Comparison Approach
 * ===================================================================
 * Constitutional module of TerraForge (Article V Section 5.1).
 *
 * Wired to GET /api/terraforge/comps-pool — real PACS comparable sales,
 * effective qualified pool (QualificationDecision="qualified" OR
 * QualificationRecommendation="qualified").
 *
 * Adjustment engine uses paired-sales methodology with PACS physical
 * characteristics: GLA, lot size, age, quality grade, condition.
 */

import { useCallback, useMemo, useReducer, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  Calendar,
  Ruler,
  Home,
  CheckCircle2,
  DollarSign,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { apiFetch } from '@/lib/apiBase';
import { usePropertyStore } from '@/stores/propertyStore';

// ============================================================================
// Types
// ============================================================================

interface ComparableSaleFromApi {
  saleId:             string;
  parcelId:           string;
  address:            string | null;
  hood:               string | null;
  propertyType:       string | null;
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
  items:    ComparableSaleFromApi[];
}

interface AdjustmentItem {
  category: string;
  amount:   number;
  percent:  number;
}

interface SubjectCharacteristics {
  gla:         number;
  yearBuilt:   number;
  qualityGrade: string;
  condition:   string;
  lotSizeSqft: number;
}

// Filter state — separate draft (user typing) from committed (API params)
interface FilterDraft {
  hood:         string;
  propertyType: string;
  minGla:       string;
  maxGla:       string;
}

interface CommittedFilters {
  hood:         string | null;
  propertyType: string | null;
  minGla:       number | null;
  maxGla:       number | null;
}

type SortKey = 'date' | 'price' | 'size' | 'ratio';

const TAX_YEAR = 2026;
const PAGE_SIZE = 12;

const DEFAULT_SUBJECT: SubjectCharacteristics = {
  gla:          2000,
  yearBuilt:    2005,
  qualityGrade: 'Average',
  condition:    'Good',
  lotSizeSqft:  7000,
};

// ============================================================================
// Adjustment Engine
// ============================================================================

// Quality grade ladder — maps PACS qualityGrade strings to ordinal scores
const QUALITY_SCORES: Record<string, number> = {
  'Economy': 1, 'Low': 1,
  'Fair': 2,
  'Average': 3, 'Avg': 3, 'Standard': 3,
  'Good': 4,
  'Very Good': 5, 'VeryGood': 5,
  'Excellent': 6, 'Superior': 6,
  'Luxury': 7,
};

// Condition ladder
const CONDITION_SCORES: Record<string, number> = {
  'Poor':      1,
  'Fair':      2,
  'Average':   3, 'Avg': 3,
  'Good':      4,
  'Excellent': 5, 'Superior': 5,
};

function getScore(map: Record<string, number>, key: string | null | undefined, fallback: number): number {
  if (!key) return fallback;
  return map[key] ?? map[Object.keys(map).find(k => k.toLowerCase() === key.toLowerCase()) ?? ''] ?? fallback;
}

function calculateAdjustments(comp: ComparableSaleFromApi, subject: SubjectCharacteristics): AdjustmentItem[] {
  const adjustments: AdjustmentItem[] = [];
  const sp = comp.salePrice;

  // ── Time adjustment: 0.3%/month back from Jan 2026 baseline
  const saleDate  = new Date(comp.saleDate);
  const baseline  = new Date('2026-01-01');
  const monthsDiff = (baseline.getTime() - saleDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
  if (Math.abs(monthsDiff) > 0.5) {
    const adj = monthsDiff * 0.003 * sp;
    adjustments.push({ category: 'Time', amount: adj, percent: monthsDiff * 0.3 });
  }

  // ── GLA adjustment: $75/sqft difference (subject vs comp)
  if (comp.gla != null && Math.abs(subject.gla - comp.gla) > 50) {
    const adj = (subject.gla - comp.gla) * 75;
    adjustments.push({ category: 'GLA', amount: adj, percent: (adj / sp) * 100 });
  }

  // ── Age adjustment: $1,500/year (newer comp → negative adj for subject)
  if (comp.yearBuilt != null && Math.abs(comp.yearBuilt - subject.yearBuilt) > 1) {
    const adj = -(comp.yearBuilt - subject.yearBuilt) * 1500;
    adjustments.push({ category: 'Age', amount: adj, percent: (adj / sp) * 100 });
  }

  // ── Quality grade adjustment: $12,000/grade step
  const subjectQScore = getScore(QUALITY_SCORES, subject.qualityGrade, 3);
  const compQScore    = getScore(QUALITY_SCORES, comp.qualityGrade,    3);
  if (subjectQScore !== compQScore) {
    const adj = (subjectQScore - compQScore) * 12000;
    adjustments.push({ category: 'Quality', amount: adj, percent: (adj / sp) * 100 });
  }

  // ── Condition adjustment: $8,000/condition step
  const subjectCScore = getScore(CONDITION_SCORES, subject.condition, 3);
  const compCScore    = getScore(CONDITION_SCORES, comp.condition,    3);
  if (subjectCScore !== compCScore) {
    const adj = (subjectCScore - compCScore) * 8000;
    adjustments.push({ category: 'Condition', amount: adj, percent: (adj / sp) * 100 });
  }

  // ── Lot size adjustment: $3/sqft difference
  if (comp.lotSizeSqft != null && Math.abs(subject.lotSizeSqft - comp.lotSizeSqft) > 200) {
    const adj = (subject.lotSizeSqft - comp.lotSizeSqft) * 3;
    adjustments.push({ category: 'Lot', amount: adj, percent: (adj / sp) * 100 });
  }

  return adjustments;
}

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
}

function buildUrl(taxYear: number, filters: CommittedFilters, page: number): string {
  const p = new URLSearchParams({
    taxYear:  String(taxYear),
    page:     String(page),
    pageSize: String(PAGE_SIZE),
  });
  if (filters.hood)         p.set('hood',         filters.hood);
  if (filters.propertyType) p.set('propertyType', filters.propertyType);
  if (filters.minGla)       p.set('minGla',       String(filters.minGla));
  if (filters.maxGla)       p.set('maxGla',       String(filters.maxGla));
  return `/api/terraforge/comps-pool?${p.toString()}`;
}

async function fetchCompsPool(url: string): Promise<CompsPoolPage> {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<CompsPoolPage>;
}

// ============================================================================
// Component
// ============================================================================

export default function CompsForgeModule() {
  const activeParcel = usePropertyStore((s) => s.activeParcel);

  // Subject property — prefer active parcel characteristics, fallback to defaults
  const subject = useMemo<SubjectCharacteristics>(() => {
    if (!activeParcel) return DEFAULT_SUBJECT;
    return {
      gla:          activeParcel.buildingSquareFeet ?? DEFAULT_SUBJECT.gla,
      yearBuilt:    activeParcel.yearBuilt          ?? DEFAULT_SUBJECT.yearBuilt,
      qualityGrade: DEFAULT_SUBJECT.qualityGrade,   // not in Property type — keep default
      condition:    DEFAULT_SUBJECT.condition,
      lotSizeSqft:  activeParcel.landAcreage
                      ? activeParcel.landAcreage * 43560
                      : DEFAULT_SUBJECT.lotSizeSqft,
    };
  }, [activeParcel]);

  // Filters
  const [draft, setDraft] = useState<FilterDraft>({ hood: '', propertyType: '', minGla: '', maxGla: '' });
  const [committed, setCommitted] = useState<CommittedFilters>({ hood: null, propertyType: null, minGla: null, maxGla: null });
  const [page, setPage] = useState(1);

  const applyFilters = useCallback(() => {
    setCommitted({
      hood:         draft.hood         || null,
      propertyType: draft.propertyType || null,
      minGla:       draft.minGla       ? Number(draft.minGla) : null,
      maxGla:       draft.maxGla       ? Number(draft.maxGla) : null,
    });
    setPage(1);
  }, [draft]);

  const clearFilters = useCallback(() => {
    setDraft({ hood: '', propertyType: '', minGla: '', maxGla: '' });
    setCommitted({ hood: null, propertyType: null, minGla: null, maxGla: null });
    setPage(1);
  }, []);

  // Fetch
  const url = buildUrl(TAX_YEAR, committed, page);
  const { data, isLoading, isError, error } = useQuery<CompsPoolPage>({
    queryKey: ['comps-pool', TAX_YEAR, committed, page],
    queryFn:  () => fetchCompsPool(url),
    staleTime: 60_000,
  });

  // Selection + sort (client-side on current page)
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [sortKey,     setSortKey]       = useState<SortKey>('date');

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const sortedItems = useMemo(() => {
    if (!data?.items) return [];
    return [...data.items].sort((a, b) => {
      switch (sortKey) {
        case 'date':  return new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime();
        case 'price': return a.salePrice - b.salePrice;
        case 'size':  return (a.gla ?? 0) - (b.gla ?? 0);
        case 'ratio': return (a.pacsComputedRatio ?? 0) - (b.pacsComputedRatio ?? 0);
        default:      return 0;
      }
    });
  }, [data?.items, sortKey]);

  const selectedComps = sortedItems.filter((c) => selectedIds.has(c.saleId));

  const reconciled = useMemo(() => {
    if (selectedComps.length === 0) return null;
    const adjustedValues = selectedComps.map((comp) => {
      const adjs     = calculateAdjustments(comp, subject);
      const totalAdj = adjs.reduce((s, a) => s + a.amount, 0);
      return comp.salePrice + totalAdj;
    });
    const sorted = [...adjustedValues].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const average = adjustedValues.reduce((s, v) => s + v, 0) / adjustedValues.length;
    return { median, average, low: sorted[0], high: sorted[sorted.length - 1], count: selectedComps.length };
  }, [selectedComps, subject]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div>
          <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
            <BarChart3 style={{ color: 'hsl(var(--tf-suite-forge))' }} size={28} />
            CompsForge — Sales Comparison
          </h2>
          <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
            Benton County qualified comps pool · {TAX_YEAR} ratio window
            {activeParcel && (
              <span style={{ marginLeft: 8, color: 'hsl(var(--tf-suite-forge))' }}>
                · Subject: {activeParcel.address}
              </span>
            )}
          </p>
        </div>
        {data && (
          <Badge variant='outline' style={{ color: 'hsl(var(--tf-fg))' }}>
            {data.total.toLocaleString()} qualified sales
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: 'hsl(var(--tf-card-bg))',
          border: '1px solid hsl(var(--tf-border))',
        }}
      >
        <div className='flex items-center gap-2 mb-3'>
          <SlidersHorizontal size={14} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
          <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>Filters</span>
          <span className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>(applied on Search)</span>
        </div>
        <div className='flex items-end gap-3 flex-wrap'>
          <div>
            <Label className='text-xs mb-1 block' style={{ color: 'hsl(var(--tf-muted))' }}>Neighborhood</Label>
            <Input
              placeholder='e.g. Meadow Springs'
              value={draft.hood}
              onChange={(e) => setDraft((d) => ({ ...d, hood: e.target.value }))}
              className='w-[180px] h-8 text-sm'
              style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
            />
          </div>
          <div>
            <Label className='text-xs mb-1 block' style={{ color: 'hsl(var(--tf-muted))' }}>Property Type</Label>
            <Input
              placeholder='e.g. R1'
              value={draft.propertyType}
              onChange={(e) => setDraft((d) => ({ ...d, propertyType: e.target.value }))}
              className='w-[120px] h-8 text-sm'
              style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
            />
          </div>
          <div>
            <Label className='text-xs mb-1 block' style={{ color: 'hsl(var(--tf-muted))' }}>Min GLA (sqft)</Label>
            <Input
              type='number'
              placeholder='1000'
              value={draft.minGla}
              onChange={(e) => setDraft((d) => ({ ...d, minGla: e.target.value }))}
              className='w-[110px] h-8 text-sm'
              style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
            />
          </div>
          <div>
            <Label className='text-xs mb-1 block' style={{ color: 'hsl(var(--tf-muted))' }}>Max GLA (sqft)</Label>
            <Input
              type='number'
              placeholder='4000'
              value={draft.maxGla}
              onChange={(e) => setDraft((d) => ({ ...d, maxGla: e.target.value }))}
              className='w-[110px] h-8 text-sm'
              style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}
            />
          </div>
          <Button size='sm' onClick={applyFilters} style={{ background: 'hsl(var(--tf-suite-forge))', color: '#000', height: 32 }}>
            Search
          </Button>
          {(committed.hood || committed.propertyType || committed.minGla || committed.maxGla) && (
            <Button size='sm' variant='ghost' onClick={clearFilters} style={{ height: 32, color: 'hsl(var(--tf-muted))' }}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Sort bar */}
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2'>
          <Label className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>Sort</Label>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className='w-[130px] h-8 text-sm' style={{ background: 'hsl(var(--tf-bg))', borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='date'>Sale date</SelectItem>
              <SelectItem value='price'>Sale price</SelectItem>
              <SelectItem value='size'>GLA</SelectItem>
              <SelectItem value='ratio'>PACS ratio</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedIds.size > 0 && (
          <Badge style={{ background: 'hsl(var(--tf-suite-forge) / 0.15)', color: 'hsl(var(--tf-suite-forge))' }}>
            {selectedIds.size} selected
          </Badge>
        )}
      </div>

      {/* Main grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>

        {/* Comp cards — left 2/3 */}
        <div className='lg:col-span-2 space-y-3'>

          {isLoading && (
            <div className='flex items-center justify-center py-16' style={{ color: 'hsl(var(--tf-muted))' }}>
              Loading comparable sales…
            </div>
          )}

          {isError && (
            <div className='py-8 text-center'>
              <p style={{ color: 'hsl(var(--tf-danger, 0 70% 60%))' }}>
                Failed to load comps pool: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
              <p className='text-sm mt-1' style={{ color: 'hsl(var(--tf-muted))' }}>
                Ensure the API is running at port 5000 with ASPNETCORE_ENVIRONMENT=Development
              </p>
            </div>
          )}

          {!isLoading && !isError && data?.items.length === 0 && (
            <div className='flex flex-col items-center justify-center py-16 gap-3'>
              <Search size={40} style={{ color: 'hsl(var(--tf-muted) / 0.4)' }} />
              <p style={{ color: 'hsl(var(--tf-muted))' }}>
                No qualified sales found for the {TAX_YEAR} ratio window.
              </p>
              <p className='text-sm' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>
                Try clearing filters or running sale qualification via the Sale Qualification Queue.
              </p>
            </div>
          )}

          {sortedItems.map((comp) => {
            const isSelected  = selectedIds.has(comp.saleId);
            const adjustments = calculateAdjustments(comp, subject);
            const totalAdj    = adjustments.reduce((s, a) => s + a.amount, 0);
            const adjPrice    = comp.salePrice + totalAdj;

            return (
              <Card
                key={comp.saleId}
                className='cursor-pointer transition-all duration-200'
                onClick={() => toggleSelect(comp.saleId)}
                style={{
                  background:   'hsl(var(--tf-card-bg))',
                  borderColor:  isSelected ? 'hsl(var(--tf-suite-forge))' : 'hsl(var(--tf-border))',
                  borderWidth:  isSelected ? 2 : 1,
                }}
              >
                <CardContent className='pt-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2'>
                        {isSelected && <CheckCircle2 size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />}
                        <span className='font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>
                          {comp.address ?? comp.parcelId}
                        </span>
                        {comp.qualificationSource === 'decision' && (
                          <span className='text-xs px-1.5 py-0.5 rounded' style={{ background: 'hsl(var(--tf-success, 140 70% 50%) / 0.15)', color: 'hsl(var(--tf-success, 140 70% 50%))' }}>
                            Appraiser-confirmed
                          </span>
                        )}
                      </div>
                      <p className='text-xs mt-0.5' style={{ color: 'hsl(var(--tf-muted))' }}>
                        {comp.parcelId}{comp.hood ? ` · ${comp.hood}` : ''}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold' style={{ color: 'hsl(var(--tf-fg))' }}>
                        {formatCurrency(comp.salePrice)}
                      </p>
                      {comp.gla && comp.gla > 0 && (
                        <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>
                          {formatCurrency(comp.salePrice / comp.gla)}/sqft
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='flex items-center gap-4 mt-3 text-xs flex-wrap' style={{ color: 'hsl(var(--tf-muted))' }}>
                    <span className='flex items-center gap-1'>
                      <Calendar size={12} />
                      {fmtDate(comp.saleDate)}
                    </span>
                    {comp.gla && (
                      <span className='flex items-center gap-1'>
                        <Ruler size={12} />
                        {comp.gla.toLocaleString()} sqft
                      </span>
                    )}
                    {comp.yearBuilt && (
                      <span className='flex items-center gap-1'>
                        <Home size={12} />
                        {comp.yearBuilt}
                        {comp.bedrooms != null ? ` · ${comp.bedrooms}bd` : ''}
                        {comp.bathrooms != null ? `/${comp.bathrooms}ba` : ''}
                      </span>
                    )}
                    {comp.qualityGrade && (
                      <span>Q: {comp.qualityGrade}</span>
                    )}
                    {comp.condition && (
                      <span>C: {comp.condition}</span>
                    )}
                    {comp.pacsComputedRatio != null && (
                      <span style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                        Ratio: {(comp.pacsComputedRatio / 100).toFixed(3)}
                      </span>
                    )}
                  </div>

                  {isSelected && adjustments.length > 0 && (
                    <div className='mt-3 pt-3' style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                        {adjustments.map((adj) => (
                          <div key={adj.category} className='text-xs'>
                            <span style={{ color: 'hsl(var(--tf-muted))' }}>{adj.category}</span>
                            <span
                              className='ml-1 font-medium'
                              style={{
                                color: adj.amount >= 0
                                  ? 'hsl(var(--tf-success, 140 70% 50%))'
                                  : 'hsl(var(--tf-danger, 0 70% 60%))',
                              }}
                            >
                              {adj.amount >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className='flex justify-between mt-2 pt-2 text-sm' style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                        <span style={{ color: 'hsl(var(--tf-muted))' }}>Adjusted Value</span>
                        <span className='font-semibold' style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                          {formatCurrency(adjPrice)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-3 pt-2'>
              <Button
                size='sm'
                variant='ghost'
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ color: 'hsl(var(--tf-muted))' }}
              >
                <ChevronLeft size={16} />
                Prev
              </Button>
              <span className='text-sm' style={{ color: 'hsl(var(--tf-muted))' }}>
                {page} / {totalPages}
                {data && <span style={{ marginLeft: 6, opacity: 0.6 }}>({data.total.toLocaleString()} total)</span>}
              </span>
              <Button
                size='sm'
                variant='ghost'
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ color: 'hsl(var(--tf-muted))' }}
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* Right column — reconciliation + subject summary */}
        <div className='space-y-4'>

          {/* Reconciliation panel */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-suite-forge) / 0.3)' }}>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <DollarSign size={20} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                Reconciliation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reconciled ? (
                <div className='space-y-4'>
                  <div className='text-center space-y-1'>
                    <p className='text-xs uppercase tracking-wider' style={{ color: 'hsl(var(--tf-muted))' }}>
                      Indicated Value (Median Adjusted)
                    </p>
                    <p className='text-3xl font-bold' style={{ color: 'hsl(var(--tf-fg))' }}>
                      {formatCurrency(reconciled.median)}
                    </p>
                    <Badge className='bg-green-500/20 text-green-400 border-green-500/30' variant='outline'>
                      {reconciled.count} comp{reconciled.count !== 1 ? 's' : ''} selected
                    </Badge>
                  </div>

                  <Separator style={{ background: 'hsl(var(--tf-border))' }} />

                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Average</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(reconciled.average)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Low</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(reconciled.low)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>High</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(reconciled.high)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span style={{ color: 'hsl(var(--tf-muted))' }}>Range</span>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>{formatCurrency(reconciled.high - reconciled.low)}</span>
                    </div>
                  </div>

                  <div
                    className='text-xs p-2 rounded'
                    style={{ background: 'hsl(var(--tf-suite-forge) / 0.08)', color: 'hsl(var(--tf-muted))' }}
                  >
                    Adjustments applied: Time trend, GLA, Age, Quality, Condition, Lot size
                  </div>
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Search size={32} className='mx-auto mb-3' style={{ color: 'hsl(var(--tf-muted) / 0.4)' }} />
                  <p style={{ color: 'hsl(var(--tf-muted))' }}>
                    Select comparable sales to reconcile a value
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject property summary */}
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm flex items-center gap-2' style={{ color: 'hsl(var(--tf-fg))' }}>
                <Home size={16} style={{ color: 'hsl(var(--tf-suite-forge))' }} />
                Subject Property
                {!activeParcel && (
                  <span className='text-xs font-normal' style={{ color: 'hsl(var(--tf-muted))' }}>(defaults)</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-1 text-sm'>
              {activeParcel && (
                <div className='mb-2 pb-2' style={{ borderBottom: '1px solid hsl(var(--tf-border))', color: 'hsl(var(--tf-suite-forge))' }}>
                  {activeParcel.address}
                </div>
              )}
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>GLA</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{subject.gla.toLocaleString()} sqft</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Year Built</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{subject.yearBuilt}</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Quality</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{subject.qualityGrade}</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Condition</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{subject.condition}</span>
              </div>
              <div className='flex justify-between'>
                <span style={{ color: 'hsl(var(--tf-muted))' }}>Lot</span>
                <span style={{ color: 'hsl(var(--tf-fg))' }}>{subject.lotSizeSqft.toLocaleString()} sqft</span>
              </div>
              {!activeParcel && (
                <p className='text-xs pt-2' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>
                  Open a parcel in Property Search to set subject characteristics.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

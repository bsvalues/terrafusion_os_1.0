/**
 * comparableSalesService.ts
 *
 * Adapter service: extracts and adapts comp-selection logic from legacy
 * QUARANTINE comparablesService.ts + similarityService.ts into the
 * active OS shell.
 *
 * Provenance:
 *   - Filter pipeline: QUARANTINE/.../comparison/comparablesService.ts
 *   - Similarity scoring: QUARANTINE/.../comparison/similarityService.ts
 *   - Adjustment math: CostForgeController POST /api/costforge/sales-comparison/adjust-comparable
 *   - Reconciliation: CostForgeController POST /api/costforge/sales-comparison/reconcile
 *   - Data: Washington statewide launch package (launch-data/washington/sales/by-county/*.json)
 *
 * GUARDRAIL: All adjustment/reconciliation math stays in backend CostForge
 * endpoints. Frontend only does filtering, sorting, and similarity scoring
 * for candidate selection.
 */

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/** Shape of a comparable sale record from TerraFusion-normalized county sales */
export interface ComparableSale {
  parcelId: string;
  saleDate: string;
  salePrice: number;
  propertyType: string;
  address: string;
  countyCode?: string | null;
  countyName?: string | null;
  city?: string | null;
  neighborhoodCode?: string | null;
  currentNeighborhoodCode?: string | null;
  grossLivingArea: number | null;
  lotSizeSqft: number | null;
  yearBuilt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  condition: string | null;
  qualityGrade: string | null;
  saleQualification: string | null;
}

/** Subject property shape (normalized from propertyStore) */
export interface SubjectProperty {
  parcelId: string;
  address: string;
  grossLivingArea: number;
  lotSizeSqft: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  condition: string | null;
  qualityGrade: string | null;
  propertyType: string;
  assessedValue: number;
}

/** A comparable sale scored for similarity to the subject */
export interface ScoredComp extends ComparableSale {
  similarityScore: number;
  pricePerSqft: number | null;
}

/** Filters for narrowing comp candidates */
export interface CompFilter {
  propertyType?: string;
  glaRange?: { min: number; max: number };
  yearBuiltRange?: { min: number; max: number };
  lotSizeRange?: { min: number; max: number };
  saleDateRange?: { start: string; end: string };
  qualifiedOnly?: boolean;
}

/** Result from CostForge adjust-comparable endpoint */
export interface AdjustmentResult {
  salePrice: number;
  glaAdjustment: number;
  lotAdjustment: number;
  ageAdjustment: number;
  bedroomAdjustment: number;
  bathroomAdjustment: number;
  conditionAdjustment: number;
  locationAdjustment: number;
  totalNetAdjustment: number;
  adjustedPrice: number;
  grossAdjustmentPct: number;
  source: string;
}

/** Result from CostForge reconcile endpoint */
export interface ReconciliationResult {
  comparableCount: number;
  weightedAverage: number;
  median: number;
  mean: number;
  low: number;
  high: number;
  range: number;
  coefficientOfVariation: number;
  averageGrossAdjustmentPct: number;
  confidence: string;
  comparableWeights: Array<{ adjustedPrice: number; weight: number }>;
  source: string;
}

// ═══════════════════════════════════════════════════════════════
// Data Loading
// ═══════════════════════════════════════════════════════════════

interface LaunchSaleRecord {
  countyCode: string;
  parcelNumber: string | null;
  saleDate: string | null;
  salePrice: number | null;
  adjustedSalePrice: number | null;
  useCode: string | null;
  situsAddress: string | null;
  situsCity: string | null;
  situsZip: string | null;
  acres: number | string | null;
  neighborhoodCode: string | null;
  currentNeighborhoodCode: string | null;
  reviewStatus: string | null;
  grossLivingArea?: number | string | null;
  buildingSquareFeet?: number | string | null;
  gla?: number | string | null;
  lotSizeSqft?: number | string | null;
  yearBuilt?: number | string | null;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  condition?: string | null;
  propertyCondition?: string | null;
  qualityGrade?: string | null;
  quality?: string | null;
  flags: {
    needsReview: boolean;
  };
}

interface LaunchCountySalesShard {
  county: string;
  countyCode: string;
  records: LaunchSaleRecord[];
}

const WASHINGTON_COUNTIES = [
  { code: '001', name: 'Adams' },
  { code: '003', name: 'Asotin' },
  { code: '005', name: 'Benton' },
  { code: '007', name: 'Chelan' },
  { code: '009', name: 'Clallam' },
  { code: '011', name: 'Clark' },
  { code: '013', name: 'Columbia' },
  { code: '015', name: 'Cowlitz' },
  { code: '017', name: 'Douglas' },
  { code: '019', name: 'Ferry' },
  { code: '021', name: 'Franklin' },
  { code: '023', name: 'Garfield' },
  { code: '025', name: 'Grant' },
  { code: '027', name: 'Grays Harbor' },
  { code: '029', name: 'Island' },
  { code: '031', name: 'Jefferson' },
  { code: '033', name: 'King' },
  { code: '035', name: 'Kitsap' },
  { code: '037', name: 'Kittitas' },
  { code: '039', name: 'Klickitat' },
  { code: '041', name: 'Lewis' },
  { code: '043', name: 'Lincoln' },
  { code: '045', name: 'Mason' },
  { code: '047', name: 'Okanogan' },
  { code: '049', name: 'Pacific' },
  { code: '051', name: 'Pend Oreille' },
  { code: '053', name: 'Pierce' },
  { code: '055', name: 'San Juan' },
  { code: '057', name: 'Skagit' },
  { code: '059', name: 'Skamania' },
  { code: '061', name: 'Snohomish' },
  { code: '063', name: 'Spokane' },
  { code: '065', name: 'Stevens' },
  { code: '067', name: 'Thurston' },
  { code: '069', name: 'Wahkiakum' },
  { code: '071', name: 'Walla Walla' },
  { code: '073', name: 'Whatcom' },
  { code: '075', name: 'Whitman' },
  { code: '077', name: 'Yakima' },
] as const;

const COUNTY_SHARD_BASE = '/launch-data/washington/sales/by-county';
const countyShardCache = new Map<string, Promise<ComparableSale[]>>();

function normalizeCountyCode(raw: string | null | undefined): string {
  const value = String(raw ?? '').trim();
  if (/^\d{1,3}$/.test(value)) return value.padStart(3, '0');
  const byName = WASHINGTON_COUNTIES.find(
    (county) => county.name.toLowerCase() === value.toLowerCase(),
  );
  return byName?.code ?? '005';
}

function normalizeCountyScopeToken(raw: string | null | undefined): string | null {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/^county-/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return value.length > 0 ? value : null;
}

export function getComparableCountyCode(raw: string | null | undefined): string {
  return normalizeCountyCode(raw);
}

export function getComparableCountyName(raw: string | null | undefined): string {
  const code = normalizeCountyCode(raw);
  return WASHINGTON_COUNTIES.find((county) => county.code === code)?.name ?? 'Washington';
}

export function getComparableCountyScopeToken(raw: string | null | undefined): string {
  return normalizeCountyScopeToken(getComparableCountyName(raw)) ?? 'washington';
}

export function getPilotCountyScopeToken(raw: string | null | undefined): string | null {
  return normalizeCountyScopeToken(raw);
}

export function doesPilotCountyMatchComparableCounty(
  pilotCounty: string | null | undefined,
  countyCode: string | null | undefined,
): boolean {
  const pilotToken = getPilotCountyScopeToken(pilotCounty);
  if (!pilotToken) return false;
  return pilotToken === getComparableCountyScopeToken(countyCode);
}

export function supportsGovernedComparableAdjustments(
  countyCode: string | null | undefined,
): boolean {
  return normalizeCountyCode(countyCode) === '005';
}

function addressForSale(record: LaunchSaleRecord): string {
  const joined = [record.situsAddress, record.situsCity, record.situsZip]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(', ')
    .replace(/\s+/g, ' ')
    .trim();
  return joined || 'Address unavailable';
}

function numberOrNull(value: number | string | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function firstNumberOrNull(values: Array<number | string | null | undefined>): number | null {
  for (const value of values) {
    const parsed = numberOrNull(value);
    if (parsed != null) return parsed;
  }
  return null;
}

function firstStringOrNull(values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return null;
}

function toComparableSale(record: LaunchSaleRecord): ComparableSale {
  const acres = numberOrNull(record.acres);
  return {
    parcelId: record.parcelNumber ?? '',
    saleDate: record.saleDate ?? '',
    salePrice: record.adjustedSalePrice ?? record.salePrice ?? 0,
    propertyType: record.useCode ?? 'unknown',
    address: addressForSale(record),
    countyCode: record.countyCode,
    countyName: WASHINGTON_COUNTIES.find((county) => county.code === record.countyCode)?.name ?? null,
    city: record.situsCity,
    neighborhoodCode: record.neighborhoodCode,
    currentNeighborhoodCode: record.currentNeighborhoodCode,
    grossLivingArea: firstNumberOrNull([
      record.grossLivingArea,
      record.buildingSquareFeet,
      record.gla,
    ]),
    lotSizeSqft:
      firstNumberOrNull([record.lotSizeSqft]) ??
      (acres != null && acres > 0 ? Math.round(acres * 43560) : null),
    yearBuilt: firstNumberOrNull([record.yearBuilt]),
    bedrooms: firstNumberOrNull([record.bedrooms]),
    bathrooms: firstNumberOrNull([record.bathrooms]),
    condition: firstStringOrNull([record.condition, record.propertyCondition]),
    qualityGrade: firstStringOrNull([record.qualityGrade, record.quality]),
    saleQualification: record.flags.needsReview ? 'review_required' : record.reviewStatus,
  };
}

export function clearComparableSalesCacheForTests(): void {
  if (import.meta.env.MODE !== 'test') return;
  countyShardCache.clear();
}

export async function loadCountyComps(countyCode: string): Promise<ComparableSale[]> {
  const normalizedCountyCode = normalizeCountyCode(countyCode);
  const cached = countyShardCache.get(normalizedCountyCode);
  if (cached) return cached;

  const promise = fetch(`${COUNTY_SHARD_BASE}/${normalizedCountyCode}.json`, { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`County comp shard unavailable for ${normalizedCountyCode} (${response.status})`);
      }
      return response.json() as Promise<LaunchCountySalesShard>;
    })
    .then((shard) =>
      shard.records
        .filter(
          (record) =>
            typeof record.parcelNumber === 'string' &&
            record.parcelNumber.trim().length > 0 &&
            typeof record.saleDate === 'string' &&
            record.saleDate.trim().length > 0 &&
            typeof (record.adjustedSalePrice ?? record.salePrice) === 'number' &&
            (record.adjustedSalePrice ?? record.salePrice ?? 0) > 0,
        )
        .map(toComparableSale),
    );

  countyShardCache.set(normalizedCountyCode, promise);
  return promise;
}

// ═══════════════════════════════════════════════════════════════
// Filtering — adapted from QUARANTINE comparablesService.ts
// ═══════════════════════════════════════════════════════════════

/**
/** Apply filter pipeline to narrow comp candidates */
export function filterComps(
  subject: SubjectProperty,
  allSales: ComparableSale[],
  filters: CompFilter = {},
): ComparableSale[] {
  return allSales.filter((sale) => {
    // Exclude the subject parcel itself
    if (sale.parcelId === subject.parcelId) return false;

    // Property type filter
    if (filters.propertyType && sale.propertyType !== filters.propertyType) {
      return false;
    }

    // GLA range filter (default ±30% of subject)
    if (sale.grossLivingArea != null && subject.grossLivingArea > 0) {
      const range = filters.glaRange ?? {
        min: subject.grossLivingArea * 0.7,
        max: subject.grossLivingArea * 1.3,
      };
      if (sale.grossLivingArea < range.min || sale.grossLivingArea > range.max) {
        return false;
      }
    }

    // Year built range filter (default ±20 years of subject)
    if (sale.yearBuilt != null && subject.yearBuilt > 0) {
      const range = filters.yearBuiltRange ?? {
        min: subject.yearBuilt - 20,
        max: subject.yearBuilt + 20,
      };
      if (sale.yearBuilt < range.min || sale.yearBuilt > range.max) {
        return false;
      }
    }

    // Lot size range filter (default ±50% of subject)
    if (
      sale.lotSizeSqft != null &&
      subject.lotSizeSqft > 0 &&
      filters.lotSizeRange
    ) {
      if (
        sale.lotSizeSqft < filters.lotSizeRange.min ||
        sale.lotSizeSqft > filters.lotSizeRange.max
      ) {
        return false;
      }
    }

    // Sale date range filter
    if (filters.saleDateRange) {
      const saleDate = sale.saleDate.slice(0, 10); // YYYY-MM-DD
      if (saleDate < filters.saleDateRange.start || saleDate > filters.saleDateRange.end) {
        return false;
      }
    }

    // Qualified sales only (default: true)
    if (filters.qualifiedOnly !== false) {
      if (sale.saleQualification && sale.saleQualification !== 'qualified') {
        return false;
      }
    }

    return true;
  });
}

// ═══════════════════════════════════════════════════════════════
// Similarity Scoring — adapted from QUARANTINE similarityService.ts
//
// Weight model (legacy provenance):
//   propertyType: 0.15  (exact match)
//   squareFeet:   0.20  (normalized %)
//   yearBuilt:    0.15  (max 50yr diff)
//   bedrooms:     0.10  (exact/±1/±2)
//   bathrooms:    0.10  (exact/±0.5/±1)
//   lotSize:      0.10  (normalized %)
//   neighborhood: 0.20  (parcelId prefix match — simplified)
// ═══════════════════════════════════════════════════════════════

const WEIGHTS = {
  propertyType: 0.15,
  squareFeet: 0.20,
  yearBuilt: 0.15,
  bedrooms: 0.10,
  bathrooms: 0.10,
  lotSize: 0.10,
  neighborhood: 0.20,
} as const;

/** Score similarity between subject and a comp sale (0–1) */
export function scoreSimilarity(
  subject: SubjectProperty,
  comp: ComparableSale,
): number {
  let totalScore = 0;
  let totalWeight = 0;

  // Property type (exact match)
  if (subject.propertyType && comp.propertyType) {
    totalWeight += WEIGHTS.propertyType;
    if (subject.propertyType === comp.propertyType) {
      totalScore += WEIGHTS.propertyType;
    }
  }

  // Neighborhood (parcelId prefix match — first 9 chars as proxy)
  if (subject.parcelId && comp.parcelId) {
    totalWeight += WEIGHTS.neighborhood;
    const subjectPrefix = subject.parcelId.slice(0, 9);
    const compPrefix = comp.parcelId.slice(0, 9);
    if (subjectPrefix === compPrefix) {
      totalScore += WEIGHTS.neighborhood;
    } else if (subject.parcelId.slice(0, 6) === comp.parcelId.slice(0, 6)) {
      totalScore += WEIGHTS.neighborhood * 0.5;
    }
  }

  // Square feet (normalized %)
  if (subject.grossLivingArea > 0 && comp.grossLivingArea != null && comp.grossLivingArea > 0) {
    totalWeight += WEIGHTS.squareFeet;
    const pctDiff = Math.abs(subject.grossLivingArea - comp.grossLivingArea) / subject.grossLivingArea;
    totalScore += Math.max(0, 1 - pctDiff) * WEIGHTS.squareFeet;
  }

  // Year built (max 50yr diff)
  if (subject.yearBuilt > 0 && comp.yearBuilt != null && comp.yearBuilt > 0) {
    totalWeight += WEIGHTS.yearBuilt;
    const yearDiff = Math.abs(subject.yearBuilt - comp.yearBuilt);
    totalScore += (1 - Math.min(yearDiff, 50) / 50) * WEIGHTS.yearBuilt;
  }

  // Bedrooms (exact/±1/±2)
  if (subject.bedrooms > 0 && comp.bedrooms != null && comp.bedrooms > 0) {
    totalWeight += WEIGHTS.bedrooms;
    const diff = Math.abs(subject.bedrooms - comp.bedrooms);
    if (diff === 0) totalScore += WEIGHTS.bedrooms;
    else if (diff === 1) totalScore += WEIGHTS.bedrooms * 0.8;
    else if (diff === 2) totalScore += WEIGHTS.bedrooms * 0.4;
  }

  // Bathrooms (exact/±0.5/±1)
  if (subject.bathrooms > 0 && comp.bathrooms != null && comp.bathrooms > 0) {
    totalWeight += WEIGHTS.bathrooms;
    const diff = Math.abs(subject.bathrooms - comp.bathrooms);
    if (diff === 0) totalScore += WEIGHTS.bathrooms;
    else if (diff <= 0.5) totalScore += WEIGHTS.bathrooms * 0.8;
    else if (diff <= 1) totalScore += WEIGHTS.bathrooms * 0.6;
    else if (diff <= 1.5) totalScore += WEIGHTS.bathrooms * 0.3;
  }

  // Lot size (normalized %)
  if (subject.lotSizeSqft > 0 && comp.lotSizeSqft != null && comp.lotSizeSqft > 0) {
    totalWeight += WEIGHTS.lotSize;
    const pctDiff = Math.abs(subject.lotSizeSqft - comp.lotSizeSqft) / subject.lotSizeSqft;
    totalScore += Math.max(0, 1 - pctDiff) * WEIGHTS.lotSize;
  }

  if (totalWeight === 0) return 0;
  return totalScore / totalWeight;
}

// ═══════════════════════════════════════════════════════════════
// Comp Selection Pipeline
// ═══════════════════════════════════════════════════════════════

/** Find, filter, score, and rank comps for a subject */
export function findCompsForSubject(
  subject: SubjectProperty,
  allSales: ComparableSale[],
  filters: CompFilter = {},
  maxResults = 20,
): ScoredComp[] {
  const filtered = filterComps(subject, allSales, filters);

  const scored: ScoredComp[] = filtered.map((sale) => ({
    ...sale,
    similarityScore: scoreSimilarity(subject, sale),
    pricePerSqft:
      sale.grossLivingArea != null && sale.grossLivingArea > 0
        ? Math.round((sale.salePrice / sale.grossLivingArea) * 100) / 100
        : null,
  }));

  scored.sort((a, b) => b.similarityScore - a.similarityScore);
  return scored.slice(0, maxResults);
}

// ═══════════════════════════════════════════════════════════════
// Backend API Calls — math authority stays in CostForge
// ═══════════════════════════════════════════════════════════════

const COSTFORGE_BASE = '/api/costforge';

/** Map condition strings to the 5-point scale expected by CostForge */
function normalizeCondition(cond: string | null): string {
  if (!cond) return 'Average';
  const upper = cond.toUpperCase();
  if (upper === 'EXCELLENT') return 'Excellent';
  if (upper === 'VERY GOOD' || upper === 'GOOD') return 'Good';
  if (upper === 'AV' || upper === 'AVERAGE') return 'Average';
  if (upper === 'FAIR') return 'Fair';
  if (upper === 'POOR') return 'Poor';
  return 'Average';
}

/** Call CostForge adjust-comparable endpoint for a single comp */
export async function adjustComp(
  subject: SubjectProperty,
  comp: ComparableSale,
): Promise<AdjustmentResult> {
  const body = {
    subjectGla: subject.grossLivingArea,
    compGla: comp.grossLivingArea ?? subject.grossLivingArea,
    subjectLotSize: subject.lotSizeSqft,
    compLotSize: comp.lotSizeSqft ?? subject.lotSizeSqft,
    subjectYearBuilt: subject.yearBuilt,
    compYearBuilt: comp.yearBuilt ?? subject.yearBuilt,
    subjectBedrooms: subject.bedrooms,
    compBedrooms: comp.bedrooms ?? subject.bedrooms,
    subjectBathrooms: subject.bathrooms,
    compBathrooms: comp.bathrooms ?? subject.bathrooms,
    subjectCondition: normalizeCondition(subject.condition),
    compCondition: normalizeCondition(comp.condition),
    subjectLocation: 'Average',
    compLocation: 'Average',
    salePrice: comp.salePrice,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${COSTFORGE_BASE}/sales-comparison/adjust-comparable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`CostForge adjust-comparable failed: ${res.status}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Call CostForge reconcile endpoint for multiple adjusted comps */
export async function reconcileComps(
  adjustedComps: Array<{ adjustedPrice: number; grossAdjustmentPct: number }>,
): Promise<ReconciliationResult> {
  const body = {
    comparables: adjustedComps.map((c) => ({
      adjustedPrice: c.adjustedPrice,
      grossAdjustmentPct: c.grossAdjustmentPct,
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${COSTFORGE_BASE}/sales-comparison/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`CostForge reconcile failed: ${res.status}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

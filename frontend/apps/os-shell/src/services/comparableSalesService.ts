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
 *   - Data: dev-snapshots/benton-comparable-sales.json
 *
 * GUARDRAIL: All adjustment/reconciliation math stays in backend CostForge
 * endpoints. Frontend only does filtering, sorting, and similarity scoring
 * for candidate selection.
 */

import bentonCompsSnapshot from '../data/dev-snapshots/benton-comparable-sales.json';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

/** Shape of a comparable sale record from Benton County snapshot */
export interface ComparableSale {
  parcelId: string;
  saleDate: string;
  salePrice: number;
  propertyType: string;
  address: string;
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
  condition: string;
  qualityGrade: string;
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

/** Load Benton County comparable sales from dev snapshot */
export function loadBentonComps(): ComparableSale[] {
  return (bentonCompsSnapshot as ComparableSale[]).map((raw) => ({
    parcelId: raw.parcelId,
    saleDate: raw.saleDate,
    salePrice: raw.salePrice,
    propertyType: raw.propertyType || 'residential',
    address: raw.address,
    grossLivingArea: raw.grossLivingArea,
    lotSizeSqft: raw.lotSizeSqft,
    yearBuilt: raw.yearBuilt,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    condition: raw.condition,
    qualityGrade: raw.qualityGrade,
    saleQualification: raw.saleQualification,
  }));
}

// ═══════════════════════════════════════════════════════════════
// Filtering — adapted from QUARANTINE comparablesService.ts
// ═══════════════════════════════════════════════════════════════

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

/**
 * TFR-046: Per-Parcel Data Quality Scoring
 *
 * Weighted field-completeness scoring with stale-data detection.
 * Required fields carry heavier weight than optional fields so that
 * a parcel with a missing APN scores worse than one missing a note.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface ParcelScoreResult {
  /** 0-100 completeness score. */
  score: number;
  grade: QualityGrade;
  /** Field keys that are missing or empty. */
  missingFields: string[];
  /** True when the parcel has not been updated within the staleness threshold. */
  isStale: boolean;
}

export interface NeighborhoodScoreResult {
  /** Average score across all parcels. */
  averageScore: number;
  /** Lowest individual score. */
  minScore: number;
  /** Highest individual score. */
  maxScore: number;
  /** Grade distribution. */
  gradeDistribution: Record<QualityGrade, number>;
  /** Count of stale parcels. */
  staleCount: number;
  totalParcels: number;
}

interface FieldWeight {
  key: string;
  weight: number;
}

// ---------------------------------------------------------------------------
// Field weight configuration
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS: FieldWeight[] = [
  { key: 'parcelNumber', weight: 10 },
  { key: 'ownerName', weight: 8 },
  { key: 'situs', weight: 8 },
  { key: 'legalDescription', weight: 6 },
  { key: 'propertyClass', weight: 7 },
  { key: 'landArea', weight: 7 },
  { key: 'assessedValue', weight: 9 },
  { key: 'taxableValue', weight: 9 },
  { key: 'yearBuilt', weight: 5 },
  { key: 'buildingSqFt', weight: 6 },
];

const OPTIONAL_FIELDS: FieldWeight[] = [
  { key: 'mailingAddress', weight: 3 },
  { key: 'zoning', weight: 3 },
  { key: 'neighborhood', weight: 3 },
  { key: 'landUse', weight: 2 },
  { key: 'bedrooms', weight: 1 },
  { key: 'bathrooms', weight: 1 },
  { key: 'garage', weight: 1 },
  { key: 'condition', weight: 2 },
  { key: 'lastSaleDate', weight: 2 },
  { key: 'lastSalePrice', weight: 2 },
];

const ALL_FIELDS: FieldWeight[] = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];
const TOTAL_WEIGHT = ALL_FIELDS.reduce((sum, f) => sum + f.weight, 0);

/** Default staleness threshold: 365 days. */
const STALE_THRESHOLD_MS = 365 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (typeof value === 'number' && isNaN(value)) return true;
  return false;
}

function gradeFromScore(score: number): QualityGrade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Score a single parcel for data completeness.
 */
export function scoreParcel(
  parcel: Record<string, unknown>,
  staleThresholdMs = STALE_THRESHOLD_MS,
): ParcelScoreResult {
  let earnedWeight = 0;
  const missingFields: string[] = [];

  for (const { key, weight } of ALL_FIELDS) {
    if (isEmpty(parcel[key])) {
      missingFields.push(key);
    } else {
      earnedWeight += weight;
    }
  }

  const score = Math.round((earnedWeight / TOTAL_WEIGHT) * 100);
  const grade = gradeFromScore(score);

  let isStale = false;
  const updatedAt = parcel['updatedAt'] ?? parcel['lastUpdated'];
  if (updatedAt) {
    const ts = typeof updatedAt === 'string' ? new Date(updatedAt).getTime() : (updatedAt as number);
    isStale = Date.now() - ts > staleThresholdMs;
  } else {
    // No update timestamp at all counts as stale.
    isStale = true;
  }

  return { score, grade, missingFields, isStale };
}

/**
 * Aggregate quality scores across a neighbourhood (array of parcels).
 */
export function scoreNeighborhood(
  parcels: Record<string, unknown>[],
  staleThresholdMs = STALE_THRESHOLD_MS,
): NeighborhoodScoreResult {
  const distribution: Record<QualityGrade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  let totalScore = 0;
  let minScore = 100;
  let maxScore = 0;
  let staleCount = 0;

  for (const parcel of parcels) {
    const result = scoreParcel(parcel, staleThresholdMs);
    totalScore += result.score;
    distribution[result.grade]++;
    if (result.score < minScore) minScore = result.score;
    if (result.score > maxScore) maxScore = result.score;
    if (result.isStale) staleCount++;
  }

  return {
    averageScore: parcels.length > 0 ? Math.round(totalScore / parcels.length) : 0,
    minScore: parcels.length > 0 ? minScore : 0,
    maxScore,
    gradeDistribution: distribution,
    staleCount,
    totalParcels: parcels.length,
  };
}

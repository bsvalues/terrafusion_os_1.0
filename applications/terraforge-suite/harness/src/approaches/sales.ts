/**
 * TerraForge Sales Comparison Approach
 *
 * USPAP-aligned sales comparison analysis:
 * - Adjusts comparable sales to subject property
 * - Produces deterministic indicated value
 * - Generates explanation and quality indicators
 *
 * All monetary values are integers (no cents) for determinism.
 */

import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// ============================================================
// TYPES (matching JSON Schema contracts)
// ============================================================

export type ConditionRating = 'Excellent' | 'Good' | 'Average' | 'Fair' | 'Poor';
export type LocationRating = 'Superior' | 'Good' | 'Average' | 'Fair' | 'Inferior';
export type ConfidenceLevel = 'High' | 'Moderate' | 'Low';
export type ValueMethod = 'median' | 'weighted_average' | 'bracketed_mean';

export interface SubjectCharacteristics {
  gla: number;
  lotSize: number;
  yearBuilt: number;
  bedrooms?: number;
  bathrooms?: number;
  condition: ConditionRating;
  location: LocationRating;
}

export interface Comparable {
  compId: string;
  salePrice: number;
  saleDate: string;
  gla: number;
  lotSize: number;
  yearBuilt: number;
  bedrooms?: number;
  bathrooms?: number;
  condition: ConditionRating;
  location: LocationRating;
}

export interface AdjustmentRates {
  glaPerSqFt: number;
  lotSizePerSqFt: number;
  agePerYear: number;
  bedroomAdjustment?: number;
  bathroomAdjustment?: number;
  conditionAdjustments: Record<ConditionRating, number>;
  locationAdjustments: Record<LocationRating, number>;
}

export interface SalesApproachInput {
  subjectParcelId: string;
  subjectCharacteristics: SubjectCharacteristics;
  comparables: Comparable[];
  adjustmentRates: AdjustmentRates;
}

export interface ComparableAdjustments {
  gla: number;
  lotSize: number;
  age: number;
  bedrooms: number;
  bathrooms: number;
  condition: number;
  location: number;
  total: number;
}

export interface ComparableAnalysis {
  compId: string;
  salePrice: number;
  adjustments: ComparableAdjustments;
  adjustedPrice: number;
  grossAdjustmentPercent: number;
  netAdjustmentPercent: number;
  weight: number;
}

export interface SalesApproachOutput {
  subjectParcelId: string;
  indicatedValue: number;
  valueMethod: ValueMethod;
  comparableAnalysis: ComparableAnalysis[];
  statistics: {
    adjustedPriceRange: { min: number; max: number };
    adjustedPriceMean: number;
    adjustedPriceMedian: number;
    standardDeviation?: number;
    coefficientOfVariation?: number;
  };
  qualityIndicators: {
    comparabilityScore: number;
    confidenceLevel: ConfidenceLevel;
    flags: string[];
  };
  explanation: string;
}

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  actor: string;
  action: string;
  resourceId: string;
  module: string;
  hash: string;
}

export interface SalesApproachResult {
  success: boolean;
  data?: SalesApproachOutput;
  error?: string;
  auditEvent?: AuditEvent;
}

// ============================================================
// IMPLEMENTATION
// ============================================================

/**
 * Calculate adjustments for a single comparable
 */
function calculateAdjustments(
  subject: SubjectCharacteristics,
  comp: Comparable,
  rates: AdjustmentRates
): ComparableAdjustments {
  // GLA adjustment: positive if comp is smaller (subject is larger)
  const glaDiff = subject.gla - comp.gla;
  const glaAdj = Math.round(glaDiff * rates.glaPerSqFt);

  // Lot size adjustment: positive if comp is smaller
  const lotDiff = subject.lotSize - comp.lotSize;
  const lotAdj = Math.round(lotDiff * rates.lotSizePerSqFt);

  // Age adjustment: positive if comp is newer (subject is older)
  // Newer = higher year built
  const ageDiff = comp.yearBuilt - subject.yearBuilt;
  const ageAdj = Math.round(ageDiff * rates.agePerYear);

  // Bedroom adjustment
  const bedroomDiff = (subject.bedrooms ?? 0) - (comp.bedrooms ?? 0);
  const bedroomAdj = rates.bedroomAdjustment
    ? Math.round(bedroomDiff * rates.bedroomAdjustment)
    : 0;

  // Bathroom adjustment
  const bathroomDiff = (subject.bathrooms ?? 0) - (comp.bathrooms ?? 0);
  const bathroomAdj = rates.bathroomAdjustment
    ? Math.round(bathroomDiff * rates.bathroomAdjustment)
    : 0;

  // Condition adjustment: based on ranking difference
  const subjectConditionValue = rates.conditionAdjustments[subject.condition];
  const compConditionValue = rates.conditionAdjustments[comp.condition];
  const conditionAdj = subjectConditionValue - compConditionValue;

  // Location adjustment: based on ranking difference
  const subjectLocationValue = rates.locationAdjustments[subject.location];
  const compLocationValue = rates.locationAdjustments[comp.location];
  const locationAdj = subjectLocationValue - compLocationValue;

  const total = glaAdj + lotAdj + ageAdj + bedroomAdj + bathroomAdj + conditionAdj + locationAdj;

  return {
    gla: glaAdj,
    lotSize: lotAdj,
    age: ageAdj,
    bedrooms: bedroomAdj,
    bathrooms: bathroomAdj,
    condition: conditionAdj,
    location: locationAdj,
    total,
  };
}

/**
 * Calculate weight for a comparable based on adjustment magnitude
 * Lower gross adjustments = higher weight
 */
function calculateWeight(grossAdjustmentPercent: number): number {
  // Weight inversely proportional to gross adjustment
  // Cap at 50% gross adjustment for minimum weight
  const cappedPercent = Math.min(grossAdjustmentPercent, 50);
  const weight = 1 - cappedPercent / 50;
  return Math.round(weight * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate median of an array of numbers
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(Math.sqrt(avgSquaredDiff));
}

/**
 * Determine confidence level based on statistics
 */
function determineConfidence(
  cov: number,
  grossAdjustmentPercents: number[],
  compCount: number
): ConfidenceLevel {
  const avgGrossAdj = grossAdjustmentPercents.reduce((a, b) => a + b, 0) / grossAdjustmentPercents.length;

  // High confidence: 3+ comps, CV < 10%, avg gross adj < 15%
  if (compCount >= 3 && cov < 10 && avgGrossAdj < 15) return 'High';

  // Moderate confidence: 2+ comps, CV < 20%, avg gross adj < 25%
  if (compCount >= 2 && cov < 20 && avgGrossAdj < 25) return 'Moderate';

  return 'Low';
}

/**
 * Generate quality flags
 */
function generateFlags(
  analysis: ComparableAnalysis[],
  cov: number
): string[] {
  const flags: string[] = [];

  // Check for high gross adjustments
  const highAdjComps = analysis.filter(a => a.grossAdjustmentPercent > 25);
  if (highAdjComps.length > 0) {
    flags.push(`${highAdjComps.length} comparable(s) have gross adjustments > 25%`);
  }

  // Check for wide range
  if (cov > 15) {
    flags.push(`High coefficient of variation (${cov.toFixed(1)}%) indicates value dispersion`);
  }

  // Check for limited comps
  if (analysis.length < 3) {
    flags.push(`Limited comparable sales (${analysis.length}) - recommend additional market research`);
  }

  return flags;
}

/**
 * Generate explanation narrative
 */
function generateExplanation(
  input: SalesApproachInput,
  analysis: ComparableAnalysis[],
  indicatedValue: number,
  method: ValueMethod
): string {
  const { subjectParcelId, subjectCharacteristics: subject, comparables } = input;

  const methodDescription =
    method === 'median'
      ? 'median of adjusted sale prices'
      : method === 'weighted_average'
        ? 'weighted average based on comparability'
        : 'bracketed mean of adjusted sale prices';

  const adjustedPrices = analysis.map(a => a.adjustedPrice);
  const range = { min: Math.min(...adjustedPrices), max: Math.max(...adjustedPrices) };

  return (
    `Sales Comparison Analysis for parcel ${subjectParcelId}: ` +
    `${comparables.length} comparable sales were analyzed. ` +
    `Subject property: ${subject.gla.toLocaleString()} SF GLA, ${subject.lotSize.toLocaleString()} SF lot, ` +
    `built ${subject.yearBuilt}, ${subject.condition} condition, ${subject.location} location. ` +
    `After adjustments, indicated values range from $${range.min.toLocaleString()} to $${range.max.toLocaleString()}. ` +
    `Using ${methodDescription}, the indicated value is $${indicatedValue.toLocaleString()}.`
  );
}

/**
 * Create audit event for sales approach
 */
function createAuditEvent(input: SalesApproachInput, output: SalesApproachOutput): AuditEvent {
  const timestamp = new Date().toISOString();
  const eventId = uuidv4();

  const hashPayload = JSON.stringify({
    subjectParcelId: input.subjectParcelId,
    indicatedValue: output.indicatedValue,
    comparableCount: input.comparables.length,
    timestamp,
  });

  const hash = crypto.createHash('sha256').update(hashPayload).digest('hex').slice(0, 16);

  return {
    eventId,
    timestamp,
    actor: 'terraforge.approach.sales',
    action: 'approach_sales_completed',
    resourceId: input.subjectParcelId,
    module: 'terraforge.approach.sales',
    hash,
  };
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Run the Sales Comparison Approach
 *
 * @param input - Sales approach input data
 * @returns Sales approach result with output and audit event
 */
export async function runSalesApproach(input: SalesApproachInput): Promise<SalesApproachResult> {
  try {
    const { subjectParcelId, subjectCharacteristics, comparables, adjustmentRates } = input;

    // Validate input
    if (!comparables || comparables.length === 0) {
      return { success: false, error: 'At least one comparable sale is required' };
    }

    // Analyze each comparable
    const analysis: ComparableAnalysis[] = comparables.map(comp => {
      const adjustments = calculateAdjustments(subjectCharacteristics, comp, adjustmentRates);
      const adjustedPrice = comp.salePrice + adjustments.total;

      const grossAdjustment = Math.abs(adjustments.total);
      const grossAdjustmentPercent = Math.round((grossAdjustment / comp.salePrice) * 10000) / 100;
      const netAdjustmentPercent = Math.round((adjustments.total / comp.salePrice) * 10000) / 100;

      const weight = calculateWeight(grossAdjustmentPercent);

      return {
        compId: comp.compId,
        salePrice: comp.salePrice,
        adjustments,
        adjustedPrice,
        grossAdjustmentPercent,
        netAdjustmentPercent,
        weight,
      };
    });

    // Calculate statistics
    const adjustedPrices = analysis.map(a => a.adjustedPrice);
    const mean = Math.round(adjustedPrices.reduce((a, b) => a + b, 0) / adjustedPrices.length);
    const med = median(adjustedPrices);
    const stdDev = standardDeviation(adjustedPrices, mean);
    const cov = mean > 0 ? Math.round((stdDev / mean) * 10000) / 100 : 0;

    // Determine value method and calculate indicated value
    // Use weighted average if we have varying weights, otherwise median
    const totalWeight = analysis.reduce((sum, a) => sum + a.weight, 0);
    let valueMethod: ValueMethod;
    let indicatedValue: number;

    if (totalWeight > 0 && analysis.length >= 3) {
      // Weighted average
      valueMethod = 'weighted_average';
      const weightedSum = analysis.reduce((sum, a) => sum + a.adjustedPrice * a.weight, 0);
      indicatedValue = Math.round(weightedSum / totalWeight);
    } else {
      // Default to median for robustness
      valueMethod = 'median';
      indicatedValue = med;
    }

    // Quality indicators
    const grossAdjustmentPercents = analysis.map(a => a.grossAdjustmentPercent);
    const confidenceLevel = determineConfidence(cov, grossAdjustmentPercents, analysis.length);

    // Comparability score (0-100)
    // Based on: avg gross adjustment (lower = better), CV (lower = better), comp count (more = better)
    const avgGrossAdj = grossAdjustmentPercents.reduce((a, b) => a + b, 0) / grossAdjustmentPercents.length;
    const adjScore = Math.max(0, 100 - avgGrossAdj * 2); // 0% adj = 100, 50% adj = 0
    const covScore = Math.max(0, 100 - cov * 3); // 0% CV = 100, 33% CV = 0
    const countScore = Math.min(100, analysis.length * 20); // 5+ comps = 100
    const comparabilityScore = Math.round((adjScore * 0.4 + covScore * 0.3 + countScore * 0.3) * 10) / 10;

    const flags = generateFlags(analysis, cov);

    const output: SalesApproachOutput = {
      subjectParcelId,
      indicatedValue,
      valueMethod,
      comparableAnalysis: analysis,
      statistics: {
        adjustedPriceRange: {
          min: Math.min(...adjustedPrices),
          max: Math.max(...adjustedPrices),
        },
        adjustedPriceMean: mean,
        adjustedPriceMedian: med,
        standardDeviation: stdDev,
        coefficientOfVariation: cov,
      },
      qualityIndicators: {
        comparabilityScore,
        confidenceLevel,
        flags,
      },
      explanation: generateExplanation(input, analysis, indicatedValue, valueMethod),
    };

    const auditEvent = createAuditEvent(input, output);

    return {
      success: true,
      data: output,
      auditEvent,
    };
  } catch (err) {
    return {
      success: false,
      error: `Sales approach failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

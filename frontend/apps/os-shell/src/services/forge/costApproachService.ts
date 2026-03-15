/**
 * Forge Cost Approach Service (TFR-024)
 * ===================================================================
 * Client-side API service for the cost approach to value. Provides
 * cost schedule retrieval, depreciation tables, and replacement cost
 * new (RCN) computation with physical, functional, and external
 * depreciation.
 */

// ============================================================================
// Types
// ============================================================================

/** Cost schedule entry from the county's cost tables */
export interface CostSchedule {
  /** Schedule identifier */
  scheduleId: string;
  /** Building type code (e.g. '100' for SFR) */
  buildingTypeCode: string;
  /** Building type description */
  buildingTypeDescription: string;
  /** Quality grade */
  qualityGrade: string;
  /** Base cost per square foot */
  baseCostPerSqft: number;
  /** Cost matrix year */
  matrixYear: number;
  /** Region modifier */
  regionFactor: number;
  /** Depreciation schedule */
  depreciationTable: DepreciationEntry[];
  /** Source system (e.g. 'Harris PACS 9.0') */
  sourceSystem: string;
}

/** Depreciation table entry mapping effective age to depreciation percentage */
export interface DepreciationEntry {
  /** Effective age in years */
  effectiveAge: number;
  /** Physical depreciation percentage (0-1) */
  physicalDepreciation: number;
  /** Remaining economic life in years */
  remainingLife: number;
}

/** Input for computing the cost approach */
export interface CostApproachInput {
  /** Building type code */
  buildingTypeCode: string;
  /** Quality grade */
  qualityGrade: string;
  /** Condition rating */
  condition: string;
  /** Region identifier */
  region: string;
  /** Gross living area in sqft */
  grossLivingArea: number;
  /** Year built */
  yearBuilt: number;
  /** Effective year (may differ from year built due to renovations) */
  effectiveYear: number;
  /** Number of stories */
  stories: number;
  /** Whether the property has a basement */
  hasBasement: boolean;
  /** Basement finished area in sqft */
  basementFinishedArea: number;
  /** Garage area in sqft */
  garageArea: number;
  /** Additional features (porches, decks, pools, etc.) */
  additionalFeatures: Array<{
    featureType: string;
    area: number;
    unitCost: number;
  }>;
  /** Land value (assessed separately) */
  landValue: number;
  /** Functional obsolescence adjustment (dollar amount) */
  functionalObsolescence: number;
  /** External (economic) obsolescence adjustment (dollar amount) */
  externalObsolescence: number;
}

/** Result of a cost approach computation */
export interface CostApproachResult {
  /** Replacement cost new (before depreciation) */
  rcnNew: number;
  /** Base cost per sqft used */
  baseCostPerSqft: number;
  /** Adjusted cost per sqft after quality/region factors */
  adjustedCostPerSqft: number;
  /** Physical depreciation amount */
  physicalDepreciation: number;
  /** Physical depreciation percentage */
  physicalDepreciationPct: number;
  /** Functional obsolescence amount */
  functionalObsolescence: number;
  /** External obsolescence amount */
  externalObsolescence: number;
  /** Total depreciation (physical + functional + external) */
  totalDepreciation: number;
  /** RCN less depreciation (RCN - total depreciation) */
  rcnld: number;
  /** Land value */
  landValue: number;
  /** Total indicated value (RCNLD + land) */
  totalIndicatedValue: number;
  /** Effective age used in depreciation calculation */
  effectiveAge: number;
  /** Remaining economic life */
  remainingEconomicLife: number;
  /** Factors applied */
  factors: {
    quality: number;
    condition: number;
    region: number;
    story: number;
  };
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/cost-approach';

/**
 * Fetch cost schedules and depreciation tables from the county's cost system.
 * @returns Array of cost schedules with embedded depreciation tables
 */
export async function fetchCostSchedules(): Promise<CostSchedule[]> {
  const response = await fetch(`${BASE_URL}/schedules`);
  if (!response.ok) {
    throw new Error(`Failed to fetch cost schedules: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Compute the cost approach to value. Calculates RCN, applies depreciation,
 * and produces the total indicated value.
 * @param input - Cost approach calculation input parameters
 * @returns Detailed cost approach result with RCN, depreciation, and value
 */
export async function computeCostApproach(input: CostApproachInput): Promise<CostApproachResult> {
  const response = await fetch(`${BASE_URL}/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to compute cost approach: ${response.statusText}`);
  }
  return response.json();
}

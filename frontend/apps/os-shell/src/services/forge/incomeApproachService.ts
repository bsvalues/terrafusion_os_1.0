/**
 * Forge Income Approach Service (TFR-025)
 * ===================================================================
 * Client-side API service for the income approach to value. Provides
 * income property data retrieval and capitalization/GRM computation
 * for commercial and multi-family properties.
 */

// ============================================================================
// Types
// ============================================================================

/** Income-producing property data */
export interface IncomeProperty {
  /** Parcel identifier */
  parcelId: string;
  /** Property address */
  address: string;
  /** Property type (e.g. 'apartment', 'office', 'retail', 'industrial') */
  propertyType: string;
  /** Number of units (for multi-family) */
  numberOfUnits: number;
  /** Total rentable area in sqft */
  rentableArea: number;
  /** Potential gross income (PGI) */
  potentialGrossIncome: number;
  /** Vacancy and collection loss rate (as decimal) */
  vacancyRate: number;
  /** Effective gross income (PGI - vacancy loss) */
  effectiveGrossIncome: number;
  /** Operating expenses */
  operatingExpenses: number;
  /** Operating expense ratio */
  operatingExpenseRatio: number;
  /** Net operating income (EGI - operating expenses) */
  netOperatingIncome: number;
  /** Market rent per unit per month */
  marketRentPerUnit: number;
  /** Market rent per sqft per year */
  marketRentPerSqft: number;
  /** Data source */
  source: string;
}

/** Input for computing the income approach */
export interface IncomeApproachInput {
  /** Parcel identifier */
  parcelId: string;
  /** Potential gross income */
  potentialGrossIncome: number;
  /** Vacancy and collection loss rate (as decimal, e.g. 0.05 = 5%) */
  vacancyRate: number;
  /** Other income (laundry, parking, etc.) */
  otherIncome: number;
  /** Total operating expenses */
  operatingExpenses: number;
  /** Capitalization rate (as decimal, e.g. 0.08 = 8%) */
  capRate: number;
  /** Gross rent multiplier */
  grm: number;
  /** Whether to use direct capitalization or GRM method */
  method: 'direct_capitalization' | 'grm' | 'both';
}

/** Result of an income approach computation */
export interface IncomeApproachResult {
  /** Potential gross income */
  potentialGrossIncome: number;
  /** Vacancy and collection loss */
  vacancyLoss: number;
  /** Other income */
  otherIncome: number;
  /** Effective gross income */
  effectiveGrossIncome: number;
  /** Operating expenses */
  operatingExpenses: number;
  /** Operating expense ratio */
  operatingExpenseRatio: number;
  /** Net operating income */
  netOperatingIncome: number;
  /** Capitalization rate used */
  capRate: number;
  /** Value via direct capitalization (NOI / cap rate) */
  valueByDirectCap: number;
  /** Gross rent multiplier used */
  grm: number;
  /** Value via GRM (EGI * GRM) */
  valueByGrm: number;
  /** Reconciled indicated value */
  indicatedValue: number;
  /** Method used for final value */
  methodUsed: 'direct_capitalization' | 'grm' | 'both';
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/income-approach';

/**
 * Fetch income property data for a parcel including rent rolls and expenses.
 * @param parcelId - The parcel to retrieve income data for
 * @returns Income property data with PGI, expenses, and NOI
 */
export async function fetchIncomeProperties(parcelId: string): Promise<IncomeProperty> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(parcelId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch income property data for parcel ${parcelId}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Compute the income approach to value using direct capitalization
 * and/or gross rent multiplier methods.
 * @param input - Income approach calculation inputs
 * @returns Detailed income approach result with NOI, cap rate, GRM, and value
 */
export async function computeIncomeApproach(
  input: IncomeApproachInput
): Promise<IncomeApproachResult> {
  const response = await fetch(`${BASE_URL}/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(`Failed to compute income approach: ${response.statusText}`);
  }
  return response.json();
}

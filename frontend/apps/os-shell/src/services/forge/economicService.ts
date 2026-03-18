/**
 * Forge Economic Service (BIV-146)
 * ===================================================================
 * Client-side API service for regional economic indicators and
 * census demographics data used in mass appraisal market analysis
 * and income approach modeling.
 */

// ============================================================================
// Types
// ============================================================================

/** Regional economic indicator */
export interface EconomicIndicator {
  /** Area identifier (county FIPS, MSA code, etc.) */
  areaId: string;
  /** Human-readable area name */
  areaName: string;
  /** Indicator name (e.g. 'unemployment_rate', 'median_household_income') */
  indicatorName: string;
  /** Current value */
  value: number;
  /** Unit of measure (e.g. 'percent', 'dollars', 'index') */
  unit: string;
  /** Period the data covers (e.g. '2025-Q1') */
  period: string;
  /** Change from prior period */
  priorPeriodChange: number;
  /** Year-over-year change */
  yearOverYearChange: number;
  /** Data source (e.g. 'BLS', 'Census ACS', 'BEA') */
  source: string;
  /** ISO timestamp of last update */
  lastUpdated: string;
}

/** Census demographics for an area */
export interface Demographics {
  /** Area identifier */
  areaId: string;
  /** Area name */
  areaName: string;
  /** Total population */
  totalPopulation: number;
  /** Population growth rate (annual, as decimal) */
  populationGrowthRate: number;
  /** Median household income in dollars */
  medianHouseholdIncome: number;
  /** Median age */
  medianAge: number;
  /** Homeownership rate (as decimal, e.g. 0.65 = 65%) */
  homeownershipRate: number;
  /** Median home value from Census */
  medianHomeValue: number;
  /** Vacancy rate (as decimal) */
  vacancyRate: number;
  /** Number of housing units */
  housingUnits: number;
  /** Poverty rate (as decimal) */
  povertyRate: number;
  /** Census vintage year */
  censusYear: number;
  /** Data source (e.g. 'ACS 5-Year', 'Decennial Census') */
  source: string;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/economic';

/**
 * Fetch economic indicators for a geographic area.
 * @param area - Area identifier (county FIPS code, MSA code, or name)
 * @returns Array of economic indicators for the area
 */
export async function fetchEconomicIndicators(area: string): Promise<EconomicIndicator[]> {
  const response = await fetch(`${BASE_URL}/indicators/${encodeURIComponent(area)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch economic indicators for ${area}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch census demographics for a geographic area.
 * @param area - Area identifier (county FIPS code or name)
 * @returns Demographics data for the area
 */
export async function fetchDemographics(area: string): Promise<Demographics> {
  const response = await fetch(`${BASE_URL}/demographics/${encodeURIComponent(area)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch demographics for ${area}: ${response.statusText}`);
  }
  return response.json();
}

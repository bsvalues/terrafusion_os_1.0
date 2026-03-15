/**
 * Forge Market Trends Service (BIV-140)
 * ===================================================================
 * Client-side API service for market trend analysis, current market
 * conditions, and area-level metrics used in the sales comparison
 * and income approaches to value.
 */

// ============================================================================
// Types
// ============================================================================

/** Market trend data for a geographic area or property class */
export interface MarketTrend {
  /** Area or neighborhood identifier */
  areaId: string;
  /** Human-readable area name */
  areaName: string;
  /** Property class (e.g. 'residential', 'commercial') */
  propertyClass: string;
  /** Trend period start date (ISO) */
  periodStart: string;
  /** Trend period end date (ISO) */
  periodEnd: string;
  /** Median sale price for the period */
  medianSalePrice: number;
  /** Average sale price for the period */
  averageSalePrice: number;
  /** Number of qualified sales in the period */
  salesCount: number;
  /** Percentage change from prior period */
  percentChange: number;
  /** Price per square foot trend */
  pricePerSqft: number;
  /** Days on market average */
  avgDaysOnMarket: number;
}

/** Current market conditions snapshot */
export interface MarketCondition {
  /** Overall market direction */
  direction: 'appreciating' | 'stable' | 'declining';
  /** Annual appreciation rate as a decimal (e.g. 0.04 = 4%) */
  annualAppreciationRate: number;
  /** Supply level relative to demand */
  supplyLevel: 'low' | 'balanced' | 'high';
  /** Months of inventory at current absorption rate */
  monthsOfInventory: number;
  /** Snapshot timestamp (ISO) */
  asOfDate: string;
  /** Number of active listings in the market */
  activeListings: number;
  /** Ratio of sale price to list price */
  saleToListRatio: number;
}

/** Area-level market metrics for assessment ratio analysis */
export interface MarketMetrics {
  /** Area or neighborhood identifier */
  areaId: string;
  /** Area name */
  areaName: string;
  /** Median assessment ratio (assessed / sale price) */
  medianRatio: number;
  /** Coefficient of dispersion */
  cod: number;
  /** Price-related differential */
  prd: number;
  /** Number of sales used in the ratio study */
  sampleSize: number;
  /** Median sale price in the area */
  medianSalePrice: number;
  /** Median assessed value in the area */
  medianAssessedValue: number;
  /** Study period year */
  studyYear: number;
}

/** Filters for market trend queries */
export interface MarketTrendFilters {
  /** Filter by area ID */
  areaId?: string;
  /** Filter by property class */
  propertyClass?: string;
  /** Start date for the trend period (ISO) */
  startDate?: string;
  /** End date for the trend period (ISO) */
  endDate?: string;
  /** Limit number of results */
  limit?: number;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/market';

/**
 * Fetch market trends with optional filters.
 * @param filters - Optional filters to narrow trend data
 * @returns Array of market trend records
 */
export async function fetchMarketTrends(filters?: MarketTrendFilters): Promise<MarketTrend[]> {
  const params = new URLSearchParams();
  if (filters?.areaId) params.set('areaId', filters.areaId);
  if (filters?.propertyClass) params.set('propertyClass', filters.propertyClass);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  if (filters?.limit !== undefined) params.set('limit', String(filters.limit));

  const query = params.toString();
  const url = `${BASE_URL}/trends${query ? `?${query}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch market trends: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch current market conditions for the county.
 * @returns Current market condition snapshot
 */
export async function fetchMarketConditions(): Promise<MarketCondition> {
  const response = await fetch(`${BASE_URL}/conditions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch market conditions: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch area-level market metrics for ratio study analysis.
 * @param area - The area or neighborhood identifier
 * @returns Market metrics for the specified area
 */
export async function fetchMarketMetrics(area: string): Promise<MarketMetrics> {
  const response = await fetch(`${BASE_URL}/metrics/${encodeURIComponent(area)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch market metrics for area ${area}: ${response.statusText}`);
  }
  return response.json();
}

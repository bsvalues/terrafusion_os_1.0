/**
 * Forge Market Types (BIV-169)
 * ===================================================================
 * Shared TypeScript interfaces for market-related data used across
 * forge valuation services and UI components.
 */

/** Area-level market metrics for assessment ratio analysis */
export interface MarketMetrics {
  /** Area or neighborhood identifier */
  areaId: string;
  /** Area display name */
  areaName: string;
  /** Median assessment ratio (assessed / sale price) */
  medianRatio: number;
  /** Coefficient of dispersion */
  cod: number;
  /** Price-related differential */
  prd: number;
  /** Number of sales in the ratio study sample */
  sampleSize: number;
  /** Median sale price */
  medianSalePrice: number;
  /** Median assessed value */
  medianAssessedValue: number;
  /** Ratio study year */
  studyYear: number;
  /** Average price per sqft */
  avgPricePerSqft: number;
  /** Total number of parcels in the area */
  totalParcels: number;
}

/** Market trend data for a geographic area or property class */
export interface MarketTrend {
  /** Area or neighborhood identifier */
  areaId: string;
  /** Area display name */
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
  /** Number of qualified sales */
  salesCount: number;
  /** Percentage change from prior period */
  percentChange: number;
  /** Price per square foot */
  pricePerSqft: number;
  /** Days on market average */
  avgDaysOnMarket: number;
  /** List-to-sale price ratio */
  listToSaleRatio: number;
}

/** Market prediction based on trend analysis */
export interface MarketPrediction {
  /** Area or neighborhood identifier */
  areaId: string;
  /** Area display name */
  areaName: string;
  /** Property class */
  propertyClass: string;
  /** Predicted median sale price */
  predictedMedianPrice: number;
  /** Predicted appreciation rate (as decimal) */
  predictedAppreciationRate: number;
  /** Prediction confidence interval - low bound */
  confidenceLow: number;
  /** Prediction confidence interval - high bound */
  confidenceHigh: number;
  /** Confidence level (0-1) */
  confidenceScore: number;
  /** Prediction horizon in months */
  horizonMonths: number;
  /** Model used for prediction */
  modelName: string;
  /** ISO timestamp of when prediction was generated */
  generatedAt: string;
  /** Key factors driving the prediction */
  drivingFactors: Array<{
    factor: string;
    direction: 'positive' | 'negative';
    weight: number;
  }>;
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
  /** Number of active listings */
  activeListings: number;
  /** Sale-to-list price ratio */
  saleToListRatio: number;
  /** New listings in the current period */
  newListings: number;
  /** Closed sales in the current period */
  closedSales: number;
  /** Absorption rate (sales per month) */
  absorptionRate: number;
}

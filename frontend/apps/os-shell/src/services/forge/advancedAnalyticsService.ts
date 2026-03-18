/**
 * Forge Advanced Analytics Service (TFR-044)
 * ===================================================================
 * Client-side API service for advanced assessment analytics: multi-year
 * ratio trend sparklines, value forecasting with confidence intervals,
 * statistical outlier analysis, and neighborhood clustering.
 *
 * Endpoints target the TerraFusion Kernel advanced-analytics API.
 */

// ============================================================================
// Types
// ============================================================================

/** A single data point in a sparkline time series */
export interface SparklinePoint {
  /** Assessment year */
  year: number;
  /** Median assessment ratio for the year */
  medianRatio: number;
  /** COD for the year */
  cod: number;
  /** Number of qualified sales */
  salesCount: number;
}

/** Multi-year ratio trend data for sparkline visualization */
export interface SparklineData {
  /** Neighborhood identifier */
  neighborhoodId: string;
  /** Neighborhood display name */
  neighborhoodName: string;
  /** Time series data points ordered by year ascending */
  points: SparklinePoint[];
  /** Linear trend slope (positive = ratios increasing over time) */
  trendSlope: number;
  /** Overall trend direction */
  trendDirection: 'increasing' | 'stable' | 'decreasing';
}

/** Confidence interval for a forecasted value */
export interface ConfidenceInterval {
  /** Lower bound of the interval */
  lower: number;
  /** Upper bound of the interval */
  upper: number;
  /** Confidence level as a decimal (e.g. 0.95 for 95%) */
  level: number;
}

/** Assessment value forecast for an area */
export interface ValueForecast {
  /** Area or neighborhood identifier */
  areaId: string;
  /** Area display name */
  areaName: string;
  /** Forecast horizon year */
  forecastYear: number;
  /** Forecasted median assessed value */
  forecastedMedianValue: number;
  /** Current median assessed value */
  currentMedianValue: number;
  /** Projected change as a decimal (e.g. 0.04 = 4% increase) */
  projectedChange: number;
  /** 80% confidence interval */
  ci80: ConfidenceInterval;
  /** 95% confidence interval */
  ci95: ConfidenceInterval;
  /** Model used for forecasting */
  modelUsed: string;
  /** Model fit metric (R-squared or equivalent) */
  modelFit: number;
  /** Number of historical observations used */
  historicalObservations: number;
  /** ISO timestamp of the forecast computation */
  computedAt: string;
}

/** Statistical method for outlier detection */
export type AnalyticsOutlierMethod = 'iqr' | 'z-score' | 'modified-z-score';

/** Parameters for advanced outlier analysis */
export interface OutlierAnalysisParams {
  /** Neighborhood filter (omit for county-wide) */
  neighborhood?: string;
  /** Property type filter */
  propertyType?: string;
  /** Detection method */
  method: AnalyticsOutlierMethod;
  /** Sensitivity threshold */
  threshold: number;
  /** Tax year */
  taxYear: number;
}

/** Individual outlier observation in the analysis */
export interface OutlierObservation {
  /** Parcel identifier */
  parcelId: string;
  /** Situs address */
  situsAddress: string;
  /** Assessment ratio */
  ratio: number;
  /** Statistical score (Z-score, modified Z-score, or IQR distance) */
  score: number;
  /** Direction of deviation */
  direction: 'over-assessed' | 'under-assessed';
  /** Assessed value */
  assessedValue: number;
  /** Sale price (if available) */
  salePrice: number;
}

/** Result of an advanced outlier analysis */
export interface OutlierAnalysis {
  /** Detection method applied */
  method: AnalyticsOutlierMethod;
  /** Threshold used */
  threshold: number;
  /** Total observations analyzed */
  totalAnalyzed: number;
  /** Number of outliers detected */
  outlierCount: number;
  /** Outlier rate as a decimal */
  outlierRate: number;
  /** Flagged observations */
  observations: OutlierObservation[];
  /** Population statistics after outlier removal */
  cleanedStats: {
    medianRatio: number;
    meanRatio: number;
    cod: number;
    prd: number;
    sampleSize: number;
  };
  /** ISO timestamp */
  analyzedAt: string;
}

/** Parameters for neighborhood clustering */
export interface ClusterParams {
  /** Tax year */
  taxYear: number;
  /** Number of clusters to generate (typically 3-8) */
  clusterCount: number;
  /** Features to cluster on */
  features: Array<'medianRatio' | 'cod' | 'medianValue' | 'salesVolume' | 'appealRate'>;
}

/** A neighborhood cluster grouping */
export interface NeighborhoodCluster {
  /** Cluster identifier (0-indexed) */
  clusterId: number;
  /** Descriptive label for the cluster */
  clusterLabel: string;
  /** Neighborhoods assigned to this cluster */
  neighborhoods: Array<{
    /** Neighborhood identifier */
    neighborhoodId: string;
    /** Neighborhood display name */
    neighborhoodName: string;
    /** Distance from cluster centroid (lower = more representative) */
    centroidDistance: number;
  }>;
  /** Cluster centroid values for each feature */
  centroid: Record<string, number>;
  /** Number of neighborhoods in this cluster */
  memberCount: number;
  /** Cluster assessment characterization */
  characterization: string;
}

// ============================================================================
// API
// ============================================================================

const BASE_URL = '/api/forge/advanced-analytics';

/**
 * Fetch multi-year ratio trend data for sparkline chart visualization.
 * Returns time series of median ratio, COD, and sales count per year.
 * @param neighborhood - Neighborhood identifier to analyze
 * @param years - Number of historical years to include (e.g. 5, 10)
 * @returns Sparkline data with trend analysis
 */
export async function fetchRatioTrendSparklines(
  neighborhood: string,
  years: number
): Promise<SparklineData> {
  const params = new URLSearchParams({
    neighborhood,
    years: String(years),
  });
  const response = await fetch(`${BASE_URL}/ratio-trends?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ratio trend sparklines for ${neighborhood}: ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Fetch assessment value forecast with confidence intervals for an area.
 * Uses historical trends to project future median assessed values.
 * @param area - Area or neighborhood identifier to forecast
 * @returns Value forecast with 80% and 95% confidence intervals
 */
export async function fetchValueForecast(area: string): Promise<ValueForecast> {
  const response = await fetch(
    `${BASE_URL}/value-forecast/${encodeURIComponent(area)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch value forecast for area ${area}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Perform advanced statistical outlier detection on assessment ratios.
 * Supports IQR, Z-score, and modified Z-score methods with configurable
 * sensitivity thresholds.
 * @param params - Outlier analysis parameters
 * @returns Outlier analysis result with cleaned population statistics
 */
export async function fetchOutlierAnalysis(
  params: OutlierAnalysisParams
): Promise<OutlierAnalysis> {
  const response = await fetch(`${BASE_URL}/outlier-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Failed to perform outlier analysis: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Cluster neighborhoods by assessment characteristics using k-means
 * or similar unsupervised learning. Groups neighborhoods with similar
 * ratio profiles, value distributions, and assessment quality metrics.
 * @param params - Clustering parameters including feature selection
 * @returns Array of neighborhood clusters with centroid descriptions
 */
export async function fetchNeighborhoodClusters(
  params: ClusterParams
): Promise<NeighborhoodCluster[]> {
  const response = await fetch(`${BASE_URL}/neighborhood-clusters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch neighborhood clusters: ${response.statusText}`);
  }
  return response.json();
}

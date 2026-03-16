/**
 * ======================================================================
 * TERRAFUSION OS — FORGE REGRESSION FIXTURES
 * Phase 16B: Regression Studio Authoring
 *
 * Typed fixture data for regression models, coefficients, run history,
 * version comparison, and variable definitions.
 * Benton County WA residential assessment patterns.
 * ======================================================================
 */

// ============================================================================
// Types
// ============================================================================

export interface RegressionCoefficient {
  variable: string;
  estimate: number;
  stdError: number;
  tStat: number;
  pValue: number;
  significant: boolean;
  vif?: number;
}

export interface RegressionModelRecord {
  id: string;
  name: string;
  modelType: 'OLS' | 'GWR' | 'Quantile';
  version: number;
  status: 'draft' | 'validated' | 'production';
  createdAt: string;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  mse: number;
  aic: number;
  bic: number;
  observations: number;
  variables: string[];
  coefficients: RegressionCoefficient[];
  qualificationPass: boolean;
}

export interface RegressionRunRecord {
  id: string;
  modelId: string;
  modelType: 'OLS' | 'GWR' | 'Quantile';
  rSquared: number;
  adjustedRSquared: number;
  timestamp: string;
  variables: string[];
  status: 'completed' | 'failed';
}

export interface ModelVersionComparison {
  modelA: { id: string; name: string; version: number; record: RegressionModelRecord };
  modelB: { id: string; name: string; version: number; record: RegressionModelRecord };
  coefficientDeltas: Array<{
    variable: string;
    estimateA: number;
    estimateB: number;
    delta: number;
    significantA: boolean;
    significantB: boolean;
    signChange: boolean;
  }>;
  metricDeltas: {
    rSquared: number;
    adjustedRSquared: number;
    aic: number;
    bic: number;
    mse: number;
  };
  improved: string[];
  degraded: string[];
}

export interface RegressionVariable {
  id: string;
  name: string;
  category: 'Physical' | 'Quality' | 'Location' | 'Amenity';
  selected: boolean;
  description?: string;
}

// ============================================================================
// Fixture Data
// ============================================================================

const SFR_BASE_V1_COEFFICIENTS: RegressionCoefficient[] = [
  { variable: 'sqft', estimate: 78.2, stdError: 3.1, tStat: 25.23, pValue: 0.0001, significant: true, vif: 1.8 },
  { variable: 'lot_size', estimate: 11.4, stdError: 2.8, tStat: 4.07, pValue: 0.0001, significant: true, vif: 1.3 },
  { variable: 'year_built', estimate: 385.0, stdError: 98.2, tStat: 3.92, pValue: 0.0001, significant: true, vif: 1.5 },
  { variable: 'quality_grade', estimate: 18500, stdError: 1240, tStat: 14.92, pValue: 0.0001, significant: true, vif: 2.1 },
  { variable: 'neighborhood', estimate: 12800, stdError: 3200, tStat: 4.00, pValue: 0.0001, significant: true, vif: 1.6 },
  { variable: 'condition', estimate: 7200, stdError: 1850, tStat: 3.89, pValue: 0.0001, significant: true, vif: 1.4 },
];

const SFR_BASE_V2_COEFFICIENTS: RegressionCoefficient[] = [
  { variable: 'sqft', estimate: 85.4, stdError: 2.9, tStat: 29.45, pValue: 0.0001, significant: true, vif: 1.7 },
  { variable: 'lot_size', estimate: 12.3, stdError: 2.5, tStat: 4.92, pValue: 0.0001, significant: true, vif: 1.2 },
  { variable: 'year_built', estimate: 450.2, stdError: 88.5, tStat: 5.09, pValue: 0.0001, significant: true, vif: 1.4 },
  { variable: 'quality_grade', estimate: 22000, stdError: 1100, tStat: 20.00, pValue: 0.0001, significant: true, vif: 1.9 },
  { variable: 'neighborhood', estimate: 15400, stdError: 2800, tStat: 5.50, pValue: 0.0001, significant: true, vif: 1.5 },
  { variable: 'condition', estimate: 8900, stdError: 1650, tStat: 5.39, pValue: 0.0001, significant: true, vif: 1.3 },
];

const COMMERCIAL_GWR_COEFFICIENTS: RegressionCoefficient[] = [
  { variable: 'sqft', estimate: 62.8, stdError: 4.5, tStat: 13.96, pValue: 0.0001, significant: true, vif: 2.0 },
  { variable: 'lot_size', estimate: 8.7, stdError: 3.2, tStat: 2.72, pValue: 0.0067, significant: true, vif: 1.5 },
  { variable: 'year_built', estimate: 280.5, stdError: 112.0, tStat: 2.50, pValue: 0.0124, significant: true, vif: 1.6 },
  { variable: 'quality_grade', estimate: 31200, stdError: 2100, tStat: 14.86, pValue: 0.0001, significant: true, vif: 2.4 },
  { variable: 'neighborhood', estimate: 22500, stdError: 4100, tStat: 5.49, pValue: 0.0001, significant: true, vif: 1.8 },
  { variable: 'condition', estimate: 5400, stdError: 2300, tStat: 2.35, pValue: 0.0190, significant: true, vif: 1.3 },
  { variable: 'dist_cbd', estimate: -1850, stdError: 420, tStat: -4.40, pValue: 0.0001, significant: true, vif: 1.4 },
  { variable: 'view', estimate: 14200, stdError: 6800, tStat: 2.09, pValue: 0.0370, significant: true, vif: 1.1 },
];

const MFR_QUANTILE_COEFFICIENTS: RegressionCoefficient[] = [
  { variable: 'sqft', estimate: 55.1, stdError: 5.8, tStat: 9.50, pValue: 0.0001, significant: true, vif: 1.9 },
  { variable: 'lot_size', estimate: 6.2, stdError: 3.9, tStat: 1.59, pValue: 0.1120, significant: false, vif: 1.4 },
  { variable: 'year_built', estimate: 195.0, stdError: 125.0, tStat: 1.56, pValue: 0.1190, significant: false, vif: 1.7 },
  { variable: 'quality_grade', estimate: 16800, stdError: 1900, tStat: 8.84, pValue: 0.0001, significant: true, vif: 2.2 },
  { variable: 'bedrooms', estimate: 8500, stdError: 3200, tStat: 2.66, pValue: 0.0080, significant: true, vif: 1.6 },
];

const SFR_BASE_V1: RegressionModelRecord = {
  id: 'm1-v1',
  name: 'SFR Base Model',
  modelType: 'OLS',
  version: 1,
  status: 'validated',
  createdAt: '2026-02-15',
  rSquared: 0.8501,
  adjustedRSquared: 0.8487,
  fStatistic: 312.4,
  mse: 1842000000,
  aic: 24580,
  bic: 24620,
  observations: 1847,
  variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'neighborhood', 'condition'],
  coefficients: SFR_BASE_V1_COEFFICIENTS,
  qualificationPass: true,
};

const SFR_BASE_V2: RegressionModelRecord = {
  id: 'm1-v2',
  name: 'SFR Base Model',
  modelType: 'OLS',
  version: 2,
  status: 'production',
  createdAt: '2026-03-10',
  rSquared: 0.8742,
  adjustedRSquared: 0.8730,
  fStatistic: 378.9,
  mse: 1564000000,
  aic: 24320,
  bic: 24360,
  observations: 1847,
  variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'neighborhood', 'condition'],
  coefficients: SFR_BASE_V2_COEFFICIENTS,
  qualificationPass: true,
};

const COMMERCIAL_GWR: RegressionModelRecord = {
  id: 'm2',
  name: 'Commercial GWR',
  modelType: 'GWR',
  version: 1,
  status: 'validated',
  createdAt: '2026-03-01',
  rSquared: 0.9103,
  adjustedRSquared: 0.9085,
  fStatistic: 458.2,
  mse: 2105000000,
  aic: 18940,
  bic: 18995,
  observations: 892,
  variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'neighborhood', 'condition', 'dist_cbd', 'view'],
  coefficients: COMMERCIAL_GWR_COEFFICIENTS,
  qualificationPass: true,
};

const MFR_QUANTILE: RegressionModelRecord = {
  id: 'm3',
  name: 'Multi-Family Quantile',
  modelType: 'Quantile',
  version: 1,
  status: 'draft',
  createdAt: '2026-03-10',
  rSquared: 0.8321,
  adjustedRSquared: 0.8295,
  fStatistic: 198.7,
  mse: 2580000000,
  aic: 12450,
  bic: 12480,
  observations: 534,
  variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'bedrooms'],
  coefficients: MFR_QUANTILE_COEFFICIENTS,
  qualificationPass: false,
};

// --- Exports ---

export const REGRESSION_MODELS: RegressionModelRecord[] = [SFR_BASE_V2, COMMERCIAL_GWR, MFR_QUANTILE];

export const REGRESSION_MODELS_WITH_HISTORY: RegressionModelRecord[] = [SFR_BASE_V1, SFR_BASE_V2, COMMERCIAL_GWR, MFR_QUANTILE];

export const REGRESSION_RUNS: RegressionRunRecord[] = [
  { id: 'r1', modelId: 'm1-v2', modelType: 'OLS', rSquared: 0.8742, adjustedRSquared: 0.8730, timestamp: '2026-03-14 14:30', variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'neighborhood', 'condition'], status: 'completed' },
  { id: 'r2', modelId: 'm2', modelType: 'GWR', rSquared: 0.9103, adjustedRSquared: 0.9085, timestamp: '2026-03-14 10:15', variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'neighborhood', 'condition', 'dist_cbd', 'view'], status: 'completed' },
  { id: 'r3', modelId: 'm1-v1', modelType: 'OLS', rSquared: 0.8501, adjustedRSquared: 0.8487, timestamp: '2026-03-13 16:45', variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'neighborhood', 'condition'], status: 'completed' },
  { id: 'r4', modelId: 'm3', modelType: 'Quantile', rSquared: 0.8321, adjustedRSquared: 0.8295, timestamp: '2026-03-12 09:00', variables: ['sqft', 'lot_size', 'year_built', 'quality_grade', 'bedrooms'], status: 'completed' },
  { id: 'r5', modelId: 'm3', modelType: 'Quantile', rSquared: 0, adjustedRSquared: 0, timestamp: '2026-03-11 15:20', variables: ['sqft'], status: 'failed' },
];

export const REGRESSION_VARIABLES: RegressionVariable[] = [
  { id: 'sqft', name: 'Square Footage', category: 'Physical', selected: true, description: 'Total heated living area' },
  { id: 'lot_size', name: 'Lot Size', category: 'Physical', selected: true, description: 'Total lot area in sq ft' },
  { id: 'bedrooms', name: 'Bedrooms', category: 'Physical', selected: false, description: 'Number of bedrooms' },
  { id: 'bathrooms', name: 'Bathrooms', category: 'Physical', selected: false, description: 'Number of bathrooms' },
  { id: 'year_built', name: 'Year Built', category: 'Physical', selected: true, description: 'Original construction year' },
  { id: 'quality_grade', name: 'Quality Grade', category: 'Quality', selected: true, description: 'Construction quality 1-10' },
  { id: 'condition', name: 'Condition', category: 'Quality', selected: false, description: 'Physical condition rating' },
  { id: 'neighborhood', name: 'Neighborhood', category: 'Location', selected: true, description: 'Assessment neighborhood code' },
  { id: 'dist_cbd', name: 'Distance to CBD', category: 'Location', selected: false, description: 'Miles to central business district' },
  { id: 'garage', name: 'Garage', category: 'Amenity', selected: false, description: 'Garage sq ft' },
  { id: 'pool', name: 'Pool', category: 'Amenity', selected: false, description: 'Pool present (0/1)' },
  { id: 'view', name: 'View', category: 'Amenity', selected: false, description: 'View quality rating' },
];

export const MODEL_VERSION_COMPARISON: ModelVersionComparison = {
  modelA: { id: 'm1-v1', name: 'SFR Base Model', version: 1, record: SFR_BASE_V1 },
  modelB: { id: 'm1-v2', name: 'SFR Base Model', version: 2, record: SFR_BASE_V2 },
  coefficientDeltas: [
    { variable: 'sqft', estimateA: 78.2, estimateB: 85.4, delta: 7.2, significantA: true, significantB: true, signChange: false },
    { variable: 'lot_size', estimateA: 11.4, estimateB: 12.3, delta: 0.9, significantA: true, significantB: true, signChange: false },
    { variable: 'year_built', estimateA: 385.0, estimateB: 450.2, delta: 65.2, significantA: true, significantB: true, signChange: false },
    { variable: 'quality_grade', estimateA: 18500, estimateB: 22000, delta: 3500, significantA: true, significantB: true, signChange: false },
    { variable: 'neighborhood', estimateA: 12800, estimateB: 15400, delta: 2600, significantA: true, significantB: true, signChange: false },
    { variable: 'condition', estimateA: 7200, estimateB: 8900, delta: 1700, significantA: true, significantB: true, signChange: false },
  ],
  metricDeltas: {
    rSquared: 0.0241,
    adjustedRSquared: 0.0243,
    aic: -260,
    bic: -260,
    mse: -278000000,
  },
  improved: ['rSquared', 'adjustedRSquared', 'aic', 'bic', 'mse'],
  degraded: [],
};

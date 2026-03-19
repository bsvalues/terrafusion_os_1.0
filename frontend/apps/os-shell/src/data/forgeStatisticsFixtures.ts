/**
 * ======================================================================
 * TERRAFUSION OS — FORGE STATISTICS FIXTURES
 * Phase 16: Forge Model Ops, Tranche 1 — Statistics & Qualification Spine
 *
 * Typed fixture data for ratio studies, VEI metrics, outlier records,
 * strata results, model comparisons, and qualification metrics.
 * Benton County WA data patterns (Richland, Kennewick, Pasco, etc.)
 *
 * Reuses types from:
 *   - services/forge/ratioAnalysisService.ts (RatioStudyResult, RatioStudyParams, OutlierMethod)
 *   - services/forge/veiService.ts (StudyPeriod, RatioTier, AppealTier, SampleSize)
 * ======================================================================
 */

import type { RatioStudyParams, RatioStudyResult, OutlierMethod } from '@/services/forge/ratioAnalysisService';

// ============================================================================
// New Types (Phase 16 contracts)
// ============================================================================

export interface QualificationMetrics {
  cod: number;
  prd: number;
  prb: number;
  medianRatio: number;
  tierSlope: number;
  sampleSize: number;
  passCount: number;
  qualified: boolean;
}

export interface StrataResult {
  strataId: string;
  strataLabel: string;
  neighborhood: string;
  propertyType: string;
  sampleSize: number;
  medianRatio: number;
  cod: number;
  prd: number;
  qualified: boolean;
}

export interface OutlierRecord {
  parcelId: string;
  address: string;
  neighborhood: string;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  ratioDeviation: number;
  outlierMethod: 'iqr' | 'trim';
  flagReason: string;
  confidence: number;
  reviewStatus: 'pending' | 'confirmed' | 'dismissed';
}

export interface ModelComparisonResult {
  modelA: { label: string; params: RatioStudyParams; result: RatioStudyResult };
  modelB: { label: string; params: RatioStudyParams; result: RatioStudyResult };
  deltas: {
    cod: number;
    prd: number;
    prb: number;
    medianRatio: number;
    sampleSize: number;
  };
  improvedMetrics: string[];
  degradedMetrics: string[];
}

export interface StudyFilterState {
  taxYear: number;
  salesWindowMonths: number;
  neighborhood: string | null;
  propertyType: string | null;
  outlierMethod: OutlierMethod;
}

// ============================================================================
// Fixture: Ratio Study Result (Benton County 2026)
// ============================================================================

export const RATIO_STUDY_PARAMS: RatioStudyParams = {
  taxYear: 2026,
  salesWindowMonths: 12,
  outlierMethod: 'iqr',
};

export const RATIO_STUDY_RESULT: RatioStudyResult = {
  medianRatio: 0.985,
  meanRatio: 0.991,
  weightedMeanRatio: 0.983,
  cod: 12.4,
  prd: 1.008,
  prb: -0.023,
  cov: 0.156,
  sampleSize: 1847,
  outlierCount: 43,
  tierMedians: { q1: 1.012, q2: 0.993, q3: 0.978, q4: 0.961 },
  tierSlope: 0.012,
  iaaoCompliant: true,
  complianceNotes: [
    'COD 12.4 within 15.0 threshold',
    'PRD 1.008 within 0.98-1.03 range',
    'PRB -0.023 within +/-0.05 range',
  ],
  computedAt: '2026-03-15T14:30:00Z',
  params: RATIO_STUDY_PARAMS,
};

// ============================================================================
// Fixture: COD & PRD Trends
// ============================================================================

export const COD_TREND = [
  { period: 'Q1-2025', cod: 13.8 },
  { period: 'Q2-2025', cod: 13.1 },
  { period: 'Q3-2025', cod: 12.6 },
  { period: 'Q4-2025', cod: 11.9 },
  { period: 'Q1-2026', cod: 12.4 },
  { period: 'Q2-2026', cod: 11.7 },
];

export const PRD_TREND = [
  { period: 'Q1-2025', prd: 1.024 },
  { period: 'Q2-2025', prd: 1.018 },
  { period: 'Q3-2025', prd: 1.012 },
  { period: 'Q4-2025', prd: 1.005 },
  { period: 'Q1-2026', prd: 1.008 },
  { period: 'Q2-2026', prd: 1.003 },
];

// ============================================================================
// Fixture: VEI Metrics & Neighborhoods
// ============================================================================

export const VEI_METRICS = {
  cod: 12.4,
  prd: 1.008,
  prb: -0.023,
  tierSlope: 0.012,
  medianRatio: 0.985,
  sampleSize: 1847,
};

export const NEIGHBORHOODS = [
  { neighborhood: 'Richland', medianRatio: 0.978, cod: 11.2, sampleSize: 523 },
  { neighborhood: 'Kennewick', medianRatio: 0.992, cod: 13.1, sampleSize: 487 },
  { neighborhood: 'Pasco', medianRatio: 1.005, cod: 14.3, sampleSize: 412 },
  { neighborhood: 'West Richland', medianRatio: 0.969, cod: 10.8, sampleSize: 268 },
  { neighborhood: 'Prosser', medianRatio: 1.012, cod: 12.9, sampleSize: 157 },
];

// ============================================================================
// Fixture: Qualification Metrics
// ============================================================================

export const QUALIFICATION_METRICS: QualificationMetrics = {
  cod: 12.4,
  prd: 1.008,
  prb: -0.023,
  medianRatio: 0.985,
  tierSlope: 0.012,
  sampleSize: 1847,
  passCount: 5,
  qualified: true,
};

// ============================================================================
// Fixture: Strata Results (8 strata across neighborhoods x property types)
// ============================================================================

export const STRATA_RESULTS: StrataResult[] = [
  { strataId: 'rich-sfr', strataLabel: 'Richland SFR', neighborhood: 'Richland', propertyType: 'SFR', sampleSize: 412, medianRatio: 0.978, cod: 11.2, prd: 1.005, qualified: true },
  { strataId: 'rich-mfr', strataLabel: 'Richland MFR', neighborhood: 'Richland', propertyType: 'MFR', sampleSize: 111, medianRatio: 0.965, cod: 13.8, prd: 1.012, qualified: true },
  { strataId: 'kenn-sfr', strataLabel: 'Kennewick SFR', neighborhood: 'Kennewick', propertyType: 'SFR', sampleSize: 389, medianRatio: 0.992, cod: 13.1, prd: 1.009, qualified: true },
  { strataId: 'kenn-mfr', strataLabel: 'Kennewick MFR', neighborhood: 'Kennewick', propertyType: 'MFR', sampleSize: 98, medianRatio: 1.003, cod: 14.7, prd: 1.018, qualified: true },
  { strataId: 'pasc-sfr', strataLabel: 'Pasco SFR', neighborhood: 'Pasco', propertyType: 'SFR', sampleSize: 328, medianRatio: 1.005, cod: 14.3, prd: 1.011, qualified: true },
  { strataId: 'pasc-mfr', strataLabel: 'Pasco MFR', neighborhood: 'Pasco', propertyType: 'MFR', sampleSize: 84, medianRatio: 1.021, cod: 15.8, prd: 1.025, qualified: false },
  { strataId: 'wr-sfr', strataLabel: 'West Richland SFR', neighborhood: 'West Richland', propertyType: 'SFR', sampleSize: 218, medianRatio: 0.969, cod: 10.8, prd: 1.003, qualified: true },
  { strataId: 'pros-sfr', strataLabel: 'Prosser SFR', neighborhood: 'Prosser', propertyType: 'SFR', sampleSize: 127, medianRatio: 1.012, cod: 12.9, prd: 1.007, qualified: true },
];

// ============================================================================
// Fixture: Outlier Records (15 flagged parcels)
// ============================================================================

export const OUTLIER_RECORDS: OutlierRecord[] = [
  { parcelId: '1-0529-100-0042', address: '1245 George Washington Way', neighborhood: 'Richland', salePrice: 385000, assessedValue: 298000, ratio: 0.774, ratioDeviation: -0.211, outlierMethod: 'iqr', flagReason: 'ratio < Q1 - 1.5*IQR', confidence: 94, reviewStatus: 'pending' },
  { parcelId: '1-0833-200-0018', address: '502 W Canal Dr', neighborhood: 'Kennewick', salePrice: 212000, assessedValue: 285000, ratio: 1.344, ratioDeviation: 0.359, outlierMethod: 'iqr', flagReason: 'ratio > Q3 + 1.5*IQR', confidence: 97, reviewStatus: 'pending' },
  { parcelId: '1-0422-300-0055', address: '1802 Road 68', neighborhood: 'Pasco', salePrice: 178000, assessedValue: 142000, ratio: 0.798, ratioDeviation: -0.187, outlierMethod: 'iqr', flagReason: 'ratio < Q1 - 1.5*IQR', confidence: 89, reviewStatus: 'pending' },
  { parcelId: '1-0617-100-0091', address: '3456 Jadwin Ave', neighborhood: 'Richland', salePrice: 520000, assessedValue: 688000, ratio: 1.323, ratioDeviation: 0.338, outlierMethod: 'iqr', flagReason: 'ratio > Q3 + 1.5*IQR', confidence: 96, reviewStatus: 'pending' },
  { parcelId: '1-0745-200-0033', address: '901 N Columbia Center Blvd', neighborhood: 'Kennewick', salePrice: 1250000, assessedValue: 872000, ratio: 0.698, ratioDeviation: -0.287, outlierMethod: 'iqr', flagReason: 'ratio < Q1 - 1.5*IQR', confidence: 92, reviewStatus: 'confirmed' },
  { parcelId: '1-0312-400-0077', address: '4520 W Court St', neighborhood: 'Pasco', salePrice: 165000, assessedValue: 231000, ratio: 1.400, ratioDeviation: 0.415, outlierMethod: 'trim', flagReason: 'ratio in top 5% trim', confidence: 88, reviewStatus: 'pending' },
  { parcelId: '1-0529-100-0108', address: '789 Stevens Dr', neighborhood: 'Richland', salePrice: 445000, assessedValue: 338000, ratio: 0.760, ratioDeviation: -0.225, outlierMethod: 'iqr', flagReason: 'ratio < Q1 - 1.5*IQR', confidence: 91, reviewStatus: 'pending' },
  { parcelId: '1-0833-200-0064', address: '2100 W 10th Ave', neighborhood: 'Kennewick', salePrice: 289000, assessedValue: 395000, ratio: 1.367, ratioDeviation: 0.382, outlierMethod: 'iqr', flagReason: 'ratio > Q3 + 1.5*IQR', confidence: 95, reviewStatus: 'dismissed' },
  { parcelId: '1-0422-300-0122', address: '610 N 20th Ave', neighborhood: 'Pasco', salePrice: 198000, assessedValue: 152000, ratio: 0.768, ratioDeviation: -0.217, outlierMethod: 'trim', flagReason: 'ratio in bottom 5% trim', confidence: 86, reviewStatus: 'pending' },
  { parcelId: '1-0961-100-0015', address: '5678 Paradise Way', neighborhood: 'West Richland', salePrice: 675000, assessedValue: 498000, ratio: 0.738, ratioDeviation: -0.247, outlierMethod: 'iqr', flagReason: 'ratio < Q1 - 1.5*IQR', confidence: 93, reviewStatus: 'pending' },
  { parcelId: '1-1055-200-0041', address: '301 6th St', neighborhood: 'Prosser', salePrice: 142000, assessedValue: 198000, ratio: 1.394, ratioDeviation: 0.409, outlierMethod: 'iqr', flagReason: 'ratio > Q3 + 1.5*IQR', confidence: 90, reviewStatus: 'pending' },
  { parcelId: '1-0617-100-0145', address: '2345 Lee Blvd', neighborhood: 'Richland', salePrice: 312000, assessedValue: 242000, ratio: 0.776, ratioDeviation: -0.209, outlierMethod: 'trim', flagReason: 'ratio in bottom 5% trim', confidence: 85, reviewStatus: 'pending' },
  { parcelId: '1-0745-200-0089', address: '1500 S Ely St', neighborhood: 'Kennewick', salePrice: 195000, assessedValue: 268000, ratio: 1.374, ratioDeviation: 0.389, outlierMethod: 'iqr', flagReason: 'ratio > Q3 + 1.5*IQR', confidence: 94, reviewStatus: 'pending' },
  { parcelId: '1-0312-400-0156', address: '820 W Lewis St', neighborhood: 'Pasco', salePrice: 225000, assessedValue: 172000, ratio: 0.764, ratioDeviation: -0.221, outlierMethod: 'iqr', flagReason: 'ratio < Q1 - 1.5*IQR', confidence: 87, reviewStatus: 'confirmed' },
  { parcelId: '1-0961-100-0088', address: '3200 Bombing Range Rd', neighborhood: 'West Richland', salePrice: 428000, assessedValue: 585000, ratio: 1.367, ratioDeviation: 0.382, outlierMethod: 'trim', flagReason: 'ratio in top 5% trim', confidence: 91, reviewStatus: 'pending' },
];

// ============================================================================
// Fixture: Model Comparison (12-month IQR vs 24-month trim)
// ============================================================================

const MODEL_A_PARAMS: RatioStudyParams = {
  taxYear: 2026,
  salesWindowMonths: 12,
  outlierMethod: 'iqr',
};

const MODEL_B_PARAMS: RatioStudyParams = {
  taxYear: 2026,
  salesWindowMonths: 24,
  outlierMethod: 'trim',
};

const MODEL_A_RESULT: RatioStudyResult = {
  ...RATIO_STUDY_RESULT,
  params: MODEL_A_PARAMS,
};

const MODEL_B_RESULT: RatioStudyResult = {
  medianRatio: 0.992,
  meanRatio: 0.998,
  weightedMeanRatio: 0.990,
  cod: 11.8,
  prd: 1.012,
  prb: -0.018,
  cov: 0.148,
  sampleSize: 3412,
  outlierCount: 171,
  tierMedians: { q1: 1.008, q2: 0.996, q3: 0.984, q4: 0.972 },
  tierSlope: 0.009,
  iaaoCompliant: true,
  complianceNotes: [
    'COD 11.8 within 15.0 threshold',
    'PRD 1.012 within 0.98-1.03 range',
    'PRB -0.018 within +/-0.05 range',
  ],
  computedAt: '2026-03-15T14:45:00Z',
  params: MODEL_B_PARAMS,
};

export const MODEL_COMPARISON: ModelComparisonResult = {
  modelA: { label: '12-mo IQR', params: MODEL_A_PARAMS, result: MODEL_A_RESULT },
  modelB: { label: '24-mo Trim', params: MODEL_B_PARAMS, result: MODEL_B_RESULT },
  deltas: {
    cod: MODEL_B_RESULT.cod - MODEL_A_RESULT.cod,       // -0.6
    prd: MODEL_B_RESULT.prd - MODEL_A_RESULT.prd,       // +0.004
    prb: MODEL_B_RESULT.prb - MODEL_A_RESULT.prb,       // +0.005
    medianRatio: MODEL_B_RESULT.medianRatio - MODEL_A_RESULT.medianRatio, // +0.007
    sampleSize: MODEL_B_RESULT.sampleSize - MODEL_A_RESULT.sampleSize,   // +1565
  },
  improvedMetrics: ['cod', 'prb', 'medianRatio'],
  degradedMetrics: ['prd'],
};

// ============================================================================
// Fixture: Default Filter State
// ============================================================================

export const STUDY_FILTER_DEFAULT: StudyFilterState = {
  taxYear: 2026,
  salesWindowMonths: 12,
  neighborhood: null,
  propertyType: null,
  outlierMethod: 'iqr',
};

export const TAX_YEARS = [2026, 2025, 2024, 2023];

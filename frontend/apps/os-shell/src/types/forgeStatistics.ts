import type {
  OutlierMethod,
  RatioStudyParams,
  RatioStudyResult,
} from '@/services/forge/ratioAnalysisService';

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

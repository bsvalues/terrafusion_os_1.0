// TFT-173 — Real estate type definitions

export interface PropertyListing {
  parcelId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string;
  yearBuilt: number;
  squareFeet: number;
  lotSize: number;
  bedrooms: number;
  bathrooms: number;
  assessedValue: number;
  marketValue: number;
  lastSaleDate: string;
  lastSalePrice: number;
  zoning: string;
  neighborhood: string;
  county: string;
}

export interface PropertyValuation {
  parcelId: string;
  costValue: number;
  salesValue: number;
  incomeValue: number;
  reconciledValue: number;
  confidence: number;
  valuationDate: string;
  approachWeights: {
    cost: number;
    sales: number;
    income: number;
  };
}

export interface SalesComp {
  compId: string;
  parcelId: string;
  address: string;
  saleDate: string;
  salePrice: number;
  adjustedPrice: number;
  squareFeet: number;
  yearBuilt: number;
  similarityScore: number;
  adjustments: CompAdjustment[];
  distance: number;
}

export interface CompAdjustment {
  field: string;
  subjectValue: string | number;
  compValue: string | number;
  adjustmentAmount: number;
  adjustmentPercent: number;
}

export interface MarketSegment {
  segmentId: string;
  name: string;
  propertyType: string;
  medianValue: number;
  medianSalePrice: number;
  averageDaysOnMarket: number;
  inventoryCount: number;
  priceChangePercent: number;
  volumeChangePercent: number;
  period: string;
}

export interface NeighborhoodMetrics {
  neighborhoodId: string;
  name: string;
  medianValue: number;
  medianSalePrice: number;
  salesVolume: number;
  priceChangePercent: number;
  averageAge: number;
  totalParcels: number;
  cod: number;
  prd: number;
  trendData: TrendPoint[];
}

export interface TrendPoint {
  date: string;
  value: number;
  volume?: number;
}

export interface HazardRisk {
  parcelId: string;
  floodZone: string;
  floodRisk: RiskLevel;
  wildfireRisk: RiskLevel;
  earthquakeRisk: RiskLevel;
  landslideRisk: RiskLevel;
  overallRisk: RiskLevel;
  lastAssessedDate: string;
  details: HazardDetail[];
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high';

export interface HazardDetail {
  hazardType: string;
  riskLevel: RiskLevel;
  description: string;
  mitigationNotes: string;
}

export interface EconomicIndicator {
  indicatorId: string;
  name: string;
  value: number;
  previousValue: number;
  changePercent: number;
  unit: string;
  period: string;
  source: string;
  category: 'employment' | 'housing' | 'demographic' | 'income';
}

export interface RatioStudyResult {
  cod: number;
  prd: number;
  prb: number;
  medianRatio: number;
  meanRatio: number;
  sampleSize: number;
  period: string;
  withinIAAO: {
    cod: boolean;
    prd: boolean;
    prb: boolean;
  };
}

export interface QualityCheckResult {
  checkId: string;
  field: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CostScheduleEntry {
  code: string;
  description: string;
  qualityClass: string;
  baseCost: number;
  unit: string;
  effectiveDate: string;
}

export interface DepreciationInput {
  age: number;
  effectiveAge: number;
  condition: string;
  qualityClass: string;
  totalLife: number;
}

export interface DepreciationResult {
  physicalDepreciation: number;
  functionalObsolescence: number;
  externalObsolescence: number;
  totalDepreciation: number;
  depreciatedValue: number;
}

export interface IncomeApproachData {
  grossIncome: number;
  vacancyRate: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  netOperatingIncome: number;
  capRate: number;
  grm: number;
  indicatedValue: number;
}

export interface ModelSummary {
  modelId: string;
  name: string;
  propertyType: string;
  rSquared: number;
  adjustedRSquared: number;
  coefficientCount: number;
  sampleSize: number;
  lastTrainedDate: string;
  status: 'active' | 'training' | 'retired';
}

export interface ModelDetail extends ModelSummary {
  coefficients: ModelCoefficient[];
  diagnostics: Record<string, number>;
}

export interface ModelCoefficient {
  variable: string;
  coefficient: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  significant: boolean;
}

export interface MarketCycle {
  phase: 'expansion' | 'peak' | 'contraction' | 'trough';
  confidence: number;
  duration: number;
  indicators: { name: string; signal: string }[];
}

export interface DataQualityScore {
  parcelId: string;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  overallScore: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  checks: QualityCheckResult[];
}

export interface PriceHistoryPoint {
  date: string;
  assessedValue: number;
  marketValue: number;
  salePrice?: number;
}

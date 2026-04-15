/**
 * SalesForge — TypeScript interfaces
 * All types used across the SalesForge module.
 */

// ── Queue list item (from GET /api/terraforge/sale-qualification) ───────────

export interface SaleQueueItem {
  saleId: string;
  parcelId: string | null;
  address: string | null;
  saleDate: string;
  salePrice: number;
  adjustedSalePrice: number | null;
  gla: number | null;
  hood: string | null;
  propertyType: string | null;
  rawSaleQualifier: string | null;
  rawCountyRatioCd: string | null;
  rawWacCd: string | null;
  rawExcludeCalcCd: string | null;
  rawRatioTypeCd: string | null;
  rawSaleTypeCode: string | null;
  rawFinancingCode: string | null;
  rawAdjReason: string | null;
  rawComment: string | null;
  slLivingArea: number | null;
  slYearBuilt: number | null;
  salesYear: number | null;
  qualificationRecommendation: string | null;
  recommendationReason: string | null;
  qualificationDecision: string | null;
  qualificationDecisionBy: string | null;
  qualificationDecisionAt: string | null;
  decisionSource: string | null;
  decisionReason: string | null;
  assessedValue: number | null;
  salesRatio: number | null;
}

export interface SaleQueuePage {
  total: number;
  page: number;
  pageSize: number;
  items: SaleQueueItem[];
}

// ── Full sale detail (from GET /api/terraforge/sale-qualification/{saleId}) ─

export interface SaleDetail extends SaleQueueItem {
  neighborhood: string | null;
  imprvTypeCode: string | null;
  saleAdjustmentAmount: number | null;
  saleExemptionAmount: number | null;
  exciseNumber: number | null;
  pacsChgOfOwnerId: number | null;
  slLandAcres: number | null;
  slLandSqft: number | null;
  lotSizeSqft: number | null;
  yearBuilt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  condition: string | null;
  qualityGrade: string | null;
  rawRatioCd: string | null;
  rawRatioCdReason: string | null;
  rawAdjCode: string | null;
  suppressOnRatioRptCd: string | null;
  suppressOnRatioReason: string | null;
  includeNoCalc: boolean | null;
  landOnlySale: boolean | null;
  continueCurrentUse: boolean | null;
  recommendationSource: string | null;
  recommendationVersion: string | null;
  decisionBy: string | null;
  decisionAt: string | null;
  ingestedAt: string | null;
  ingestedBy: string | null;
}

// ── Running stats (from GET /api/terraforge/sale-qualification/running-stats) ─

export interface RunningStats {
  taxYear: number;
  filters: { hood: string | null; propertyType: string | null };
  counts: {
    total: number;
    qualified: number;
    nonQualified: number;
    pending: number;
    withRatio: number;
  };
  stats: {
    medianRatio: number | null;
    meanRatio: number | null;
    weightedMeanRatio: number | null;
    cod: number | null;
    prd: number | null;
    prb: number | null;
  };
  iaaoCompliant: {
    median: boolean;
    cod: boolean;
    prd: boolean;
    prb: boolean;
  };
}

// ── Neighborhood stats ────────────────────────────────────────────────────────

export interface HoodStat {
  hood: string;
  totalCount: number;
  qualifiedCount: number;
  pendingCount: number;
  nonQualCount: number;
  medianRatio: number | null;
  cod: number | null;
}

export interface NeighborhoodStats {
  taxYear: number;
  propertyType: string | null;
  hoods: HoodStat[];
  hoodDataGap: boolean;
  hoodDataGapAlert: string | null;
}

// ── Code audit ────────────────────────────────────────────────────────────────

export interface CodeAudit {
  taxYear: number;
  totalSales: number;
  dataQualityAlert: string | null;
  wacCdBreakdown: { wacCd: string | null; description: string; count: number; isDataGap: boolean }[];
  saleQualifierBreakdown: { code: string; count: number }[];
  countyRatioBreakdown: { code: string; count: number }[];
  ratioTypeBreakdown: { code: string; count: number }[];
  excludeCalcBreakdown: { code: string; count: number }[];
}

// ── Filter forms ──────────────────────────────────────────────────────────────

export interface FilterForm {
  hood: string;
  propertyType: string;
  saleDateFrom: string;
  saleDateTo: string;
  minPrice: string;
  maxPrice: string;
}

export interface CommittedFilters {
  hood: string | null;
  propertyType: string | null;
  saleDateFrom: string | null;
  saleDateTo: string | null;
  minPrice: number | null;
  maxPrice: number | null;
}

export const EMPTY_FILTER_FORM: FilterForm = {
  hood: '',
  propertyType: '',
  saleDateFrom: '',
  saleDateTo: '',
  minPrice: '',
  maxPrice: '',
};

export const EMPTY_COMMITTED: CommittedFilters = {
  hood: null,
  propertyType: null,
  saleDateFrom: null,
  saleDateTo: null,
  minPrice: null,
  maxPrice: null,
};

// ── Patch state ───────────────────────────────────────────────────────────────

export type PatchStatus = 'working' | 'done' | 'error';

export type QueueTab = 'all' | 'pending' | 'staff' | 'final';

export type SalesForgeTab = 'queue' | 'ratio-audit' | 'neighborhoods' | 'code-audit' | 'dor-export';

export const SALESFORGE_TAX_YEAR = new Date().getFullYear();
export const QUEUE_PAGE_SIZE = 50;

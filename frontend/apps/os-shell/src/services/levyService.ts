/**
 * Levy Service — governed TerraLevy HTTP client.
 *
 * This file only wraps backend routes. It does not fabricate levy records,
 * district risk rows, or recommendation content on the client.
 *
 * Backend surfaces used here:
 * - `/api/levy-calculation/*` for calculation/history compatibility routes
 * - `/api/levy/v1/*` for canonical levy reference/data-quality routes
 * - `/api/levy/certifications/*` for certification workflow
 */
import api from './api';

// ── Shared helpers ──────────────────────────────────────────────────────────

type RecommendationPriority = 'high' | 'medium' | 'low';
export type RiskFlag = 'critical' | 'warn' | 'ok';

function hasRequestBody(value: object | undefined): boolean {
  return value != null && Object.keys(value).length > 0;
}

function deriveLimitFactor(ipdPercent: number | null): number | null {
  if (ipdPercent == null || !Number.isFinite(ipdPercent)) {
    return null;
  }

  return Math.min(1.01, 1 + ipdPercent / 100);
}

function normalizeRecommendationPriority(severity?: string): RecommendationPriority {
  const normalized = severity?.toLowerCase() ?? '';
  if (normalized === 'critical' || normalized === 'error' || normalized === 'high') {
    return 'high';
  }
  if (normalized === 'warn' || normalized === 'warning' || normalized === 'medium') {
    return 'medium';
  }
  return 'low';
}

// ── Calculation / certification contracts ──────────────────────────────────

export interface LevyMeasureRequest {
  districtId: string;
  districtName: string;
  assessedValue: number;
  budgetAmount: number;
  districtType: string;
  measureType: string;
  countyCode: string;
}

export interface LevyCalculationResult {
  taxLevyId?: string;
  districtId: string;
  districtName: string;
  baseRate: number;
  aiOptimalRate: number;
  confidenceScore: number;
  statutoryLimit: number;
  isCompliant: boolean;
  projectedRevenue: number;
  riskLevel: string;
  warnings: string[];
  calculationTimestamp: string;
  /** Legacy DTO field — backend tuning multiplier, not quantum computation. */
  quantumFactor: number;
  /** Legacy DTO field — backend tuning strategy name. */
  optimizationMethod: string;
}

export interface LevyHistoryEntry {
  taxLevyId: string;
  countyId: string;
  taxingDistrict: string;
  taxRate: number;
  levyAmount: number;
  taxYear: number;
  purpose: string;
  effectiveDate: string;
}

export interface TaxingDistrict {
  code: string;
  name: string;
  type: string;
  statutoryLimitPerThousand: number;
  rcwReference: string;
  isVoted: boolean;
}

export interface StatutoryLimit {
  districtType: string;
  limitPerThousandAV: number;
  rcwReference: string;
  notes: string;
}

export interface CertificationStep {
  stepNumber: number;
  name: string;
  description: string;
  responsibleParty: string;
  rcwReference: string;
}

export interface HighestLawfulLevyRequest {
  priorYearLevy: number;
  priorAssessedValue: number;
  currentAssessedValue: number;
  newConstructionValue?: number;
  annexationValue?: number;
  lidLiftAmount?: number;
  /**
   * Frontend fields already used by TerraLevy. Extra JSON members are ignored
   * by the current backend until the expanded HLL contract is implemented.
   */
  bankedCapacityToUse?: number;
  voterApprovedLidLift?: boolean;
  isFirstTimeLevy?: boolean;
  firstTimeLevyRequestedRate?: number;
  seniorExemptionFreezeAv?: number;
  refundFundAmount?: number;
}

export interface HighestLawfulLevyResult {
  priorYearLevy: number;
  limitFactor: number;
  baseHighestLawful: number;
  newConstructionComponent: number;
  annexationComponent: number;
  highestLawfulLevy: number;
  lidLiftApplied: boolean;
  effectiveLevy: number;
  effectiveRate: number;
  statutoryReference: string;
}

export interface LevyCertificationItem {
  id: number;
  districtCode: string;
  districtName: string;
  taxYear: number;
  status: string;
  leviedAmount: number;
  levyRate: number;
  assessedValue: number;
  withinConstitutionalLimit: boolean;
  withinAggregateLimit: boolean;
  wasReduced: boolean;
  reviewedBy: string;
  createdAt: string;
}

export interface LevyCertificationListResponse {
  taxYear: number;
  totalDistricts: number;
  certifiedCount: number;
  readyForDor: number;
  source: string;
  items: LevyCertificationItem[];
}

export interface LevyCertificationUpsertRequest {
  districtCode: string;
  districtName?: string;
  taxYear: number;
  status?: string;
  leviedAmount?: number;
  levyRate?: number;
  assessedValue?: number;
  reviewedBy?: string;
  notes?: string;
}

export interface BentonDistrictsEnvelope {
  source: string;
  fiscalYear: string;
  districts: TaxingDistrict[];
  count: number;
}

export interface StatutoryLimitsEnvelope {
  source: string;
  constitutionalLimit: number;
  constitutionalLimitNote: string;
  limits: StatutoryLimit[];
  count: number;
}

export interface CertificationStepsEnvelope {
  source: string;
  description: string;
  steps: CertificationStep[];
  count: number;
}

export interface LevyDashboardBudgetSummary {
  taxYear: number;
  source: string;
  specialistGated: boolean;
  specialistGateNote: string;
  categories: unknown[];
  count: number;
}

export interface LevyDashboardMetrics {
  taxYear: number;
  totalLevies: number;
  totalLevyAmount: number;
  averageLevyRate: number;
  certifiedRate: number;
  source: string;
  countyId?: string | null;
}

export interface LevyDashboardDistrictOverview {
  districtId: string;
  districtCode: string;
  districtName: string;
  districtType: string;
  levyMeasureId: string;
  levyMeasureName: string;
  rate: number;
  assessedValue: number;
  levyAmount: number;
  aiOptimalRate: number | null;
  confidenceScore: number | null;
  effectiveDate: string;
  expirationDate: string | null;
  certificationStatus: string;
  isCertified: boolean;
  parcelCount: number;
  totalAssessedValue: number;
  statutoryLimit: number;
  utilizationPct: number;
  priorYearRate: number;
  yoyDelta: number;
  countyId: string;
}

export interface LevyDashboardDistrictOverviewResponse {
  taxYear: number;
  source: string;
  generatedAt: string;
  districts: LevyDashboardDistrictOverview[];
}

export interface BudgetScenarioRecord {
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  levyMeasureId: string;
  levyMeasureName: string;
  levyYear: number;
  countyId: string;
  assessedValue: number;
  levyRate: number;
  calculatedAmount: number;
  projectedRevenue: number;
  collectionRate: number;
  isActive: boolean;
  confidenceScore: number | null;
  quantumOptimized: boolean;
  createdAt: string;
}

export interface BudgetScenarioEnvelope {
  taxYear: number;
  source: string;
  generatedAt: string;
  scenarios: BudgetScenarioRecord[];
  count: number;
}

export interface BudgetProjectionRecord {
  scenarioId: string;
  scenarioName: string;
  fiscalYear: number;
  projectedAssessedValue: number;
  projectedLevyAmount: number;
  projectedCollectionRate: number;
  projectedNetRevenue: number;
  growthRate: number;
  confidenceLevel: number | null;
}

export interface BudgetVisualizationSummary {
  totalProjectedRevenue: number;
  averageCollectionRate: number;
  averageGrowthRate: number;
  fiscalYears: number[];
}

export interface BudgetVisualizationEnvelope {
  taxYear: number;
  source: string;
  generatedAt: string;
  projections: BudgetProjectionRecord[];
  count: number;
  summary: BudgetVisualizationSummary;
}

// ── Data quality / risk contracts ──────────────────────────────────────────

export interface DataQualityAnalysisRequest {
  overallScore?: number;
  completenessScore?: number;
  accuracyScore?: number;
  consistencyScore?: number;
  timelinessScore?: number;
  completenessFieldsMissing?: number;
  accuracyErrors?: number;
  consistencyIssues?: number;
}

export interface DataQualityAnalysisResult {
  success: boolean;
  score: number;
  generatedAt: string;
  assumptions: string[];
}

export interface AiRecommendationsRequest {
  focusArea?: string;
  maxRecommendations?: number;
}

type AiRecommendationApi = {
  title: string;
  description: string;
  focusArea: string;
  severity: string;
  action?: string | null;
};

export interface AiRecommendation extends AiRecommendationApi {
  priority: RecommendationPriority;
  affectedArea: string | null;
}

type AiRecommendationsResultApi = {
  success: boolean;
  error?: string | null;
  recommendations: AiRecommendationApi[];
  source: string;
};

export interface AiRecommendationsResult {
  success: boolean;
  error?: string | null;
  recommendations: AiRecommendation[];
  source: string;
}

export interface RealtimeMetricsResult {
  success: boolean;
  metrics: Record<string, number>;
  timestamp: string;
  source: string;
}

export interface BankedCapacityEntry {
  id: string;
  districtCode: string;
  taxYear: number;
  openingBalance: number;
  accruedThisYear: number;
  usedThisYear: number;
  closingBalance: number;
  isActive: boolean;
  certificationId: string | null;
  source: string;
  rcwReference: string;
}

export interface BankedCapacityResponse {
  districtCode: string;
  taxYear: number;
  availableCapacity: number;
  ledgerEntry: BankedCapacityEntry | null;
  specialistGated: boolean;
  specialistGateNote: string | null;
  source: string;
  rcwReference: string;
}

export interface DistrictLevyEntry {
  districtName: string;
  districtType: string;
  rate: number;
}

export interface AggregateLimitRequest {
  districtLevies: DistrictLevyEntry[];
}

export interface AggregateLimitResult {
  tier1Sum: number;
  tier1Limit: number;
  tier1Compliant: boolean;
  tier2Sum: number;
  tier2Limit: number;
  tier2Compliant: boolean;
  overallCompliant: boolean;
  prorationRequired: boolean;
  prorationNote: string;
  statutoryReference: string;
}

export interface DistrictRiskRecord {
  districtId: string;
  districtCode: string;
  districtName: string;
  riskFlag: RiskFlag;
  riskReasons: string[];
  confidence: number;
  currentRate: number;
  statutoryLimit: number;
  utilizationPct: number;
  priorYearRate: number;
  yoyDelta: number;
  certificationStatus: string;
  computedAt?: string;
  computedFrom?: string;
}

export interface DistrictRiskSummaryResponse {
  success: boolean;
  error?: string | null;
  districts: DistrictRiskRecord[];
  taxYear: number;
  generatedAt: string;
  provenanceNote: string;
}

// ── Reference / compliance contracts ───────────────────────────────────────

type IpdAnnualRateApi = {
  year: number;
  ipdPercent: number | null;
  sourceNote: string | null;
  publishedDate: string | null;
  importedBy: string | null;
  importedAt: string | null;
};

export interface IpdAnnualRate extends IpdAnnualRateApi {
  /** Client-derived convenience field from RCW 84.55.005 formula. */
  limitFactor: number | null;
}

type IpdRatesEnvelopeApi = {
  source: string;
  description: string;
  specialistGated: boolean;
  specialistGateNote: string | null;
  rates: IpdAnnualRateApi[];
  count: number;
  rcwReference: string;
};

export interface IpdRatesEnvelope {
  source: string;
  description: string;
  specialistGated: boolean;
  specialistGateNote: string | null;
  rates: IpdAnnualRate[];
  count: number;
  rcwReference: string;
}

export interface LidLift {
  districtId: string;
  districtName: string;
  propositionNumber: string;
  voterApprovedRate: number;
  effectiveYear: number;
  expiresYear: number | null;
  isPermanent: boolean;
  electionDate: string;
  ballotTitle: string | null;
}

export interface LidLiftsEnvelope {
  source: string;
  specialistGated: boolean;
  specialistGateNote: string | null;
  lidLifts: LidLift[];
  count: number;
  rcwReference: string;
}

export interface StateSchoolLevyPart {
  part: string;
  ratePerThousandAV: number | null;
  levyYear: number | null;
  rcwReference: string;
  description: string;
  sourceNote: string | null;
}

export interface StateSchoolEnvelope {
  source: string;
  specialistGated: boolean;
  specialistGateNote: string | null;
  parts: StateSchoolLevyPart[];
  count: number;
}

export interface RefundFund {
  districtId: string | null;
  districtName: string | null;
  refundAmount: number | null;
  levyYear: number | null;
  reason: string | null;
}

export interface RefundFundEnvelope {
  source: string;
  description: string;
  outsideAggregateCap: boolean;
  specialistGated: boolean;
  specialistGateNote: string | null;
  refunds: RefundFund[];
  count: number;
  rcwReference: string;
}

export interface TaxCodeArea {
  taxAreaNumber: string;
  description: string | null;
  taxAreaId: string | null;
}

export interface TaxCodeAreasEnvelope {
  source: string;
  taxCodeAreas: TaxCodeArea[];
  count: number;
  annexationModelingDeferred: boolean;
  deferralNote: string;
  rcwReference: string;
}

export interface RetentionPolicy {
  recordType: string;
  retentionClass: string;
  minimumRetentionYears: number;
  authority: string;
  disposition: string;
}

export interface RetentionPolicyEnvelope {
  source: string;
  policies: RetentionPolicy[];
  count: number;
  perRecordStampingDeferred: boolean;
  deferralNote: string;
  rcwReference: string;
}

export interface AttestationRequest {
  subject: string;
  payload: unknown;
}

export interface AttestationEnvelope {
  algorithm: string;
  payloadHash: string;
  subject: string;
  signer: string;
  correlationId: string;
  attestedAt: string;
  persistenceDeferred: boolean;
  persistenceNote: string | null;
}

// ── Public portal contract ─────────────────────────────────────────────────

export interface PublicTaxEstimate {
  assessedValue: number;
  districtCode: string;
  districtName: string;
  ratePerThousandAV: number;
  estimatedAnnualTax: number;
  estimateMethod: string;
  disclaimer: string;
}

// ── Calculation / certification calls ──────────────────────────────────────

export async function calculateLevyRate(
  request: LevyMeasureRequest,
): Promise<LevyCalculationResult> {
  const res = await api.post<LevyCalculationResult>(
    '/levy-calculation/calculate-rate',
    request,
  );
  return res.data;
}

export async function getLevyHistory(params?: {
  taxYear?: number;
  districtId?: string;
}): Promise<LevyHistoryEntry[]> {
  const res = await api.get<LevyHistoryEntry[]>('/levy-calculation/history', {
    params,
  });
  return res.data;
}

export async function getBentonTaxingDistricts(): Promise<BentonDistrictsEnvelope> {
  const res = await api.get<BentonDistrictsEnvelope>(
    '/levy-calculation/benton/taxing-districts',
  );
  return res.data;
}

export async function getStatutoryLimits(): Promise<StatutoryLimitsEnvelope> {
  const res = await api.get<StatutoryLimitsEnvelope>(
    '/levy-calculation/statutory-limits',
  );
  return res.data;
}

export async function getCertificationSteps(): Promise<CertificationStepsEnvelope> {
  const res = await api.get<CertificationStepsEnvelope>(
    '/levy-calculation/benton/levy-certification-steps',
  );
  return res.data;
}

export async function getLevyDashboardSummary(params?: {
  year?: number;
  countyId?: string;
}): Promise<LevyDashboardBudgetSummary> {
  const res = await api.get<LevyDashboardBudgetSummary>('/levy/dashboard/summary', {
    params,
  });
  return res.data;
}

export async function getLevyDashboardMetrics(params?: {
  year?: number;
  countyId?: string;
}): Promise<LevyDashboardMetrics> {
  const res = await api.get<LevyDashboardMetrics>('/levy/dashboard/metrics', {
    params,
  });
  return res.data;
}

export async function getLevyDistrictOverview(params?: {
  year?: number;
  countyId?: string;
}): Promise<LevyDashboardDistrictOverviewResponse> {
  const res = await api.get<LevyDashboardDistrictOverviewResponse>(
    '/levy/dashboard/districts-overview',
    { params },
  );
  return res.data;
}

export async function getBudgetScenarios(params?: {
  year?: number;
  countyId?: string;
}): Promise<BudgetScenarioEnvelope> {
  const res = await api.get<BudgetScenarioEnvelope>('/levy/budget/scenarios', {
    params,
  });
  return res.data;
}

export async function getBudgetVisualization(params?: {
  scenarioId?: string;
  year?: number;
  countyId?: string;
}): Promise<BudgetVisualizationEnvelope> {
  const res = await api.get<BudgetVisualizationEnvelope>('/levy/budget/visualization', {
    params,
  });
  return res.data;
}

export async function calculateHighestLawfulLevy(
  request: HighestLawfulLevyRequest,
): Promise<HighestLawfulLevyResult> {
  const res = await api.post<HighestLawfulLevyResult>(
    '/levy-calculation/highest-lawful-levy',
    request,
  );
  return res.data;
}

export async function checkAggregateLimits(
  request: AggregateLimitRequest,
): Promise<AggregateLimitResult> {
  const res = await api.post<AggregateLimitResult>('/levy/v1/aggregate-check', request);
  return res.data;
}

export async function getCertifications(year?: number): Promise<LevyCertificationListResponse> {
  const res = await api.get<LevyCertificationListResponse>('/levy/certifications', {
    params: year != null ? { year } : undefined,
  });
  return res.data;
}

export async function upsertCertification(
  request: LevyCertificationUpsertRequest,
): Promise<LevyCertificationItem> {
  const res = await api.post<LevyCertificationItem>('/levy/certifications', request);
  return res.data;
}

export function certificationExportUrl(year?: number): string {
  const baseUrl =
    typeof api.defaults.baseURL === 'string' && api.defaults.baseURL.length > 0
      ? api.defaults.baseURL
      : '/api';
  const query = year != null ? `?year=${encodeURIComponent(String(year))}` : '';
  return `${baseUrl}/levy/certifications/export${query}`;
}

export async function getBankedCapacity(
  districtCode: string,
  year?: number,
): Promise<BankedCapacityResponse> {
  const res = await api.get<BankedCapacityResponse>('/levy/v1/banked-capacity', {
    params: {
      districtCode,
      ...(year != null ? { year } : {}),
    },
  });
  return res.data;
}

// ── Data quality / risk calls ──────────────────────────────────────────────

function mapAiRecommendation(rec: AiRecommendationApi): AiRecommendation {
  return {
    ...rec,
    priority: normalizeRecommendationPriority(rec.severity),
    affectedArea: rec.focusArea ?? null,
  };
}

export async function analyzeDataQuality(
  request: DataQualityAnalysisRequest = {},
): Promise<DataQualityAnalysisResult> {
  const res = await api.post<DataQualityAnalysisResult>(
    '/levy/v1/data-quality/analyze',
    request,
  );
  return res.data;
}

export async function getDataQualityRecommendations(
  request?: AiRecommendationsRequest,
): Promise<AiRecommendationsResult> {
  const response = hasRequestBody(request)
    ? await api.post<AiRecommendationsResultApi>(
        '/levy/v1/data-quality/ai-recommendations',
        request,
      )
    : await api.get<AiRecommendationsResultApi>('/levy/v1/data-quality/ai-recommendations');

  return {
    ...response.data,
    recommendations: Array.isArray(response.data.recommendations)
      ? response.data.recommendations.map(mapAiRecommendation)
      : [],
  };
}

export async function getDataQualityRealtimeMetrics(): Promise<RealtimeMetricsResult> {
  const res = await api.get<RealtimeMetricsResult>('/levy/v1/data-quality/realtime-metrics');
  return res.data;
}

export async function getDistrictRiskScores(
  taxYear?: number,
): Promise<DistrictRiskSummaryResponse> {
  const res = await api.get<DistrictRiskSummaryResponse>(
    '/levy/v1/data-quality/district-risk-summary',
    {
      params: taxYear != null ? { taxYear } : undefined,
    },
  );
  return res.data;
}

// ── Reference / compliance calls ───────────────────────────────────────────

export async function getIpdRates(): Promise<IpdRatesEnvelope> {
  const res = await api.get<IpdRatesEnvelopeApi>('/levy/v1/ipd-rates');
  return {
    ...res.data,
    rates: Array.isArray(res.data.rates)
      ? res.data.rates.map((rate) => ({
          ...rate,
          limitFactor: deriveLimitFactor(rate.ipdPercent),
        }))
      : [],
  };
}

export async function getLidLifts(): Promise<LidLiftsEnvelope> {
  const res = await api.get<LidLiftsEnvelope>('/levy/v1/lid-lifts');
  return res.data;
}

export async function getStateSchoolLevy(): Promise<StateSchoolEnvelope> {
  const res = await api.get<StateSchoolEnvelope>('/levy/v1/state-school-levy');
  return res.data;
}

export async function getRefundFund(): Promise<RefundFundEnvelope> {
  const res = await api.get<RefundFundEnvelope>('/levy/v1/refund-fund');
  return res.data;
}

export async function getTaxCodeAreas(limit = 200): Promise<TaxCodeAreasEnvelope> {
  const res = await api.get<TaxCodeAreasEnvelope>('/levy/v1/tax-code-areas', {
    params: { limit },
  });
  return res.data;
}

export async function getRetentionPolicy(): Promise<RetentionPolicyEnvelope> {
  const res = await api.get<RetentionPolicyEnvelope>('/levy/v1/retention-policy');
  return res.data;
}

export async function attestCalculation(
  request: AttestationRequest,
): Promise<AttestationEnvelope> {
  const res = await api.post<AttestationEnvelope>('/levy/v1/attest', request);
  return res.data;
}

// ── Public portal call ─────────────────────────────────────────────────────

export async function getPublicTaxEstimate(
  assessedValue: number,
  districtId: string,
): Promise<PublicTaxEstimate> {
  const res = await api.get<PublicTaxEstimate>('/levy/public/tax-estimate', {
    params: { assessedValue, districtId },
  });
  return res.data;
}

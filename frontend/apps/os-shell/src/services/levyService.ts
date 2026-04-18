/**
 * Levy Service — Tax Levy Calculation API client.
 *
 * Thin axios wrapper targeting the governed backend at `/api/levy-calculation/*`
 * (see `backend/src/TerraFusion.API/Controllers/LevyCalculationController.cs`).
 *
 * Honesty notes:
 * - `quantumFactor` / `optimizationMethod` on `LevyCalculationResult` are legacy
 *   DTO fields from the v1 MVP. The backend returns a flat tuning multiplier,
 *   not a quantum computation. Rename tracked in docs/levy/reference/open-tickets/.
 * - Write endpoints (calculate-rate, calculate-batch, history) require
 *   `[Authorize(Roles = "LevyClerk,Assessor,Admin,Administrator")]`.
 * - Reference endpoints (benton/*, statutory-limits, highest-lawful-levy,
 *   aggregate-check) are `[AllowAnonymous]`.
 */
import api from './api';

// ── Request / Response types ───────────────────────────────────────────────

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
  /** Legacy DTO field — see file header note. */
  quantumFactor: number;
  /** Legacy DTO field — see file header note. */
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

// ── API calls ──────────────────────────────────────────────────────────────

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

export async function calculateHighestLawfulLevy(
  request: HighestLawfulLevyRequest,
): Promise<HighestLawfulLevyResult> {
  const res = await api.post<HighestLawfulLevyResult>(
    '/levy-calculation/highest-lawful-levy',
    request,
  );
  return res.data;
}

// ── Reference & compliance (F1/F3/F4/F5/F7/F8/F9) ──────────────────────────
// Route-aligned on the canonical /api/levy/v1 prefix. See
// backend/src/TerraFusion.API/Controllers/LevyReferenceController.cs.

export interface IpdAnnualRate {
  year: number;
  ipdPercent: number | null;
  sourceNote: string | null;
  publishedDate: string | null;
  importedBy: string | null;
  importedAt: string | null;
}
export interface IpdRatesEnvelope {
  source: string;
  description: string;
  specialistGated: boolean;
  specialistGateNote: string | null;
  rates: IpdAnnualRate[];
  count: number;
  rcwReference: string;
}
export async function getIpdRates(): Promise<IpdRatesEnvelope> {
  const res = await api.get<IpdRatesEnvelope>('/levy/v1/ipd-rates');
  return res.data;
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
export async function getLidLifts(): Promise<LidLiftsEnvelope> {
  const res = await api.get<LidLiftsEnvelope>('/levy/v1/lid-lifts');
  return res.data;
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
export async function getStateSchoolLevy(): Promise<StateSchoolEnvelope> {
  const res = await api.get<StateSchoolEnvelope>('/levy/v1/state-school-levy');
  return res.data;
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
export async function getRefundFund(): Promise<RefundFundEnvelope> {
  const res = await api.get<RefundFundEnvelope>('/levy/v1/refund-fund');
  return res.data;
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
export async function getTaxCodeAreas(limit = 200): Promise<TaxCodeAreasEnvelope> {
  const res = await api.get<TaxCodeAreasEnvelope>('/levy/v1/tax-code-areas', {
    params: { limit },
  });
  return res.data;
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
export async function getRetentionPolicy(): Promise<RetentionPolicyEnvelope> {
  const res = await api.get<RetentionPolicyEnvelope>('/levy/v1/retention-policy');
  return res.data;
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
export async function attestCalculation(
  request: AttestationRequest,
): Promise<AttestationEnvelope> {
  const res = await api.post<AttestationEnvelope>('/levy/v1/attest', request);
  return res.data;
}

// ── Public portal (F6 — anonymous, no PII) ─────────────────────────────────

export interface PublicTaxEstimate {
  assessedValue: number;
  districtCode: string;
  districtName: string;
  ratePerThousandAV: number;
  estimatedAnnualTax: number;
  estimateMethod: string;
  disclaimer: string;
}
export async function getPublicTaxEstimate(
  assessedValue: number,
  districtId: string,
): Promise<PublicTaxEstimate> {
  const res = await api.get<PublicTaxEstimate>('/levy/public/tax-estimate', {
    params: { assessedValue, districtId },
  });
  return res.data;
}

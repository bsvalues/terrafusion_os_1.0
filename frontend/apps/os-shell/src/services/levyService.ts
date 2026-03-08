/**
 * Levy Service — Tax Levy Calculation API
 * Calls the governed TerraFusion API at /api/levy-calculation/*
 * Requires [Authorize(Roles = "LevyClerk,Assessor,Admin")]
 */
import api from './api';

// ── Request / Response types (matching LevyCalculationController.cs DTOs) ──

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
  quantumFactor: number;
  optimizationMethod: string;
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

export interface LevyHistoryRecord {
  taxLevyId: string;
  countyId: string;
  taxingDistrict: string;
  taxRate: number;
  levyAmount: number;
  taxYear: number;
  purpose: string;
  effectiveDate: string;
}

/** Get levy calculation history — GET /api/levy-calculation/history */
export async function getLevyHistory(options?: {
  taxYear?: number;
  districtId?: string;
}): Promise<LevyHistoryRecord[]> {
  const params = new URLSearchParams();
  if (options?.taxYear) params.set('taxYear', String(options.taxYear));
  if (options?.districtId) params.set('districtId', options.districtId);
  const qs = params.toString();
  const res = await api.get<LevyHistoryRecord[]>(
    `/levy-calculation/history${qs ? `?${qs}` : ''}`,
  );
  return res.data;
}

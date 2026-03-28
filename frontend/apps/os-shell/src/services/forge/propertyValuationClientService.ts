// TFT-162 — Client service for property valuation API

import type {
  PropertyValuation,
  CostScheduleEntry,
  DepreciationInput,
  DepreciationResult,
  IncomeApproachData,
} from '@/types/realEstate';
import { getToken } from '@/auth/authStorage';

const API_BASE = '/api';

// ============================================================================
// Auth Helper (mirrors atlasService pattern)
// ============================================================================

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function authHeadersReadOnly(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function getPropertyValuation(parcelId: string): Promise<PropertyValuation> {
  const res = await fetch(`${API_BASE}/properties/${parcelId}/valuation`, { headers: authHeadersReadOnly() });
  if (!res.ok) throw new Error(`Failed to fetch valuation: ${res.statusText}`);
  return res.json();
}

export async function getCostSchedule(params?: {
  qualityClass?: string;
  search?: string;
}): Promise<CostScheduleEntry[]> {
  // Wire to CostForge factors endpoint (BC-RICHLAND = Benton County region).
  // Falls back to SAMPLE_COST_SCHEDULES in CostManual if this fails.
  const res = await fetch(`${API_BASE}/CostForge/factors/BC-RICHLAND`, { headers: authHeadersReadOnly() });
  if (!res.ok) throw new Error(`Failed to fetch cost factors: ${res.statusText}`);
  const factors: Array<{ name?: string; factor?: number; description?: string; effectiveDate?: string }> = await res.json();
  return factors.map((f) => ({
    code: f.name ?? 'UNKNOWN',
    description: f.description ?? f.name ?? 'Cost Factor',
    qualityClass: params?.qualityClass ?? 'Standard',
    baseCost: f.factor ?? 0,
    unit: 'factor',
    effectiveDate: f.effectiveDate ? new Date(f.effectiveDate).toLocaleDateString('en-US') : 'Unknown',
  }));
}

export async function calculateDepreciation(
  input: DepreciationInput
): Promise<DepreciationResult> {
  const res = await fetch(`${API_BASE}/valuation/depreciation`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to calculate depreciation: ${res.statusText}`);
  return res.json();
}

export async function getIncomeApproach(parcelId: string): Promise<IncomeApproachData> {
  const res = await fetch(`${API_BASE}/properties/${parcelId}/income-approach`, { headers: authHeadersReadOnly() });
  if (!res.ok) throw new Error(`Failed to fetch income approach: ${res.statusText}`);
  return res.json();
}

export async function getValuationHistory(
  parcelId: string
): Promise<PropertyValuation[]> {
  const res = await fetch(`${API_BASE}/properties/${parcelId}/valuation/history`, { headers: authHeadersReadOnly() });
  if (!res.ok) throw new Error(`Failed to fetch valuation history: ${res.statusText}`);
  return res.json();
}

// TFT-162 — Client service for property valuation API

import type {
  PropertyValuation,
  CostScheduleEntry,
  DepreciationInput,
  DepreciationResult,
  IncomeApproachData,
} from '@/types/realEstate';

const API_BASE = '/api';

export async function getPropertyValuation(parcelId: string): Promise<PropertyValuation> {
  const res = await fetch(`${API_BASE}/properties/${parcelId}/valuation`);
  if (!res.ok) throw new Error(`Failed to fetch valuation: ${res.statusText}`);
  return res.json();
}

export async function getCostSchedule(params?: {
  qualityClass?: string;
  search?: string;
}): Promise<CostScheduleEntry[]> {
  const query = new URLSearchParams();
  if (params?.qualityClass) query.set('qualityClass', params.qualityClass);
  if (params?.search) query.set('search', params.search);
  const res = await fetch(`${API_BASE}/valuation/cost-schedule?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch cost schedule: ${res.statusText}`);
  return res.json();
}

export async function calculateDepreciation(
  input: DepreciationInput
): Promise<DepreciationResult> {
  const res = await fetch(`${API_BASE}/valuation/depreciation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to calculate depreciation: ${res.statusText}`);
  return res.json();
}

export async function getIncomeApproach(parcelId: string): Promise<IncomeApproachData> {
  const res = await fetch(`${API_BASE}/properties/${parcelId}/income-approach`);
  if (!res.ok) throw new Error(`Failed to fetch income approach: ${res.statusText}`);
  return res.json();
}

export async function getValuationHistory(
  parcelId: string
): Promise<PropertyValuation[]> {
  const res = await fetch(`${API_BASE}/properties/${parcelId}/valuation/history`);
  if (!res.ok) throw new Error(`Failed to fetch valuation history: ${res.statusText}`);
  return res.json();
}

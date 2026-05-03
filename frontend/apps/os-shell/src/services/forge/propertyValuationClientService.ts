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

interface CostScheduleApiRow {
  code?: string;
  description?: string;
  qualityClass?: string;
  baseCost?: number;
  unit?: string;
  effectiveDate?: string;
  matrixType?: string;
}

function normalizeQualityClassFilter(qualityClass?: string): string | undefined {
  if (!qualityClass) return undefined;

  const normalized = qualityClass.trim().toUpperCase();
  const aliasMap: Record<string, string> = {
    ECONOMY: 'ECONOMY',
    LOW: 'ECONOMY',
    STANDARD: 'STANDARD',
    AVERAGE: 'STANDARD',
    CUSTOM: 'CUSTOM',
    GOOD: 'CUSTOM',
    PREMIUM: 'PREMIUM',
    LUXURY: 'LUXURY',
  };

  return aliasMap[normalized];
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
  const qualityClass = normalizeQualityClassFilter(params?.qualityClass);
  const qs = qualityClass ? `?qualityClass=${encodeURIComponent(qualityClass)}` : '';
  const res = await fetch(`${API_BASE}/CostForge/schedule${qs}`, { headers: authHeadersReadOnly() });
  if (!res.ok) throw new Error(`Failed to fetch cost schedule: ${res.statusText}`);

  const rows: CostScheduleApiRow[] = await res.json();
  const entries = rows
    .filter((row) => row.matrixType !== 'SecondaryFeature')
    .map((row) => ({
      code: row.code ?? 'UNKNOWN',
      description: row.description ?? row.code ?? 'Cost Schedule Row',
      qualityClass: row.qualityClass ?? 'Unknown',
      baseCost: row.baseCost ?? 0,
      unit: row.unit ?? '$/SF',
      effectiveDate: row.effectiveDate ?? 'Unknown',
    }));

  if (!params?.search) {
    return entries;
  }

  const search = params.search.trim().toLowerCase();
  if (!search) {
    return entries;
  }

  return entries.filter((entry) =>
    entry.code.toLowerCase().includes(search) ||
    entry.description.toLowerCase().includes(search) ||
    entry.qualityClass.toLowerCase().includes(search)
  );
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

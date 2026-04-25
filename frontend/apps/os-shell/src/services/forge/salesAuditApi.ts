/**
 * SalesAudit API client
 * Handles AI-powered stratum diagnosis and simulation for sales ratio audit.
 */

export interface StratumDiagnosisSummary {
  stratumKey: string;
  primaryDiagnosis: string | null;
  confidence: number | null;
  recommendedAction: string | null;
  isStale: boolean;
  diagnosedAt: string | null;
}

export interface StratumSale {
  id: string;
  parcelId: string;
  saleDate: string;
  salePrice: number;
  assessedValue: number | null;
  ratio: number | null;
  wacCode: string | null;
  aiFlag: string | null;
  aiReason: string | null;
  pacsQualification: string | null;
  recommendation: string | null;
  qualificationDecision: string | null;
}

export interface DiagnosisFinding {
  rule: string;
  description: string;
  affectedSaleIds: string[];
}

export interface SaleAuditDiagnosis {
  id: string;
  countyId: string;
  taxYear: number;
  stratumKey: string;
  primaryDiagnosis: string;
  confidence: number;
  findingsJson: string;
  simulationResultJson: string | null;
  recommendedAction: string;
  recommendedSaleIdsJson: string | null;
  recommendedFactor: number | null;
  diagnosedAt: string;
  isStale: boolean;
}

export interface SimulationResult {
  cod: number;
  medianRatio: number;
  prd: number;
  saleCount: number;
}

const BASE = '/api/SalesAudit';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const salesAuditApi = {
  getStrata: (taxYear: number) =>
    apiFetch<StratumDiagnosisSummary[]>(`${BASE}/strata?taxYear=${taxYear}`),

  getStratumSales: (stratumKey: string, taxYear: number) =>
    apiFetch<StratumSale[]>(`${BASE}/strata/${encodeURIComponent(stratumKey)}/sales?taxYear=${taxYear}`),

  getDiagnosis: (stratumKey: string, taxYear: number) =>
    apiFetch<SaleAuditDiagnosis>(`${BASE}/strata/${encodeURIComponent(stratumKey)}/diagnosis?taxYear=${taxYear}`),

  diagnoseStratum: (stratumKey: string, taxYear: number) =>
    apiFetch<SaleAuditDiagnosis>(
      `${BASE}/strata/${encodeURIComponent(stratumKey)}/diagnose?taxYear=${taxYear}`,
      { method: 'POST' }
    ),

  diagnoseCounty: (taxYear: number) =>
    apiFetch<{ diagnosedCount: number }>(`${BASE}/diagnose-county?taxYear=${taxYear}`, { method: 'POST' }),

  bulkDecision: (saleIds: string[], decision: string, reason?: string) =>
    apiFetch<void>(`${BASE}/sales/bulk-decision`, {
      method: 'POST',
      body: JSON.stringify({ saleIds, decision, reason }),
    }),

  simulate: (stratumKey: string, taxYear: number, factor: number, excludeIds?: string[]) => {
    const params = new URLSearchParams({
      taxYear: String(taxYear),
      factor: String(factor),
      ...(excludeIds?.length ? { excludeIds: excludeIds.join(',') } : {}),
    });
    return apiFetch<SimulationResult>(
      `${BASE}/strata/${encodeURIComponent(stratumKey)}/simulate?${params}`
    );
  },

  proposeAdjustment: (
    stratumKey: string,
    taxYear: number,
    factor: number,
    projectedCod: number,
    projectedMedianRatio: number,
    projectedPrd: number
  ) =>
    apiFetch<{ id: string; status: string }>(
      `${BASE}/strata/${encodeURIComponent(stratumKey)}/propose-adjustment?taxYear=${taxYear}`,
      {
        method: 'POST',
        body: JSON.stringify({ factor, projectedCod, projectedMedianRatio, projectedPrd }),
      }
    ),
};

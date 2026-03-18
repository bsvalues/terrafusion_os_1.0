// TFT-164 — Client service for property comparison API

import type { SalesComp, CompAdjustment } from '@/types/realEstate';

const API_BASE = '/api';

export async function getSalesComps(
  parcelId: string,
  params?: { limit?: number; maxDistance?: number }
): Promise<SalesComp[]> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.maxDistance) query.set('maxDistance', String(params.maxDistance));
  const res = await fetch(`${API_BASE}/properties/${parcelId}/comps?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch comps: ${res.statusText}`);
  return res.json();
}

export async function getSuggestedComps(parcelId: string): Promise<SalesComp[]> {
  const res = await fetch(`${API_BASE}/properties/${parcelId}/comps/suggested`);
  if (!res.ok) throw new Error(`Failed to fetch suggested comps: ${res.statusText}`);
  return res.json();
}

export async function getCompAdjustments(
  subjectId: string,
  compId: string
): Promise<CompAdjustment[]> {
  const res = await fetch(`${API_BASE}/comparison/${subjectId}/${compId}/adjustments`);
  if (!res.ok) throw new Error(`Failed to fetch adjustments: ${res.statusText}`);
  return res.json();
}

export async function compareProperties(
  parcelIds: string[]
): Promise<Record<string, Record<string, string | number>>> {
  const res = await fetch(`${API_BASE}/properties/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parcelIds }),
  });
  if (!res.ok) throw new Error(`Failed to compare properties: ${res.statusText}`);
  return res.json();
}

// TFT-166 — Client service for neighborhood API

import type { NeighborhoodMetrics, HazardRisk, DataQualityScore } from '@/types/realEstate';

const API_BASE = '/api';

export async function getNeighborhoods(): Promise<NeighborhoodMetrics[]> {
  const res = await fetch(`${API_BASE}/neighborhoods`);
  if (!res.ok) throw new Error(`Failed to fetch neighborhoods: ${res.statusText}`);
  return res.json();
}

export async function getNeighborhoodById(id: string): Promise<NeighborhoodMetrics> {
  const res = await fetch(`${API_BASE}/neighborhoods/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch neighborhood: ${res.statusText}`);
  return res.json();
}

export async function compareNeighborhoods(
  ids: string[]
): Promise<NeighborhoodMetrics[]> {
  const res = await fetch(`${API_BASE}/neighborhoods/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ neighborhoodIds: ids }),
  });
  if (!res.ok) throw new Error(`Failed to compare neighborhoods: ${res.statusText}`);
  return res.json();
}

export async function getHazardRisk(parcelId: string): Promise<HazardRisk> {
  const res = await fetch(`${API_BASE}/properties/${parcelId}/hazard-risk`);
  if (!res.ok) throw new Error(`Failed to fetch hazard risk: ${res.statusText}`);
  return res.json();
}

export async function getDataQuality(parcelId: string): Promise<DataQualityScore> {
  const res = await fetch(`${API_BASE}/properties/${parcelId}/data-quality`);
  if (!res.ok) throw new Error(`Failed to fetch data quality: ${res.statusText}`);
  return res.json();
}

export async function getDataQualityList(params?: {
  grade?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: DataQualityScore[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.grade) query.set('grade', params.grade);
  if (params?.sort) query.set('sort', params.sort);
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const res = await fetch(`${API_BASE}/data-quality?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch data quality list: ${res.statusText}`);
  return res.json();
}

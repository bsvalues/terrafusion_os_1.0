// TFT-165 — Client service for market trends API

import type {
  MarketSegment,
  TrendPoint,
  MarketCycle,
  EconomicIndicator,
  PriceHistoryPoint,
} from '@/types/realEstate';

const API_BASE = '/api';

export async function getMarketSegments(): Promise<MarketSegment[]> {
  const res = await fetch(`${API_BASE}/market/segments`);
  if (!res.ok) throw new Error(`Failed to fetch market segments: ${res.statusText}`);
  return res.json();
}

export async function getMarketTrends(params?: {
  segmentId?: string;
  period?: string;
}): Promise<TrendPoint[]> {
  const query = new URLSearchParams();
  if (params?.segmentId) query.set('segmentId', params.segmentId);
  if (params?.period) query.set('period', params.period);
  const res = await fetch(`${API_BASE}/market/trends?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch market trends: ${res.statusText}`);
  return res.json();
}

export async function getMarketCycle(): Promise<MarketCycle> {
  const res = await fetch(`${API_BASE}/market/cycle`);
  if (!res.ok) throw new Error(`Failed to fetch market cycle: ${res.statusText}`);
  return res.json();
}

export async function getEconomicIndicators(): Promise<EconomicIndicator[]> {
  const res = await fetch(`${API_BASE}/market/economic-indicators`);
  if (!res.ok) throw new Error(`Failed to fetch economic indicators: ${res.statusText}`);
  return res.json();
}

export async function getPriceHistory(parcelId: string): Promise<PriceHistoryPoint[]> {
  const res = await fetch(`${API_BASE}/properties/${parcelId}/price-history`);
  if (!res.ok) throw new Error(`Failed to fetch price history: ${res.statusText}`);
  return res.json();
}

export async function getMarketMetrics(params?: {
  propertyType?: string;
}): Promise<TrendPoint[]> {
  const query = new URLSearchParams();
  if (params?.propertyType) query.set('propertyType', params.propertyType);
  const res = await fetch(`${API_BASE}/market/metrics?${query}`);
  if (!res.ok) throw new Error(`Failed to fetch market metrics: ${res.statusText}`);
  return res.json();
}

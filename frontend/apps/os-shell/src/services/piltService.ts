/**
 * PILT Service — Payment In Lieu of Taxes API
 * Calls the governed TerraFusion API at /api/pilt/*
 * All endpoints are [AllowAnonymous] — no auth required.
 */
import api from './api';

// ── Response types (matching PiltController.cs records) ──────────────────

export interface PiltStatus {
  status: string;
  fiscalYear: number;
  totalPayments: number;
  districts: number;
  federalAcres: number;
  averageRate: number;
}

export interface PiltDistrict {
  id: string;
  name: string;
  type: string;
}

export interface PiltReceipt {
  id: string;
  fiscalYear: number;
  source: string;
  amount: number;
  status: string;
}

export interface PiltDistrictsResponse {
  count: number;
  districts: PiltDistrict[];
}

export interface PiltReceiptsResponse {
  count: number;
  receipts: PiltReceipt[];
}

// ── API calls ────────────────────────────────────────────────────────────

export async function getPiltStatus(): Promise<PiltStatus> {
  const res = await api.get<PiltStatus>('/pilt/status');
  return res.data;
}

export async function getPiltDistricts(): Promise<PiltDistrictsResponse> {
  const res = await api.get<PiltDistrictsResponse>('/pilt/districts');
  return res.data;
}

export async function getPiltReceipts(fiscalYear?: number): Promise<PiltReceiptsResponse> {
  const params = fiscalYear ? { fiscalYear } : undefined;
  const res = await api.get<PiltReceiptsResponse>('/pilt/receipts', { params });
  return res.data;
}

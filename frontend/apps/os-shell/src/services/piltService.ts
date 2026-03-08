/**
 * PILT Service — Payment In Lieu of Taxes API
 * Calls the governed TerraFusion API at /api/pilt/*
 * Endpoints are authenticated and county-scoped.
 */
import axios from 'axios';
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

export class PiltApiError extends Error {
  public readonly correlationId: string;
  public readonly status?: number;
  public readonly deferred: boolean;

  constructor(message: string, correlationId: string, status?: number, deferred = false) {
    super(message);
    this.name = 'PiltApiError';
    this.correlationId = correlationId;
    this.status = status;
    this.deferred = deferred;
  }
}

function createClientCorrelationId(prefix = 'net'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readCorrelationId(headerValue: unknown): string | null {
  if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
    return headerValue;
  }

  if (Array.isArray(headerValue)) {
    const first = headerValue.find((value) => typeof value === 'string' && value.trim().length > 0);
    return typeof first === 'string' ? first : null;
  }

  return null;
}

function normalizePiltError(error: unknown): PiltApiError {
  if (error instanceof PiltApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const correlationId =
      readCorrelationId(error.response?.headers?.['x-correlation-id']) ?? createClientCorrelationId();
    const status = error.response?.status;
    const data = error.response?.data as
      | { title?: string; detail?: string; scope?: string; extensions?: Record<string, unknown> }
      | undefined;
    const scope =
      data?.scope ??
      (typeof data?.extensions?.scope === 'string' ? data.extensions.scope : undefined);
    const deferred = status === 501 && scope === 'Post-R1';
    const message =
      data?.detail ??
      data?.title ??
      error.message ??
      'PILT request failed';

    return new PiltApiError(message, correlationId, status, deferred);
  }

  const correlationId = createClientCorrelationId();
  const message = error instanceof Error ? error.message : 'PILT request failed';
  return new PiltApiError(message, correlationId);
}

async function requestPilt<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const res = await api.get<T>(path, params ? { params } : undefined);
    return res.data;
  } catch (error) {
    throw normalizePiltError(error);
  }
}

// ── API calls ────────────────────────────────────────────────────────────

export async function getPiltStatus(): Promise<PiltStatus> {
  return requestPilt<PiltStatus>('/pilt/status');
}

export async function getPiltDistricts(): Promise<PiltDistrictsResponse> {
  return requestPilt<PiltDistrictsResponse>('/pilt/districts');
}

export async function getPiltReceipts(fiscalYear?: number): Promise<PiltReceiptsResponse> {
  const params = fiscalYear ? { fiscalYear } : undefined;
  return requestPilt<PiltReceiptsResponse>('/pilt/receipts', params);
}

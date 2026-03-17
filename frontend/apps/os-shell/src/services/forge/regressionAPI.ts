// TerraFusion OS: Regression API Service Layer
// Wave 3 — Axios-based frontend client for /api/costforge/analytics/regression endpoints
// Follows ragAPI.ts auth-interceptor pattern (getToken + Bearer)

import axios, { AxiosInstance } from 'axios';
import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

// ==================== Types (mirror backend OLS DTOs) ====================

export interface RegressionObservation {
  features: number[];
  value: number;
}

export interface OlsRegressionRequest {
  observations: RegressionObservation[];
  featureNames?: string[];
  dependentVariable?: string;
}

export interface RegressionCoefficientResult {
  feature: string;
  coefficient: number;
  standardError: number;
}

export interface RegressionResult {
  id: string;
  intercept: number;
  coefficients: RegressionCoefficientResult[];
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  pValue: number;
  sampleSize: number;
  diagnostics: Record<string, unknown> | null;
  predictions: number[] | null;
  createdAt: string;
}

export interface RegressionHistoryItem {
  id: string;
  dependentVariable: string;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  sampleSize: number;
  createdAt: string;
  createdBy: string;
}

export interface RegressionHistoryResponse {
  count: number;
  results: RegressionHistoryItem[];
}

// ==================== Service ====================

class RegressionAPIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/costforge/analytics/regression`,
      headers: { 'Content-Type': 'application/json' },
    });

    // Auth interceptor — mirrors ragAPI pattern
    this.api.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /** Run an OLS regression analysis */
  async runRegression(request: OlsRegressionRequest): Promise<RegressionResult> {
    const res = await this.api.post<RegressionResult>('', request);
    return res.data;
  }

  /** Get a specific regression result by ID */
  async getResult(id: string): Promise<RegressionResult> {
    const res = await this.api.get<RegressionResult>(`/${id}`);
    return res.data;
  }

  /** Get regression diagnostics by ID */
  async getDiagnostics(id: string): Promise<Record<string, unknown>> {
    const res = await this.api.get<Record<string, unknown>>(`/${id}/diagnostics`);
    return res.data;
  }

  /** Get regression run history */
  async getHistory(limit = 20): Promise<RegressionHistoryResponse> {
    const res = await this.api.get<RegressionHistoryResponse>('/history', {
      params: { limit },
    });
    return res.data;
  }
}

export const regressionAPI = new RegressionAPIService();

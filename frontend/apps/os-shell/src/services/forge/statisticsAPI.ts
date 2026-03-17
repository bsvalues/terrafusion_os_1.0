// TerraFusion OS: Statistics API Service Layer
// Wave 4A — Axios-based frontend client for /api/MassAppraisal statistics endpoints
// Follows regressionAPI.ts auth-interceptor pattern (getToken + Bearer)

import axios, { AxiosInstance } from 'axios';
import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';
import type {
  StrataResult,
  OutlierRecord,
  ModelComparisonResult,
} from '@/data/forgeStatisticsFixtures';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

// ==================== Types (mirror backend DTOs) ====================

export interface DiscoveredSegment {
  id: string;
  name: string;
  boundaryDescription: string;
  status: 'pending' | 'accepted' | 'rejected';
  confidence: number;
  parcelCount: number;
  medianValue: number;
  avgSqft: number;
  avgAge: number;
  keyCharacteristics: string[];
}

export interface CompareModelsRequest {
  modelIdA: string;
  modelIdB: string;
}

// ==================== Service ====================

class StatisticsAPIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/MassAppraisal`,
      headers: { 'Content-Type': 'application/json' },
    });

    // Auth interceptor — mirrors regressionAPI pattern
    this.api.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /** Get strata breakdown for a model (neighborhood × propertyType) */
  async getStrata(modelId: string): Promise<StrataResult[]> {
    const res = await this.api.get<StrataResult[]>(`/ratio-study/${encodeURIComponent(modelId)}/strata`);
    return res.data;
  }

  /** Get flagged outlier parcels for a model */
  async getOutliers(modelId: string): Promise<OutlierRecord[]> {
    const res = await this.api.get<OutlierRecord[]>(`/ratio-study/${encodeURIComponent(modelId)}/outliers`);
    return res.data;
  }

  /** Compare two appraisal models */
  async compareModels(request: CompareModelsRequest): Promise<ModelComparisonResult> {
    const res = await this.api.post<ModelComparisonResult>('/compare', request);
    return res.data;
  }

  /** Discover property segments for a model */
  async discoverSegments(modelId: string): Promise<DiscoveredSegment[]> {
    const res = await this.api.get<DiscoveredSegment[]>(`/segments/${encodeURIComponent(modelId)}`);
    return res.data;
  }
}

export const statisticsAPI = new StatisticsAPIService();

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
} from '@/types/forgeStatistics';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

function getStatisticsApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/MassAppraisal';
  }

  const normalizedBase = API_BASE_URL.replace(/\/$/, '');
  return `${normalizedBase}/api/MassAppraisal`;
}

export const statisticsApiContractMetadata = {
  contractId: 'terraforge_statistics_compat_v1',
  implementationContractId: 'statistics_ratio_study_compat_v1',
  population: 'qualified sale ratio rows using the shared Statistics/TerraForge ratio-study population contract',
  source: '/api/MassAppraisal ratio-study endpoints',
  trustPosture: [
    'Legacy client retained for shared statistics capability, not standalone shell posture.',
    'Parity claims require statistics_ratio_study_compat_v1 population alignment.',
  ],
} as const;

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
  readonly contractMetadata = statisticsApiContractMetadata;

  constructor() {
    this.api = axios.create({
      baseURL: getStatisticsApiBaseUrl(),
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

  /** Persist outlier review decision for a model parcel */
  async reviewOutlier(
    modelId: string,
    parcelId: string,
    status: 'confirmed' | 'dismissed'
  ): Promise<void> {
    await this.api.patch(
      `/ratio-study/${encodeURIComponent(modelId)}/outliers/${encodeURIComponent(parcelId)}/review`,
      { status }
    );
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

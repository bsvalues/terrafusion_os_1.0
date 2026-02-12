/**
 * TerraLevy API Client
 * Championship-level API integration with quantum optimization
 */

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
}

export interface District {
  id: string;
  countyId: string;
  districtCode: string;
  name: string;
  districtType: string;
  parcelCount: number;
  totalAssessedValue: number;
  isActive: boolean;
}

export interface LevyMeasure {
  id: string;
  countyId: string;
  name: string;
  description?: string;
  levyYear: number;
  levyType: string;
  status: string;
  targetAmount: number;
  calculatedAmount: number;
  maximumRate: number;
  calculatedRate: number;
  approvedDate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  subjectToLimit: boolean;
  totalAssessedValue: number;
  quantumOptimized: boolean;
  aiConfidenceScore: number;
  metadata?: any;
}

export interface CalculateRequest {
  measureId: string;
  quantumOptimization?: boolean;
}

export interface CalculateResponse {
  calculatedRate: number;
  levyAmount: number;
  aiOptimalRate: number;
  confidenceScore: number;
  quantumOptimized: boolean;
  recommendationReason: string;
  calculationDetails: any;
}

export interface ComplianceResponse {
  isCompliant: boolean;
  proposedRate: number;
  maximumAllowedRate: number;
  statutoryLimit: number;
  violations: string[];
  warnings: string[];
  complianceLevel: string;
}

export interface ScenarioAnalysis {
  scenarioName: string;
  rate: number;
  levyAmount: number;
  projectedRevenue: number;
  collectionRate: number;
  aiConfidenceScore: number;
  riskLevel: string;
  aiInsights: any;
}

export interface AnalyzeScenariosRequest {
  measureId: string;
  rates: number[];
}

export interface LevyScenario {
  id: string;
  countyId: string;
  levyMeasureId: string;
  name: string;
  scenarioType: string;
  levyRate: number;
  projectedRevenue: number;
  collectionRate: number;
  isActive: boolean;
  confidenceScore: number;
}

export interface RevenueProjection {
  id: string;
  levyScenarioId: string;
  fiscalYear: number;
  projectedAssessedValue: number;
  projectedLevyAmount: number;
  projectedCollectionRate: number;
  projectedNetRevenue: number;
  growthRate: number;
  confidenceLevel: number;
}

export interface GenerateProjectionsRequest {
  scenarioId: string;
  years: number;
  quantumForecasting?: boolean;
}

export interface CompareScenariosRequest {
  scenarioIds: string[];
  projectionYears: number;
}

export interface ScenarioComparison {
  scenarioId: string;
  scenarioName: string;
  scenarioType: string;
  totalProjectedRevenue: number;
  averageGrowthRate: number;
  averageConfidence: number;
  riskLevel: string;
  projectionYears: number;
}

export interface CompareResponse {
  scenarios: ScenarioComparison[];
  recommendedScenario: ScenarioComparison;
  recommendationReason: string;
  comparisonMetrics: any;
  aiConfidence: number;
}

/**
 * LevyApiClient - Championship API integration
 */
export class LevyApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:5000') {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Health check
  async checkHealth(): Promise<HealthResponse> {
    return this.fetch<HealthResponse>('/levy/health');
  }

  // Districts
  async getDistricts(county?: string, take = 100, skip = 0): Promise<{ count: number; items: District[] }> {
    const params = new URLSearchParams();
    if (county) params.append('county', county);
    params.append('take', take.toString());
    params.append('skip', skip.toString());

    return this.fetch<{ count: number; items: District[] }>(`/levy/districts?${params}`);
  }

  // Levy Measures
  async getMeasures(county?: string, take = 100, skip = 0): Promise<{ count: number; items: LevyMeasure[] }> {
    const params = new URLSearchParams();
    if (county) params.append('county', county);
    params.append('take', take.toString());
    params.append('skip', skip.toString());

    return this.fetch<{ count: number; items: LevyMeasure[] }>(`/levy/measures?${params}`);
  }

  async getMeasureById(id: string): Promise<LevyMeasure> {
    return this.fetch<LevyMeasure>(`/levy/measures/${id}`);
  }

  async checkCompliance(measureId: string, rate: number): Promise<ComplianceResponse> {
    return this.fetch<ComplianceResponse>(`/levy/measures/${measureId}/compliance?rate=${rate}`);
  }

  // Calculations
  async calculateOptimalRate(request: CalculateRequest): Promise<CalculateResponse> {
    return this.fetch<CalculateResponse>('/levy/calculate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Scenarios
  async getScenarios(measureId?: string, take = 100, skip = 0): Promise<{ count: number; items: LevyScenario[] }> {
    const params = new URLSearchParams();
    if (measureId) params.append('measureId', measureId);
    params.append('take', take.toString());
    params.append('skip', skip.toString());

    return this.fetch<{ count: number; items: LevyScenario[] }>(`/levy/scenarios?${params}`);
  }

  async analyzeScenarios(request: AnalyzeScenariosRequest): Promise<ScenarioAnalysis[]> {
    return this.fetch<ScenarioAnalysis[]>('/levy/scenarios/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async compareScenarios(request: CompareScenariosRequest): Promise<CompareResponse> {
    return this.fetch<CompareResponse>('/levy/scenarios/compare', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Projections
  async getProjections(scenarioId?: string, take = 100, skip = 0): Promise<{ count: number; items: RevenueProjection[] }> {
    const params = new URLSearchParams();
    if (scenarioId) params.append('scenarioId', scenarioId);
    params.append('take', take.toString());
    params.append('skip', skip.toString());

    return this.fetch<{ count: number; items: RevenueProjection[] }>(`/levy/projections?${params}`);
  }

  async generateProjections(request: GenerateProjectionsRequest): Promise<RevenueProjection[]> {
    return this.fetch<RevenueProjection[]>('/levy/projections/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// Export singleton instance
export const levyApi = new LevyApiClient();

export interface RegressionCoefficient {
  variable: string;
  estimate: number;
  stdError: number;
  tStat: number;
  pValue: number;
  significant: boolean;
  vif?: number;
}

export interface RegressionModelRecord {
  id: string;
  name: string;
  modelType: 'OLS' | 'GWR' | 'Quantile';
  version: number;
  status: 'draft' | 'validated' | 'production';
  createdAt: string;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  mse: number;
  aic: number;
  bic: number;
  observations: number;
  variables: string[];
  coefficients: RegressionCoefficient[];
  qualificationPass: boolean;
}

export interface RegressionRunRecord {
  id: string;
  modelId: string;
  modelType: 'OLS' | 'GWR' | 'Quantile';
  rSquared: number;
  adjustedRSquared: number;
  timestamp: string;
  variables: string[];
  status: 'completed' | 'failed';
}

export interface ModelVersionComparison {
  modelA: { id: string; name: string; version: number; record: RegressionModelRecord };
  modelB: { id: string; name: string; version: number; record: RegressionModelRecord };
  coefficientDeltas: Array<{
    variable: string;
    estimateA: number;
    estimateB: number;
    delta: number;
    significantA: boolean;
    significantB: boolean;
    signChange: boolean;
  }>;
  metricDeltas: {
    rSquared: number;
    adjustedRSquared: number;
    aic: number;
    bic: number;
    mse: number;
  };
  improved: string[];
  degraded: string[];
}

export interface RegressionVariable {
  id: string;
  name: string;
  category: 'Physical' | 'Quality' | 'Location' | 'Amenity';
  selected: boolean;
  description?: string;
}

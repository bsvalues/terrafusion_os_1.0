// TerraFusion OS — Mined from terra-forge-rebuild Phase 95+
// Multiple Regression Analysis Hook — OLS with ANOVA, VIF, diagnostics.
// REST-adapted for OS backend (GET /api/regression/analysis, POST to run)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiBase';

export interface CoefficientRow {
  variable: string;
  coefficient: number;
  stdError: number;
  tStatistic: number;
  pValue: number;
  vif: number;
  significant: boolean;
}

export interface ANOVARow {
  source: string;
  df: number;
  sumSq: number;
  meanSq: number;
  fValue: number | null;
  pValue: number | null;
  etaSq: number | null;
}

export interface ModelDiagnostics {
  linearityPassed: boolean;
  linearityPValue: number;
  normalityPassed: boolean;
  normalityPValue: number;
  homoscedasticityPassed: boolean;
  homoscedasticityPValue: number;
  independencePassed: boolean;
  durbinWatson: number;
  multicollinearityPassed: boolean;
  maxVIF: number;
}

export interface DiagnosticPoint {
  x: number;
  y: number;
  label?: string;
  isOutlier?: boolean;
}

export interface NeighborhoodEffect {
  code: string;
  coefficient: number;
  stdError: number;
  tStatistic: number;
  pValue: number;
  significant: boolean;
  count: number;
  interpretation: string;
}

export interface RegressionResult {
  coefficients: CoefficientRow[];
  anova: ANOVARow[];
  neighborhoodEffects: NeighborhoodEffect[];
  modelStats: {
    rSquared: number;
    rSquaredAdj: number;
    fStatistic: number;
    fPValue: number;
    rmse: number;
    mae: number;
    aic: number;
    n: number;
    k: number;
    dfResidual: number;
  };
  diagnostics: ModelDiagnostics;
  diagnosticPlots: {
    residualsVsFitted: DiagnosticPoint[];
    qqPlot: DiagnosticPoint[];
    scaleLocation: DiagnosticPoint[];
    cooksDistance: { index: number; value: number; isInfluential: boolean }[];
  };
  equation: string;
  computedAt: string;
}

export function useRegressionAnalysis(studyPeriodId: string | undefined) {
  return useQuery<RegressionResult>({
    queryKey: ['regression-analysis', studyPeriodId],
    queryFn: async () => {
      if (!studyPeriodId) throw new Error('No study period selected');
      const res = await apiFetch(`/regression/analysis?studyPeriodId=${encodeURIComponent(studyPeriodId)}`);
      if (!res.ok) throw new Error(`Regression analysis fetch failed: ${res.status}`);
      return await res.json() as RegressionResult;
    },
    enabled: !!studyPeriodId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRunRegressionAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studyPeriodId: string) => {
      const res = await apiFetch('/regression/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyPeriodId }),
      });
      if (!res.ok) throw new Error(`Regression run failed: ${res.status}`);
      return await res.json() as RegressionResult;
    },
    onSuccess: (_data, studyPeriodId) => {
      queryClient.invalidateQueries({ queryKey: ['regression-analysis', studyPeriodId] });
    },
  });
}

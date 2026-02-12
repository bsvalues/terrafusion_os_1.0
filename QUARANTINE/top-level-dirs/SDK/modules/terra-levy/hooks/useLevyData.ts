/**
 * TerraLevy React Query Hooks
 * Championship-level data fetching with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { levyApi, type LevyMeasure, type LevyScenario, type RevenueProjection } from '../api/levyApiClient';
import type {
  CalculateRequest,
  CalculateResponse,
  ComplianceResponse,
  ScenarioAnalysis,
  AnalyzeScenariosRequest,
  GenerateProjectionsRequest,
  CompareScenariosRequest,
  CompareResponse,
} from '../api/levyApiClient';

/**
 * Query Keys for React Query cache management
 */
export const levyKeys = {
  all: ['levy'] as const,
  health: () => [...levyKeys.all, 'health'] as const,
  districts: (county?: string) => [...levyKeys.all, 'districts', { county }] as const,
  measures: (county?: string) => [...levyKeys.all, 'measures', { county }] as const,
  measure: (id: string) => [...levyKeys.all, 'measure', id] as const,
  scenarios: (measureId?: string) => [...levyKeys.all, 'scenarios', { measureId }] as const,
  projections: (scenarioId?: string) => [...levyKeys.all, 'projections', { scenarioId }] as const,
};

/**
 * Health Check Hook
 */
export const useLevyHealth = () => {
  return useQuery({
    queryKey: levyKeys.health(),
    queryFn: () => levyApi.checkHealth(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    meta: { suppressToast: true },
  });
};

/**
 * Districts Hook
 */
export const useDistricts = (county?: string, take = 100, skip = 0) => {
  return useQuery({
    queryKey: [...levyKeys.districts(county), { take, skip }],
    queryFn: () => levyApi.getDistricts(county, take, skip),
    staleTime: 300000, // 5 minutes
  });
};

/**
 * Levy Measures Hooks
 */
export const useLevyMeasures = (county?: string, take = 100, skip = 0) => {
  return useQuery({
    queryKey: [...levyKeys.measures(county), { take, skip }],
    queryFn: () => levyApi.getMeasures(county, take, skip),
    staleTime: 60000, // 1 minute
    meta: { suppressToast: true },
  });
};

export const useLevyMeasure = (id: string, enabled = true) => {
  return useQuery({
    queryKey: levyKeys.measure(id),
    queryFn: () => levyApi.getMeasureById(id),
    enabled: enabled && !!id,
    staleTime: 60000,
    meta: { suppressToast: true },
  });
};

/**
 * Compliance Check Hook
 */
export const useComplianceCheck = (measureId: string, rate: number, enabled = false) => {
  return useQuery({
    queryKey: [...levyKeys.measure(measureId), 'compliance', rate],
    queryFn: () => levyApi.checkCompliance(measureId, rate),
    enabled: enabled && !!measureId && rate > 0,
    staleTime: 0, // Always fresh for compliance checks
    meta: { suppressToast: true },
  });
};

/**
 * Calculate Optimal Rate Mutation
 */
export const useCalculateRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CalculateRequest) => levyApi.calculateOptimalRate(request),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: levyKeys.measure(variables.measureId) });
    },
    meta: { suppressToast: true },
  });
};

/**
 * Levy Scenarios Hooks
 */
export const useLevyScenarios = (measureId?: string, take = 100, skip = 0) => {
  return useQuery({
    queryKey: [...levyKeys.scenarios(measureId), { take, skip }],
    queryFn: () => levyApi.getScenarios(measureId, take, skip),
    enabled: !!measureId,
    staleTime: 60000,
    meta: { suppressToast: true },
  });
};

/**
 * Fetch scenarios across all measures (no filter)
 */
export const useAllLevyScenarios = (take = 100, skip = 0) => {
  return useQuery({
    queryKey: [...levyKeys.scenarios(undefined), { take, skip }],
    queryFn: () => levyApi.getScenarios(undefined, take, skip),
    staleTime: 60000,
    meta: { suppressToast: true },
  });
};

/**
 * Analyze Scenarios Mutation
 */
export const useAnalyzeScenarios = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AnalyzeScenariosRequest) => levyApi.analyzeScenarios(request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: levyKeys.scenarios(variables.measureId) });
    },
    meta: { suppressToast: true },
  });
};

/**
 * Compare Scenarios Mutation
 */
export const useCompareScenarios = () => {
  return useMutation({
    mutationFn: (request: CompareScenariosRequest) => levyApi.compareScenarios(request),
    meta: { suppressToast: true },
  });
};

/**
 * Revenue Projections Hooks
 */
export const useRevenueProjections = (scenarioId?: string, take = 100, skip = 0) => {
  return useQuery({
    queryKey: [...levyKeys.projections(scenarioId), { take, skip }],
    queryFn: () => levyApi.getProjections(scenarioId, take, skip),
    enabled: !!scenarioId,
    staleTime: 60000,
    meta: { suppressToast: true },
  });
};

/**
 * Generate Projections Mutation
 */
export const useGenerateProjections = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GenerateProjectionsRequest) => levyApi.generateProjections(request),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: levyKeys.projections(variables.scenarioId) });
    },
    meta: { suppressToast: true },
  });
};

/**
 * Convenience hook for full measure with scenarios and projections
 */
export const useLevyMeasureWithDetails = (measureId: string) => {
  const measure = useLevyMeasure(measureId);
  const scenarios = useLevyScenarios(measureId);

  return {
    measure: measure.data,
    scenarios: scenarios.data?.items || [],
    isLoading: measure.isLoading || scenarios.isLoading,
    error: measure.error || scenarios.error,
    refetch: () => {
      measure.refetch();
      scenarios.refetch();
    },
  };
};

/**
 * Convenience hook for scenario with projections
 */
export const useScenarioWithProjections = (scenarioId: string) => {
  const projections = useRevenueProjections(scenarioId);

  return {
    projections: projections.data?.items || [],
    isLoading: projections.isLoading,
    error: projections.error,
    refetch: projections.refetch,
  };
};

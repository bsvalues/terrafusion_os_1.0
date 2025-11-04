import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentService } from '@/services/agent.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for using agent services with React Query
 */
export const useAgentServices = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get user ID from auth context
  const userId = user?.id;

  /**
   * Hook for analyzing income data
   */
  const useIncomeAnalysis = () => {
    return useQuery({
      queryKey: ['agent', 'income-analysis', userId],
      queryFn: () => {
        if (!userId) {
          throw new Error('User ID is required for income analysis');
        }
        return AgentService.analyzeIncome(userId);
      },
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  /**
   * Hook for detecting anomalies in valuation history
   */
  const useAnomalyDetection = () => {
    return useQuery({
      queryKey: ['agent', 'anomaly-detection', userId],
      queryFn: () => {
        if (!userId) {
          throw new Error('User ID is required for anomaly detection');
        }
        return AgentService.detectAnomalies(userId);
      },
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  /**
   * Hook for analyzing data quality
   */
  const useDataQualityAnalysis = () => {
    return useQuery({
      queryKey: ['agent', 'data-quality', userId],
      queryFn: () => {
        if (!userId) {
          throw new Error('User ID is required for data quality analysis');
        }
        return AgentService.analyzeDataQuality(userId);
      },
      enabled: !!userId,
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  };

  /**
   * Hook for getting valuation summary
   */
  const useValuationSummary = (valuationId?: number) => {
    return useQuery({
      queryKey: ['agent', 'valuation-summary', valuationId],
      queryFn: () => {
        if (!valuationId) {
          throw new Error('Valuation ID is required for summary generation');
        }
        return AgentService.generateValuationSummary(valuationId);
      },
      enabled: !!valuationId,
      staleTime: 30 * 60 * 1000, // 30 minutes
    });
  };

  /**
   * Hook for generating a report
   */
  const useGenerateReport = () => {
    return useMutation({
      mutationFn: (options: {
        period: 'monthly' | 'quarterly' | 'yearly';
        includeCharts: boolean;
        includeInsights: boolean;
        includeRecommendations: boolean;
      }) => {
        if (!userId) {
          throw new Error('User ID is required for report generation');
        }
        return AgentService.generateReport(userId, options);
      },
      onSuccess: () => {
        toast({
          title: 'Report Generated',
          description: 'Your valuation report has been successfully generated.',
          variant: 'default',
        });
        // Invalidate any cached reports
        queryClient.invalidateQueries({ queryKey: ['agent', 'report', userId] });
      },
      onError: (error: Error) => {
        toast({
          title: 'Report Generation Failed',
          description: error.message || 'Failed to generate report. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  return {
    useIncomeAnalysis,
    useAnomalyDetection,
    useDataQualityAnalysis,
    useValuationSummary,
    useGenerateReport,
  };
};
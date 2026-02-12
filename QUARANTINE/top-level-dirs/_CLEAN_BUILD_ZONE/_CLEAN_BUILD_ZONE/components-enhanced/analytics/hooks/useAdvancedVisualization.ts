import { useState, useEffect, useCallback } from 'react';
import { advancedVisualizationService } from '../services/AdvancedVisualizationService';

export const useAdvancedVisualization = (jurisdiction: string) => {
  const [data, setData] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any>(null);
  const [chartTypes, setChartTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [chartData, geoJsonData, availableTypes] = await Promise.all([
        advancedVisualizationService.getChartData(jurisdiction),
        advancedVisualizationService.getGeoData(jurisdiction),
        advancedVisualizationService.getAvailableChartTypes()
      ]);

      setData(chartData);
      setGeoData(geoJsonData);
      setChartTypes(availableTypes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visualization data');
    } finally {
      setIsLoading(false);
    }
  }, [jurisdiction]);

  const getChartData = useCallback((metrics: string[], timeRange: string, filters: Record<string, any>) => {
    return advancedVisualizationService.getFilteredData(jurisdiction, metrics, timeRange, filters);
  }, [jurisdiction]);

  const exportChart = useCallback(async (chartType: string, chartData: any[], format: 'png' | 'svg' | 'pdf') => {
    return advancedVisualizationService.exportChart(chartType, chartData, format);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    data,
    geoData,
    chartTypes,
    isLoading,
    error,
    refreshData,
    getChartData,
    exportChart
  };
};

import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import { VisualizationControllerProps, VisualizationFilterState } from '@/lib/visualizationTypes';
import { getCachedData, invalidateCache, cacheKeys } from '@/lib/visualizationCache';
import { useQuery } from '@tanstack/react-query';

// Default filters — Benton County uses Reval Areas (PACS Cycle), not compass regions
const DEFAULT_FILTERS: VisualizationFilterState = {
  revalArea: 'Reval 1',
  buildingType: 'Residential'
};

// Create context for visualization filters and data
interface VisualizationContextType {
  filters: VisualizationFilterState;
  setFilters: (filters: Partial<VisualizationFilterState>) => void;
  regionalCostsQuery: any;
  hierarchicalCostsQuery: any;
  statisticalDataQuery: any;
  refreshData: () => void;
}

const VisualizationContext = createContext<VisualizationContextType | undefined>(undefined);

/**
 * Visualization Controller Component
 * 
 * Manages visualization data fetching and filter state
 */
export function VisualizationController({
  children,
  initialFilters = {},
  onFilterChange
}: VisualizationControllerProps) {
  // Initialize filter state with defaults and any provided initial values
  const [filters, setFiltersState] = useState<VisualizationFilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });
  
  // Update filters and notify parent if needed
  const setFilters = useCallback((newFilters: Partial<VisualizationFilterState>) => {
    setFiltersState(prev => {
      const updated = { ...prev, ...newFilters };
      if (onFilterChange) {
        onFilterChange(updated);
      }
      return updated;
    });
  }, [onFilterChange]);
  
  // Fetch Reval Area cost data — Benton County only
  const regionalCostsQuery = useQuery({
    queryKey: ['benchmarking', 'regionalCosts', filters.revalArea, filters.buildingType],
    queryFn: async () => {
      const cacheKey = cacheKeys.regionalCosts(filters.revalArea ?? 'Reval 1', filters.buildingType);
      return getCachedData(cacheKey, async () => {
        const params = new URLSearchParams({ county: 'Benton' });
        if (filters.revalArea) params.set('revalArea', filters.revalArea);
        if (filters.buildingType) params.set('buildingType', filters.buildingType);
        const response = await fetch(`/api/benchmarking/regional-costs?${params}`);
        return response.json();
      });
    }
  });

  // Fetch hierarchical costs data for drill-down visualization
  const hierarchicalCostsQuery = useQuery({
    queryKey: ['benchmarking', 'hierarchicalCosts', filters.revalArea, filters.buildingType],
    queryFn: async () => {
      const cacheKey = cacheKeys.hierarchicalCosts(filters.revalArea ?? 'Reval 1', filters.buildingType);
      return getCachedData(cacheKey, async () => {
        const params = new URLSearchParams({ county: 'Benton' });
        if (filters.revalArea) params.set('revalArea', filters.revalArea);
        if (filters.buildingType) params.set('buildingType', filters.buildingType);
        const response = await fetch(`/api/benchmarking/hierarchical-costs?${params}`);
        return response.json();
      });
    }
  });

  // Fetch statistical data for correlation analysis
  const statisticalDataQuery = useQuery({
    queryKey: ['benchmarking', 'statisticalData', filters.revalArea, filters.buildingType],
    queryFn: async () => {
      const cacheKey = cacheKeys.statisticalData(filters.revalArea ?? 'Reval 1', filters.buildingType);
      return getCachedData(cacheKey, async () => {
        const params = new URLSearchParams({ county: 'Benton' });
        if (filters.revalArea) params.set('revalArea', filters.revalArea);
        if (filters.buildingType) params.set('buildingType', filters.buildingType);
        const response = await fetch(`/api/benchmarking/statistical-data?${params}`);
        return response.json();
      });
    }
  });

  // Function to refresh all data
  const refreshData = useCallback(() => {
    // Invalidate cache for current filters
    invalidateCache(cacheKeys.regionalCosts(filters.revalArea ?? 'Reval 1', filters.buildingType));
    invalidateCache(cacheKeys.hierarchicalCosts(filters.revalArea ?? 'Reval 1', filters.buildingType));
    invalidateCache(cacheKeys.statisticalData(filters.revalArea ?? 'Reval 1', filters.buildingType));
    
    // Refetch data
    regionalCostsQuery.refetch();
    hierarchicalCostsQuery.refetch();
    statisticalDataQuery.refetch();
  }, [
    filters, 
    regionalCostsQuery, 
    hierarchicalCostsQuery, 
    statisticalDataQuery
  ]);
  
  // Create context value
  const contextValue: VisualizationContextType = {
    filters,
    setFilters,
    regionalCostsQuery,
    hierarchicalCostsQuery,
    statisticalDataQuery,
    refreshData
  };
  
  return (
    <VisualizationContext.Provider value={contextValue}>
      {children}
    </VisualizationContext.Provider>
  );
}

/**
 * Hook to use visualization context
 */
export function useVisualization() {
  const context = useContext(VisualizationContext);
  if (context === undefined) {
    throw new Error('useVisualization must be used within a VisualizationController');
  }
  return context;
}
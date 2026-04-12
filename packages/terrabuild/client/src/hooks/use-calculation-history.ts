import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Calculation } from '@/types/api';
import { useMutation, useQuery } from '@tanstack/react-query';

/**
 * Hook for interacting with calculation history API
 * Real .NET endpoint: GET /api/costforge/calculations
 */
export function useCalculationHistory() {
  // Get all calculation history
  const getAll = useQuery<Calculation[]>({
    queryKey: ['/api/costforge/calculations'],
  });

  // Create a new calculation history entry
  const create = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/costforge/calculations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/costforge/calculations'] });
      toast({
        title: 'Calculation saved',
        description: 'Calculation has been saved to history.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save calculation to history.',
        variant: 'destructive',
      });
    }
  });

  // Delete a calculation history entry
  const remove = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/costforge/calculations/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/costforge/calculations'] });
      toast({
        title: 'Calculation deleted',
        description: 'Calculation has been removed from history.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete calculation from history.',
        variant: 'destructive',
      });
    }
  });

  // Get calculation history for a specific building type
  const getByBuildingType = (buildingType: string) => {
    return useQuery<Calculation[]>({
      queryKey: ['/api/costforge/calculations', 'buildingType', buildingType],
      queryFn: () => apiRequest(`/api/costforge/calculations?buildingType=${encodeURIComponent(buildingType)}`),
      enabled: !!buildingType,
    });
  };

  // Get calculation history for a specific Reval Area (PACS Cycle)
  const getByRevalArea = (revalArea: string) => {
    return useQuery<Calculation[]>({
      queryKey: ['/api/costforge/calculations', 'revalArea', revalArea],
      queryFn: () => apiRequest(`/api/costforge/calculations?revalArea=${encodeURIComponent(revalArea)}`),
      enabled: !!revalArea,
    });
  };

  // Format calculation data for display
  const formatCalculation = (calculation: Calculation) => {
    return {
      ...calculation,
      formattedBaseCost: formatCurrency(parseFloat(calculation.baseCost || '0')),
      formattedTotalCost: formatCurrency(parseFloat(calculation.totalCost || '0')),
      formattedDate: calculation.createdAt ? new Date(calculation.createdAt).toLocaleDateString() : '',
    };
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  return {
    getAll,
    create,
    remove,
    getByBuildingType,
    getByRevalArea,
    formatCalculation,
    formatCurrency,
  };
}

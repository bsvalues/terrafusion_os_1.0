import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InsertComparable, Comparable } from '../types';
import { apiRequest } from '../lib/queryClient';

// Get all comparables for an appraisal
export const useComparables = (appraisalId: number) => {
  return useQuery({
    queryKey: ['/api/appraisals', appraisalId, 'comparables'],
    queryFn: () => apiRequest<Comparable[]>(`/api/appraisals/${appraisalId}/comparables`),
    enabled: !!appraisalId, // Only run the query if appraisalId is truthy
  });
};

// Get a single comparable by ID
export const useComparable = (id: number) => {
  return useQuery({
    queryKey: ['/api/comparables', id],
    queryFn: () => apiRequest<Comparable>(`/api/comparables/${id}`),
    enabled: !!id, // Only run the query if id is truthy
  });
};

// Create a new comparable
export const useCreateComparable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newComparable: InsertComparable) => 
      apiRequest<Comparable>('/api/comparables', {
        method: 'POST',
        body: JSON.stringify(newComparable),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comparables'] });
      
      // Also invalidate appraisal-specific comparables list
      if (data.appraisal_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/appraisals', data.appraisal_id, 'comparables'] 
        });
      }
    },
  });
};

// Update a comparable
export const useUpdateComparable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Comparable> }) =>
      apiRequest<Comparable>(`/api/comparables/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comparables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/comparables', variables.id] });
      
      // Also invalidate appraisal-specific comparables list
      if (data.appraisal_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/appraisals', data.appraisal_id, 'comparables'] 
        });
      }
    },
  });
};

// Delete a comparable
export const useDeleteComparable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (comparable: Comparable) =>
      apiRequest(`/api/comparables/${comparable.id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/comparables'] });
      queryClient.invalidateQueries({ queryKey: ['/api/comparables', variables.id] });
      
      // Also invalidate appraisal-specific comparables list
      if (variables.appraisal_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/appraisals', variables.appraisal_id, 'comparables'] 
        });
      }
    },
  });
};
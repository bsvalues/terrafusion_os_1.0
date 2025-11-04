import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InsertAppraisal, Appraisal } from '../types';
import { apiRequest } from '../lib/queryClient';

// Get all appraisals
export const useAppraisals = () => {
  return useQuery({
    queryKey: ['/api/appraisals'],
    queryFn: () => apiRequest<Appraisal[]>('/api/appraisals'),
  });
};

// Get a single appraisal by ID
export const useAppraisal = (id: number) => {
  return useQuery({
    queryKey: ['/api/appraisals', id],
    queryFn: () => apiRequest<Appraisal>(`/api/appraisals/${id}`),
    enabled: !!id, // Only run the query if id is truthy
  });
};

// Get appraisals by property ID
export const useAppraisalsByProperty = (propertyId: number) => {
  return useQuery({
    queryKey: ['/api/properties', propertyId, 'appraisals'],
    queryFn: () => apiRequest<Appraisal[]>(`/api/properties/${propertyId}/appraisals`),
    enabled: !!propertyId, // Only run the query if propertyId is truthy
  });
};

// Get appraisals by appraiser ID
export const useAppraisalsByAppraiser = (appraiserId: number) => {
  return useQuery({
    queryKey: ['/api/appraisers', appraiserId, 'appraisals'],
    queryFn: () => apiRequest<Appraisal[]>(`/api/appraisers/${appraiserId}/appraisals`),
    enabled: !!appraiserId, // Only run the query if appraiserId is truthy
  });
};

// Create a new appraisal
export const useCreateAppraisal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newAppraisal: InsertAppraisal) => 
      apiRequest<Appraisal>('/api/appraisals', {
        method: 'POST',
        body: JSON.stringify(newAppraisal),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals'] });
      
      // Also invalidate property-specific appraisals list
      if (data.property_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties', data.property_id, 'appraisals'] 
        });
      }
      
      // Also invalidate appraiser-specific appraisals list
      if (data.appraiser_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/appraisers', data.appraiser_id, 'appraisals'] 
        });
      }
    },
  });
};

// Update an appraisal
export const useUpdateAppraisal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Appraisal> }) =>
      apiRequest<Appraisal>(`/api/appraisals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals', variables.id] });
      
      // Also invalidate property-specific appraisals list
      if (data.property_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties', data.property_id, 'appraisals'] 
        });
      }
      
      // Also invalidate appraiser-specific appraisals list
      if (data.appraiser_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/appraisers', data.appraiser_id, 'appraisals'] 
        });
      }
    },
  });
};

// Delete an appraisal
export const useDeleteAppraisal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appraisal: Appraisal) =>
      apiRequest(`/api/appraisals/${appraisal.id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals', variables.id] });
      
      // Also invalidate property-specific appraisals list
      if (variables.property_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/properties', variables.property_id, 'appraisals'] 
        });
      }
      
      // Also invalidate appraiser-specific appraisals list
      if (variables.appraiser_id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/appraisers', variables.appraiser_id, 'appraisals'] 
        });
      }
      
      // Also invalidate comparables for this appraisal
      queryClient.invalidateQueries({ 
        queryKey: ['/api/appraisals', variables.id, 'comparables'] 
      });
    },
  });
};
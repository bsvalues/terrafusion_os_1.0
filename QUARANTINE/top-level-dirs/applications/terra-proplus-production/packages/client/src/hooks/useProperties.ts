import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InsertProperty, Property } from '../types';
import { apiRequest } from '../lib/queryClient';

// Get all properties
export const useProperties = () => {
  return useQuery({
    queryKey: ['/api/properties'],
    queryFn: () => apiRequest<Property[]>('/api/properties'),
  });
};

// Get a single property by ID
export const useProperty = (id: number) => {
  return useQuery({
    queryKey: ['/api/properties', id],
    queryFn: () => apiRequest<Property>(`/api/properties/${id}`),
    enabled: !!id, // Only run the query if id is truthy
  });
};

// Create a new property
export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newProperty: InsertProperty) => 
      apiRequest<Property>('/api/properties', {
        method: 'POST',
        body: JSON.stringify(newProperty),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
  });
};

// Update a property
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Property> }) =>
      apiRequest<Property>(`/api/properties/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties', variables.id] });
      // Also invalidate any appraisals that might reference this property
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals'] });
    },
  });
};

// Delete a property
export const useDeleteProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (property: Property) =>
      apiRequest(`/api/properties/${property.id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties', variables.id] });
      // Also invalidate appraisals as they may reference this property
      queryClient.invalidateQueries({ queryKey: ['/api/appraisals'] });
    },
  });
};
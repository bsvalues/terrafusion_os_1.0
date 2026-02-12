/**
 * usePropertyData - Custom hook for loading and managing property data
 * Fetches property data from the server with caching and error handling
 *
 * TerraFusion OS - Government. Transcended.
 */

import { useQuery } from '@tanstack/react-query';
import type { Property } from '@shared/schema';

interface PropertyDataResponse {
  success: boolean;
  data: Property[];
  count: number;
  terrafusion: {
    agent_id: string;
    data_source: string;
    confidence: string;
  };
}

interface UsePropertyDataOptions {
  limit?: number;
  enabled?: boolean;
}

export function usePropertyData(options: UsePropertyDataOptions = {}) {
  const { limit = 100, enabled = true } = options;

  return useQuery({
    queryKey: ['properties', limit],
    queryFn: async (): Promise<Property[]> => {
      const response = await fetch(`/api/properties?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch properties: ${response.statusText}`);
      }

      const result: PropertyDataResponse = await response.json();
      
      if (!result.success) {
        throw new Error('Property data fetch failed');
      }

      return result.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * usePropertyById - Fetch a single property by ID
 */
export function usePropertyById(propertyId: string | null) {
  return useQuery({
    queryKey: ['property', propertyId],
    queryFn: async (): Promise<Property | null> => {
      if (!propertyId) return null;

      const response = await fetch(`/api/properties/${propertyId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch property: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000, // 10 minutes for individual properties
    refetchOnWindowFocus: false,
  });
}

/**
 * usePropertySearch - Search properties by criteria
 */
interface PropertySearchCriteria {
  city?: string;
  propertyType?: string;
  minValue?: number;
  maxValue?: number;
  neighborhood?: string;
}

export function usePropertySearch(criteria: PropertySearchCriteria, enabled: boolean = true) {
  return useQuery({
    queryKey: ['property-search', criteria],
    queryFn: async (): Promise<Property[]> => {
      const params = new URLSearchParams();
      
      if (criteria.city) params.append('city', criteria.city);
      if (criteria.propertyType) params.append('propertyType', criteria.propertyType);
      if (criteria.minValue) params.append('minValue', criteria.minValue.toString());
      if (criteria.maxValue) params.append('maxValue', criteria.maxValue.toString());
      if (criteria.neighborhood) params.append('neighborhood', criteria.neighborhood);

      const response = await fetch(`/api/properties/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Property search failed: ${response.statusText}`);
      }

      const result: PropertyDataResponse = await response.json();
      return result.data;
    },
    enabled: enabled && Object.keys(criteria).length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes for search results
    refetchOnWindowFocus: false,
  });
}


import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Neighborhood = Tables<"neighborhoods"> & {
  counties?: {
    name: string;
    state: string;
    fips_code?: string;
  };
};

export function useNeighborhoods(countyId?: string) {
  return useQuery({
    queryKey: ["neighborhoods", countyId],
    queryFn: async () => {
      if (!countyId) return [];
      
      const { data, error } = await supabase
        .from("neighborhoods")
        .select(`
          *,
          counties:county_id (
            name,
            state,
            fips_code
          )
        `)
        .eq("county_id", countyId)
        .eq("active", true)
        .order("name");

      if (error) {
        console.error("Failed to fetch neighborhoods:", error);
        throw error;
      }
      return data as Neighborhood[];
    },
    enabled: !!countyId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useNeighborhood(neighborhoodId: string) {
  return useQuery({
    queryKey: ["neighborhood", neighborhoodId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighborhoods")
        .select(`
          *,
          counties:county_id (
            name,
            state,
            fips_code
          )
        `)
        .eq("id", neighborhoodId)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch neighborhood:", error);
        throw error;
      }
      return data as Neighborhood | null;
    },
    enabled: !!neighborhoodId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

// Mock function for spatial neighborhood queries until PostGIS functions are available
export function useNeighborhoodsByLocation(latitude: number, longitude: number) {
  return useQuery({
    queryKey: ["neighborhoods", "by-location", latitude, longitude],
    queryFn: async () => {
      console.log("PostGIS spatial functions not available yet - returning empty array");
      return [] as Neighborhood[];
    },
    enabled: !!(latitude && longitude),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
